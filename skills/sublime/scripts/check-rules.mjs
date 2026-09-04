#!/usr/bin/env node
/**
 * Decides whether every decision table in a document is complete and unambiguous.
 *
 * A combination nobody wrote a rule for is a question the business never answered,
 * and the agent will answer it by inventing. Two rules over the same combination is
 * the same defect wearing the opposite coat: the answer depends on which rule is read
 * first, so two conversations decide differently on identical input.
 *
 *   node check-rules.mjs <file.md> [...more.md]
 */
import { Findings, argsOrUsage, readText } from './report.mjs'

const ANY = '*'
/** Above this, a missing combination is counted instead of named — a wall of thousands of rows helps nobody. */
const NAMEABLE = 2000

// ============================================================================
// Parsing
// ============================================================================

/** Every decision a document declares. A heading opens one; the table below it closes it. */
export function parseDecisions(source) {
  const decisions = []
  let current = null

  for (const line of source.split('\n')) {
    const heading = /^#{1,6}\s+Decision:\s*(.+?)\s*$/.exec(line)
    if (heading) {
      current = {
        name: heading[1],
        inputs: [],
        outputs: [],
        rows: [],
        table: [],
      }
      decisions.push(current)
      continue
    }
    if (!current) continue

    const input = /^\s*-\s*input:\s*([\w-]+)\s*=\s*(.+?)\s*$/.exec(line)
    if (input) {
      current.inputs.push({
        name: input[1],
        domain: input[2]
          .split('|')
          .map((value) => value.trim())
          .filter(Boolean),
      })
      continue
    }

    const output = /^\s*-\s*output:\s*([\w-]+)\s*$/.exec(line)
    if (output) {
      current.outputs.push(output[1])
      continue
    }

    if (line.trim().startsWith('|')) current.table.push(cells(line))
  }

  for (const decision of decisions) decision.rows = rowsOf(decision.table)
  return decisions
}

function cells(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())
}

/** The table without its header and without the dashes that separate it. */
function rowsOf(table) {
  const body = table.filter(
    (row) => !row.every((cell) => /^:?-{2,}:?$/.test(cell)),
  )
  return body.slice(1).map((cells, index) => ({ cells, line: index + 1 }))
}

// ============================================================================
// Judgement
// ============================================================================

/** The values one rule admits for one input — a wildcard admits the whole domain. */
function admitted(cell, domain) {
  return cell === ANY ? domain : [cell]
}

function overlap(left, right, inputs) {
  return inputs.every(({ domain }, index) => {
    const a = admitted(left.cells[index] ?? '', domain)
    const b = admitted(right.cells[index] ?? '', domain)
    return a.some((value) => b.includes(value))
  })
}

/** How many concrete combinations one rule covers. */
function volume(row, inputs) {
  return inputs.reduce(
    (total, { domain }, index) =>
      total * admitted(row.cells[index] ?? '', domain).length,
    1,
  )
}

function combinations(inputs) {
  return inputs.reduce(
    (all, { domain }) =>
      all.flatMap((prefix) => domain.map((value) => [...prefix, value])),
    [[]],
  )
}

function covers(row, combination, inputs) {
  return inputs.every(({ domain }, index) =>
    admitted(row.cells[index] ?? '', domain).includes(combination[index]),
  )
}

export function judge(decision, findings) {
  const { name, inputs, outputs, rows, table } = decision
  const where = `Decision: ${name}`

  if (inputs.length === 0)
    return findings.add(
      where,
      'nenhuma entrada declarada — escreva `- input: nome = a | b`',
    )
  if (outputs.length === 0)
    return findings.add(
      where,
      'nenhuma saída declarada — escreva `- output: nome`',
    )
  if (rows.length === 0)
    return findings.add(where, 'a tabela não tem nenhuma regra')

  const width = inputs.length + outputs.length
  const header = table[0] ?? []
  for (const [index, input] of inputs.entries()) {
    if (header[index] !== input.name) {
      findings.add(
        where,
        `coluna ${index + 1} da tabela é "${header[index] ?? '—'}" e a entrada declarada é "${input.name}"`,
      )
    }
  }

  for (const row of rows) {
    if (row.cells.length !== width) {
      findings.add(
        where,
        `regra ${row.line} tem ${row.cells.length} colunas e a decisão declara ${width}`,
      )
      continue
    }
    for (const [index, input] of inputs.entries()) {
      const cell = row.cells[index]
      if (cell !== ANY && !input.domain.includes(cell)) {
        findings.add(
          where,
          `regra ${row.line} usa "${cell}" em ${input.name}, fora do domínio declarado (${input.domain.join(' | ')})`,
        )
      }
    }
    for (const [index, output] of outputs.entries()) {
      if (!row.cells[inputs.length + index]) {
        findings.add(where, `regra ${row.line} não decide ${output}`)
      }
    }
  }

  // A rule already reported as malformed is left out of the coverage arithmetic: counting it
  // would let a defect pay for the combinations it never legitimately covered.
  const sound = rows.filter(
    (row) =>
      row.cells.length === width &&
      inputs.every(
        ({ domain }, index) =>
          row.cells[index] === ANY || domain.includes(row.cells[index]),
      ),
  )

  let overlapping = false
  for (const [index, left] of sound.entries()) {
    for (const right of sound.slice(index + 1)) {
      if (!overlap(left, right, inputs)) continue
      overlapping = true
      findings.add(
        where,
        `regras ${left.line} e ${right.line} se sobrepõem — a mesma entrada casa nas duas, e a decisão passa a depender de qual for lida primeiro`,
      )
    }
  }

  const space = inputs.reduce((total, { domain }) => total * domain.length, 1)

  if (space <= NAMEABLE) {
    const missing = combinations(inputs).filter(
      (combination) => !sound.some((row) => covers(row, combination, inputs)),
    )
    if (missing.length === 0) return
    const named = missing
      .slice(0, 8)
      .map((combination) => combination.join(' + '))
      .join(' · ')
    findings.add(
      where,
      `${missing.length} combinação(ões) sem regra: ${named}${missing.length > 8 ? ' …' : ''}`,
    )
    return
  }

  // Summing what each rule covers only decides completeness while nothing is counted twice.
  if (overlapping) {
    return findings.add(
      where,
      `espaço de ${space} combinações grande demais para enumerar, e há sobreposição — corrija as sobreposições e rode de novo`,
    )
  }
  const covered = sound.reduce((total, row) => total + volume(row, inputs), 0)
  if (covered !== space)
    findings.add(
      where,
      `${space - covered} combinação(ões) sem regra num espaço de ${space}`,
    )
}

// ============================================================================
// Entry
// ============================================================================

export function check(sources) {
  const findings = new Findings()
  let count = 0
  for (const { path, text } of sources) {
    const decisions = parseDecisions(text)
    if (decisions.length === 0)
      findings.add(
        path,
        'nenhuma decisão declarada — o cabeçalho é `# Decision: <nome>`',
      )
    for (const decision of decisions) judge(decision, findings)
    count += decisions.length
  }
  return { findings, count }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const paths = argsOrUsage('check-rules.mjs <file.md> [...]', 1)
  const { findings, count } = check(
    paths.map((path) => ({ path, text: readText(path) })),
  )
  process.exit(
    findings.settle(
      'Tabelas de decisão',
      `${count} decisão(ões) completas e sem sobreposição`,
    ),
  )
}
