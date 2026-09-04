#!/usr/bin/env node
/**
 * Decides whether the question put to the quality gate was a complete question.
 *
 * The platform judges the agent; this judges the submission. A PASS over a thin
 * suite is a true statement about a weak question, and the two verdicts must never
 * be confused: nothing here re-judges behaviour.
 *
 *   node check-submission.mjs <dossier.json>
 */
import { Findings, argsOrUsage, mentions, readJson } from './report.mjs'

/** Every act of the agent that can deviate. The sweep is this list against every deviation. */
export const ACTIONS = [
  'procedure-open',
  'field-collect',
  'source-cite',
  'reply',
  'work-close',
  'follow-up-arm',
  'resume',
  'handoff',
  'consequential-reach',
]

/** The four ways any control action goes wrong, whatever the action is. */
export const DEVIATIONS = ['when-not', 'not-when', 'out-of-order', 'duration']

export const SWEEP_SIZE = ACTIONS.length * DEVIATIONS.length

const traced = (scenarios, id) =>
  scenarios.filter((scenario) => mentions(scenario.name ?? '', id))

export function check(dossier) {
  const findings = new Findings()
  const scenarios = dossier.scenarios ?? []
  const clauses = dossier.contract?.clauses ?? []

  if (scenarios.length === 0)
    findings.add('cenários', 'o dossiê não traz nenhum cenário')
  if (clauses.length === 0)
    findings.add('contrato', 'o dossiê não traz nenhuma cláusula')

  // 1 · every clause reaches the ruler
  for (const clause of clauses) {
    if (traced(scenarios, clause.id).length === 0) {
      findings.add(
        `cláusula ${clause.id}`,
        'nenhum cenário a cita pelo nome — ela não foi medida',
      )
    }
  }

  // 2 · every decision row reaches the ruler
  for (const { table, rows = [] } of dossier.rules ?? []) {
    for (const row of rows) {
      if (traced(scenarios, row).length === 0) {
        findings.add(
          `regra ${row} (${table})`,
          'nenhum cenário a cita — a linha da tabela nunca foi exercida',
        )
      }
    }
  }

  // 3 · the deviation sweep is closed
  const sweep = new Map(
    (dossier.sweep ?? []).map((entry) => [
      `${entry.action}:${entry.deviation}`,
      entry,
    ]),
  )
  for (const action of ACTIONS) {
    for (const deviation of DEVIATIONS) {
      const entry = sweep.get(`${action}:${deviation}`)
      if (!entry) {
        findings.add(
          `varredura ${action}/${deviation}`,
          'célula não considerada — declare um cenário ou dispense com razão',
        )
      } else if (entry.status === 'dispensed' && !entry.reason?.trim()) {
        findings.add(
          `varredura ${action}/${deviation}`,
          'dispensada sem razão escrita',
        )
      } else if (entry.status !== 'dispensed' && entry.status !== 'declared') {
        findings.add(
          `varredura ${action}/${deviation}`,
          `estado "${entry.status}" não é nem declarada nem dispensada`,
        )
      }
    }
  }

  // 4·5·6 · each scenario qualifies as evidence
  for (const scenario of scenarios) {
    const { name, repetitions = 0, measured = 0, fresh } = scenario
    if (repetitions <= 1) {
      findings.add(
        `cenário ${name}`,
        `k=${repetitions} não qualifica frequência — é uma amostra`,
      )
    }
    if (measured < repetitions) {
      findings.add(
        `cenário ${name}`,
        `${repetitions - measured} repetição(ões) não medida(s) — o veredito repousa sobre amostra incompleta`,
      )
    }
    if (fresh !== true) {
      findings.add(
        `cenário ${name}`,
        'a prova não está fresca para a versão em publicação',
      )
    }
  }

  // 7 · every class handed to a person is exercised
  for (const { class: klass } of dossier.allocation ?? []) {
    const covering = traced(scenarios, klass).some((scenario) =>
      (scenario.expectations ?? []).some(
        (expectation) => expectation.type === 'handoff',
      ),
    )
    if (!covering)
      findings.add(
        `alocação ${klass}`,
        'nenhum cenário de handoff cobre esta classe de trabalho',
      )
  }

  // 8 · prohibition and provenance are stated where they were promised
  for (const clause of clauses) {
    const required =
      clause.kind === 'prohibition'
        ? 'forbidden'
        : clause.kind === 'grounding'
          ? 'grounding'
          : null
    if (!required) continue
    const stated = traced(scenarios, clause.id).some((scenario) =>
      (scenario.expectations ?? []).some(
        (expectation) => expectation.type === required,
      ),
    )
    if (!stated)
      findings.add(
        `cláusula ${clause.id}`,
        `é de ${clause.kind} e nenhum cenário dela declara expectativa \`${required}\``,
      )
  }

  if (!dossier.verdict?.outcome)
    findings.add('veredito', 'o dossiê não traz o desfecho do portão')

  return findings
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [path] = argsOrUsage('check-submission.mjs <dossier.json>', 1)
  const dossier = readJson(path)
  const findings = check(dossier)
  const clauses = dossier.contract?.clauses?.length ?? 0
  const rows = (dossier.rules ?? []).reduce(
    (total, rule) => total + (rule.rows?.length ?? 0),
    0,
  )
  const code = findings.settle(
    'Submissão',
    `${clauses}/${clauses} cláusulas · ${rows}/${rows} regras · varredura ${SWEEP_SIZE}/${SWEEP_SIZE} · 0 não medidos`,
  )
  if (code === 0)
    console.log(
      '  a conferência nº 9 (números do relatório) roda em check-report.mjs',
    )
  process.exit(code)
}
