#!/usr/bin/env node
/**
 * Decides whether the final report says only what the platform measured.
 *
 * The report is what a third party inspects, so one number that does not reconcile
 * destroys the credibility of every number that does. Prose is left alone; the
 * sections that carry claims are held against the dossier.
 *
 *   node check-report.mjs <relatorio.md> <dossie.json>
 */
import {
  Findings,
  argsOrUsage,
  mentions,
  readJson,
  readText,
} from './report.mjs'

/** The sections the model requires, matched by the distinctive word in each heading. */
export const SECTIONS = [
  'Responsabilidade',
  'Processo',
  'Alocação',
  'Como funciona',
  'Decisões formalizadas',
  'correto',
  'Premissas',
  'Decisões do projeto',
  'O que foi medido',
  'Competência',
  'Confiabilidade',
  'Custo',
  'Latência',
  'Falhas',
  'Limites',
  'Veredito',
]

/** Where a claim lives. Prose elsewhere may carry a number without answering to the dossier. */
const MEASURED = [
  'O que foi medido',
  'Competência',
  'Confiabilidade',
  'Custo',
  'Latência',
  'Veredito',
]

/** Guarded on both sides so the hyphen inside an identifier like `C-01` never reads as a minus sign. */
const NUMBER = /(?<![\w-])-?\d+(?:[.,]\d+)?(?![\w-])/g
/** A year reads as a number and never states a measure. */
const isYear = (value) =>
  Number.isInteger(value) && value >= 1900 && value <= 2100

/** Splits a document at its headings, so a section can be judged by what it is for. */
export function sections(markdown) {
  const found = []
  let current = null
  for (const line of markdown.split('\n')) {
    const heading = /^#{1,6}\s+(.+?)\s*$/.exec(line)
    if (heading) {
      current = { title: heading[1], body: [] }
      found.push(current)
      continue
    }
    if (current) current.body.push(line)
  }
  return found.map(({ title, body }) => ({ title, body: body.join('\n') }))
}

/** Every number the dossier states, at any depth — the closure a claim must fall inside. */
export function numbersOf(value, into = new Set()) {
  if (typeof value === 'number') into.add(value)
  else if (Array.isArray(value)) for (const item of value) numbersOf(item, into)
  else if (value && typeof value === 'object')
    for (const item of Object.values(value)) numbersOf(item, into)
  return into
}

function claimed(body) {
  return [...body.matchAll(NUMBER)].map((match) =>
    Number(match[0].replace(',', '.')),
  )
}

export function check(markdown, dossier) {
  const findings = new Findings()
  const found = sections(markdown)
  const titles = found.map(({ title }) => title)

  for (const section of SECTIONS) {
    const present = titles.some((title) =>
      title.toLowerCase().includes(section.toLowerCase()),
    )
    if (!present) findings.add(`seção "${section}"`, 'ausente do relatório')
  }

  const known = numbersOf(dossier)
  for (const { title, body } of found) {
    if (
      !MEASURED.some((name) => title.toLowerCase().includes(name.toLowerCase()))
    )
      continue
    for (const value of claimed(body)) {
      if (known.has(value) || isYear(value)) continue
      findings.add(
        `seção "${title}"`,
        `afirma ${value}, que não existe no dossiê`,
      )
    }
  }

  const scenarios = dossier.scenarios ?? []
  const measured = found.find(({ title }) =>
    title.toLowerCase().includes('o que foi medido'),
  )
  for (const scenario of scenarios) {
    if (!measured || !mentions(measured.body, scenario.name)) {
      findings.add(
        `cenário ${scenario.name}`,
        'não aparece na seção "O que foi medido"',
      )
      continue
    }
    const line =
      measured.body.split('\n').find((text) => mentions(text, scenario.name)) ??
      ''
    if (!claimed(line).includes(scenario.repetitions)) {
      findings.add(
        `cenário ${scenario.name}`,
        `a linha não nomeia k=${scenario.repetitions} — uma medida sem k declarado não qualifica frequência`,
      )
    }
  }

  return findings
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [reportPath, dossierPath] = argsOrUsage(
    'check-report.mjs <relatorio.md> <dossie.json>',
    2,
  )
  const dossier = readJson(dossierPath)
  const findings = check(readText(reportPath), dossier)
  process.exit(
    findings.settle(
      'Relatório',
      `${SECTIONS.length} seções presentes · todo número reconciliado com o dossiê`,
    ),
  )
}
