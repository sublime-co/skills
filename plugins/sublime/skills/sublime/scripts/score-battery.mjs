#!/usr/bin/env node
/**
 * Scores a conversation battery against the quality ruler in references/quality.md.
 *
 * The ruler never asks for an impression: a reviewer points at failures, and the grade is
 * arithmetic over them. The deterministic criteria are computed here, so nobody judges them
 * by reading; the judged ones arrive as labels, each with the excerpt that proves it, and a
 * label without an excerpt does not count. A critical failure is never averaged away.
 *
 *   node score-battery.mjs <battery.json> [--previous <battery.json>] [--dmd <n | dim=n,...>] [--json]
 *
 * battery.json:
 *   {
 *     "agent": "…", "version": "…", "profile": "…",
 *     "target": { "style": "professional", "sentenceLength": "short", "emojiUsage": "none", "markdown": false },
 *     "bands": { "min": 0.3, "max": 3 },          // reply/contact length ratio, from the A/A; optional
 *     "gate": { "approved": true },                // the platform gate's verdict for this version
 *     "contact": { "name": "…" },                  // the name the test contact carries; optional
 *     "required": ["hostil", "injecao", …],        // strata the profile makes mandatory
 *     "scenarios": [{
 *       "id": "c1", "stratum": "hostil", "weight": 1, "central": false, "referenceTurns": 2,
 *       "runs": [{
 *         "messages": [{ "role": "CONTACT", "text": "…" }, { "role": "AGENT", "text": "…" }],
 *         "reached": true,                         // the scenario's expected outcome was reached
 *         "reviewed": false, "unclassifiedEdits": 0,
 *         "labels": [{ "criterion": "AG3", "message": 1, "excerpt": "…", "severity": "G" }]
 *       }]
 *     }]
 *   }
 *
 * `message` is the index of the message in `messages`. Roles other than CONTACT and AGENT are ignored.
 */
import { pathToFileURL } from 'node:url'
import { Findings, argsOrUsage, readJson } from './report.mjs'

export const DIMENSIONS = ['competente', 'confiavel', 'eficiente', 'agradavel']

const LABELS = {
  competente: 'Competente',
  confiavel: 'Confiável',
  eficiente: 'Eficiente',
  agradavel: 'Agradável',
}

const PARTS = ['factual', 'procedural', 'estabilidade']

/**
 * Every criterion of the ruler. `computed` ones are decided by this script and refuse a label:
 * a deterministic check that a reviewer could overrule would stop being deterministic.
 */
export const CATALOG = {
  CP1: { dimension: 'competente', severity: 'G' },
  CP2: { dimension: 'competente', severity: 'M' },
  CP3: { dimension: 'competente', severity: 'G' },
  CP4: { dimension: 'competente', severity: 'G/M' },
  CP5: { dimension: 'competente', severity: 'G' },
  CP6: { dimension: 'competente', severity: 'G', computed: true },
  CP7: { dimension: 'competente', severity: 'G' },
  CP8: { dimension: 'competente', severity: 'M' },
  CPP: { dimension: 'competente', severity: 'G/M' },
  CF1: { dimension: 'confiavel', part: 'factual', severity: 'C' },
  CF2: { dimension: 'confiavel', part: 'factual', severity: 'C' },
  CF3: { dimension: 'confiavel', part: 'factual', severity: 'C' },
  CF4: { dimension: 'confiavel', part: 'factual', severity: 'G' },
  CF5: { dimension: 'confiavel', part: 'factual', severity: 'C' },
  CF6: { dimension: 'confiavel', part: 'procedural', severity: 'C' },
  CF7: { dimension: 'confiavel', part: 'procedural', severity: 'C' },
  CF8: { dimension: 'confiavel', part: 'procedural', severity: 'C' },
  CF9: { dimension: 'confiavel', part: 'procedural', severity: 'C' },
  CF10: { dimension: 'confiavel', part: 'procedural', severity: 'G' },
  CF11: { dimension: 'confiavel', part: 'procedural', severity: 'G' },
  CF12: { dimension: 'confiavel', part: 'estabilidade', severity: 'G' },
  EF1: { dimension: 'eficiente', severity: 'G' },
  EF2: { dimension: 'eficiente', severity: 'G' },
  EF3: { dimension: 'eficiente', severity: 'G', computed: true },
  EF4: { dimension: 'eficiente', severity: 'M', computed: true },
  EF5: { dimension: 'eficiente', severity: 'M' },
  EF6: { dimension: 'eficiente', severity: 'M' },
  EF7: { dimension: 'eficiente', severity: 'M' },
  EF8: { dimension: 'eficiente', severity: 'M' },
  EF9: { dimension: 'eficiente', severity: 'G' },
  EF10: { dimension: 'eficiente', severity: 'G' },
  AG1: { dimension: 'agradavel', severity: 'G' },
  AG2: { dimension: 'agradavel', severity: 'M' },
  AG3: { dimension: 'agradavel', severity: 'G' },
  AG4: { dimension: 'agradavel', severity: 'M' },
  AG5: { dimension: 'agradavel', severity: 'M' },
  AG6: { dimension: 'agradavel', severity: 'G' },
  AG7: { dimension: 'agradavel', severity: 'M', computed: true },
  AG8: { dimension: 'agradavel', severity: 'M', computed: true },
  AG9: { dimension: 'agradavel', severity: 'M' },
  AG10: { dimension: 'agradavel', severity: 'M', computed: true },
  AG11: { dimension: 'agradavel', severity: 'G' },
  AG12: { dimension: 'agradavel', severity: 'M', computed: true },
  AG13: { dimension: 'agradavel', severity: 'M', computed: true },
  AG14: { dimension: 'agradavel', severity: 'M', computed: true },
  AG15: { dimension: 'agradavel', severity: 'M', computed: true },
  AG16: { dimension: 'agradavel', severity: 'G', computed: true },
  AG17: { dimension: 'agradavel', severity: 'M' },
  AG19: { dimension: 'agradavel', severity: 'M' },
  AG20: { dimension: 'agradavel', severity: 'M' },
}

/** Clichés and officialese of written Portuguese service. Every entry is a phrase, never a lone word, so ordinary speech does not trip it. */
/** Telling the contact what they feel is the formula of empathy, not empathy: the ruler wants the problem named instead. */
const DECLARED_FEELING =
  /\b(entendo|compreendo|imagino) (perfeitamente |totalmente )?(a |sua |o seu |seu )?(frustracao|irritacao|chateacao|preocupacao|insatisfacao|descontentamento)\b/

const CLICHES = [
  /fico (a|à) (sua )?disposicao/,
  /estou (a|à) (sua )?disposicao/,
  /nao hesite em/,
  /qualquer (outra )?duvida,? (e so|estou|fico)/,
  /espero ter ajudado/,
  /(otima|excelente|boa) pergunta/,
  /venho por meio/,
  /vou estar \w+ndo/,
  /(sinto muito|lamento|pedimos desculpas) pelo (transtorno|inconveniente)/,
  /estou aqui para (te )?ajudar/,
  /(fico feliz|e um prazer) em ajudar/,
  /informamos que/,
  /prezad[oa]/,
  /vale (ressaltar|destacar)/,
  /e importante (ressaltar|destacar|lembrar)/,
  /em suma/,
]

/** Words that point behind the curtain. They are also ordinary words in many domains, so they only nominate: a judge confirms AG11. */
const BACKSTAGE =
  /\b(base de conhecimento|minha base|na base|no sistema|sistema interno|ferramenta|etapa|instruc(ao|oes)|prompt|nao esta (informado|especificado)|segundo (o|a) (documento|base)|(conforme|de acordo com) (as )?informac(ao|oes) disponive(l|is)|informac(ao|oes) que (eu )?tenho (aqui|disponive(l|is)))\b/

const MARKDOWN = [
  /\*\*[^*\n]+\*\*/,
  /^#{1,6}\s/m,
  /^\s*\|.*\|\s*$/m,
  /\[[^\]\n]+\]\([^)\n]+\)/,
]

/** Plain-language limits for a reader on a phone: a sentence past 25 words gets split, and a paragraph past three sentences and 40 words carries more than one subject. Four short sentences read in one pass, so the paragraph needs both. They only point at density; a judge decides the rest of AG9. */
const SENTENCE_WORDS = 25
const PARAGRAPH_SENTENCES = 3
const PARAGRAPH_WORDS = 40

const EMOJI = /\p{Extended_Pictographic}/gu
const EMOJI_CEILING = { none: 0, light: 1, moderate: 2 }

const PENALTY = { C: 9, G: 3, M: 1 }
const BOOTSTRAP_SAMPLES = 2000

// ============================================================================
// Scoring
// ============================================================================

/** The bulletin of one battery: grades, intervals, status, coverage and the problems ranked by weight. */
export function score(battery) {
  const findings = new Findings()
  const scenarios = (battery.scenarios ?? []).map((scenario) => ({
    ...scenario,
    weight: scenario.weight ?? 1,
    runs: (scenario.runs ?? []).map((run, index) =>
      scoreRun(scenario, run, index, battery, findings),
    ),
  }))

  const runs = scenarios.flatMap((scenario) => scenario.runs)
  const missing = (battery.required ?? []).filter(
    (stratum) =>
      !scenarios.some(
        (scenario) => scenario.stratum === stratum && scenario.runs.length,
      ),
  )

  const dimensions = byDimension((dimension) =>
    aggregate(dimension, scenarios, missing),
  )
  const graded = DIMENSIONS.filter(
    (dimension) => dimensions[dimension].grade !== null,
  )
  const overall = graded.length
    ? graded.reduce((low, dimension) =>
        isBelow(dimensions[dimension], dimensions[low]) ? dimension : low,
      )
    : null

  return {
    findings,
    agent: battery.agent ?? '—',
    version: battery.version ?? '—',
    profile: battery.profile ?? '—',
    conversations: runs.length,
    scenarios: scenarios.length,
    missing,
    gate: battery.gate?.approved ?? null,
    dimensions,
    overall: overall && {
      dimension: overall,
      grade: dimensions[overall].grade,
    },
    status: status(dimensions, runs, battery.gate?.approved, missing),
    problems: problems(runs),
    candidates: runs.flatMap((run) => run.candidates),
    perScenario: Object.fromEntries(
      scenarios.map((scenario) => [scenario.id, scenario]),
    ),
  }
}

/** The shown grade decides; the raw one breaks a tie, so the overall names the dimension that is actually weakest. */
function isBelow(a, b) {
  return a.grade !== b.grade ? a.grade < b.grade : a.raw < b.raw
}

/** One conversation's failures and its grade in every dimension. */
function scoreRun(scenario, run, index, battery, findings) {
  const messages = run.messages ?? []
  const where = `${scenario.id} r${index + 1}`
  const detected = [
    ...detect(
      messages,
      battery.target ?? {},
      battery.bands,
      battery.contact?.name,
    ),
    ...outcome(scenario, run, messages),
  ]
  const failures = [
    ...detected,
    ...labels(run, where, findings).filter(
      (label) => !detected.some((entry) => sameFailure(entry, label)),
    ),
    ...unclassified(run),
  ]
  momentsCountTwice(failures, messages)

  const grades = Object.fromEntries(
    DIMENSIONS.map((dimension) => [
      dimension,
      grade(failures.filter((failure) => failure.dimension === dimension)),
    ]),
  )
  grades.confiavel = Math.min(...PARTS.map((part) => partGrade(failures, part)))

  return {
    where,
    scenario: scenario.id,
    failures,
    grades,
    parts: Object.fromEntries(
      PARTS.map((part) => [part, partGrade(failures, part)]),
    ),
    thirds: thirds(failures, messages),
    reached: run.reached,
    signed: isSigned(run),
    critical: failures.some((failure) => failure.severity === 'C'),
    candidates: backstage(messages, where),
  }
}

/**
 * The grade the ruler's arithmetic gives a set of failures. It stays raw: capping an unreviewed ten at
 * nine here would tie a clean conversation with one that failed once, and the minor failures — where
 * conversational quality lives — would vanish from every mean and every comparison.
 */
export function grade(failures) {
  if (failures.some((failure) => failure.severity === 'C')) return 2
  const graves = failures.filter((failure) => failure.severity === 'G').length
  const minors = failures.filter((failure) => failure.severity === 'M').length
  return Math.max(3, 10 - 3 * graves - Math.min(minors, 3))
}

function partGrade(failures, part) {
  return grade(failures.filter((failure) => failure.part === part))
}

function isSigned(run) {
  return run.reviewed === true && !run.unclassifiedEdits
}

function aggregate(dimension, scenarios, missing) {
  const weighted = scenarios.flatMap((scenario) =>
    scenario.runs.map((run) => ({
      weight: scenario.weight,
      value: run.grades[dimension],
    })),
  )
  if (!weighted.length)
    return { grade: null, provisional: null, interval: null, worst: null }

  let value = weightedMean(weighted)
  const runs = scenarios.flatMap((scenario) => scenario.runs)
  const hasCritical = runs.some((run) =>
    run.failures.some(
      (failure) => failure.dimension === dimension && failure.severity === 'C',
    ),
  )
  if (hasCritical) value = Math.min(value, 4)
  if (dimension === 'competente' && centralOutcomeMissed(scenarios))
    value = Math.min(value, 6)

  const shown = signedCeiling(roundHalf(value), runs)
  const worst = runs.reduce((low, run) =>
    run.grades[dimension] < low.grades[dimension] ? run : low,
  )

  return {
    grade: missing.length ? null : shown,
    provisional: shown,
    raw: round1(value),
    interval: interval(scenarios, (run) => run.grades[dimension]),
    worst: { where: worst.where, grade: worst.grades[dimension] },
    parts:
      dimension === 'confiavel'
        ? Object.fromEntries(
            PARTS.map((part) => [
              part,
              signedCeiling(
                roundHalf(
                  weightedMean(
                    scenarios.flatMap((scenario) =>
                      scenario.runs.map((run) => ({
                        weight: scenario.weight,
                        value: run.parts[part],
                      })),
                    ),
                  ),
                ),
                runs,
              ),
            ]),
          )
        : undefined,
    thirds:
      dimension === 'agradavel'
        ? [0, 1, 2].map((third) =>
            roundHalf(
              mean(
                runs
                  .map((run) => run.thirds[third])
                  .filter((value) => value !== null),
              ),
            ),
          )
        : undefined,
  }
}

/** The four dimensions as named keys, so a reader of the bulletin never indexes into a guess. */
function byDimension(valueOf) {
  return {
    competente: valueOf('competente'),
    confiavel: valueOf('confiavel'),
    eficiente: valueOf('eficiente'),
    agradavel: valueOf('agradavel'),
  }
}

/** Ten is the reviewer's word, never the arithmetic's: without every conversation signed, the shown grade stops at nine. */
function signedCeiling(value, runs) {
  return value > 9 && !runs.every((run) => run.signed) ? 9 : value
}

function centralOutcomeMissed(scenarios) {
  return scenarios.some(
    (scenario) =>
      scenario.central &&
      scenario.runs.length &&
      scenario.runs.every((run) => run.reached === false),
  )
}

function status(dimensions, runs, gateApproved, missing) {
  if (runs.some((run) => run.critical)) return 'não apto'
  if (gateApproved === false) return 'não apto'
  if (missing.length) return 'sem nota: cobertura insuficiente'
  if (gateApproved !== true) return 'indeterminado: portão não informado'

  const { competente, confiavel, eficiente, agradavel } = Object.fromEntries(
    DIMENSIONS.map((dimension) => [dimension, dimensions[dimension].grade]),
  )
  const apt =
    confiavel >= 9 && competente >= 7 && eficiente >= 7 && agradavel >= 7
  if (!apt) return 'não apto'
  return [competente, confiavel, eficiente, agradavel].every(
    (value) => value >= 9,
  )
    ? 'excelente'
    : 'apto'
}

/** Pareto of criteria by severity × conversations affected, each with the first excerpt that shows it. */
function problems(runs) {
  const byCriterion = new Map()
  for (const run of runs) {
    for (const criterion of new Set(
      run.failures.map((failure) => failure.criterion),
    )) {
      const first = run.failures.find(
        (failure) => failure.criterion === criterion,
      )
      const entry = byCriterion.get(criterion) ?? {
        criterion,
        severity: first.severity,
        conversations: 0,
        example: `${run.where} m${first.message}: "${first.excerpt}"`,
      }
      entry.conversations += 1
      byCriterion.set(criterion, entry)
    }
  }
  return [...byCriterion.values()]
    .map((entry) => ({
      ...entry,
      weight: PENALTY[entry.severity] * entry.conversations,
    }))
    .sort((a, b) => b.weight - a.weight)
}

// ============================================================================
// Deterministic criteria
// ============================================================================

/** Every failure the transcript alone proves. `contactName` is the name the contact carries, when the battery knows it. */
export function detect(messages, target, bands, contactName) {
  const failures = []
  const agentAt = messages
    .map((message, index) => ({ ...message, index }))
    .filter((message) => message.role === 'AGENT')
  const add = (criterion, message, excerpt) =>
    failures.push(failure(criterion, message.index, excerpt))

  const askedBefore = []
  const closings = new Set()
  const firstName = contactName ? words(normalize(contactName))[0] : null
  let previousOpener = null
  let previousNamed = false

  for (const message of agentAt) {
    const text = message.text ?? ''
    const plain = normalize(text)

    const questions = text.match(/\?+/g) ?? []
    if (questions.length > 1) add('AG7', message, clip(text))

    if (!target.markdown) {
      const markup = MARKDOWN.map((pattern) => text.match(pattern)).find(
        Boolean,
      )
      if (markup) add('AG10', message, markup[0])
    }

    const dense = densityOf(text)
    if (dense) add('AG9', message, dense)

    const cliche = CLICHES.map((pattern) => plain.match(pattern)).find(Boolean)
    if (cliche) add('AG12', message, cliche[0])

    const feeling = plain.match(DECLARED_FEELING)
    if (feeling) add('AG4', message, feeling[0])

    const dash = text.match(/.{0,20}[—–].{0,20}/)
    if (dash) add('AG13', message, dash[0])

    const opener = openerOf(plain)
    const named =
      firstName !== null && words(plain).slice(0, 3).includes(firstName)
    if (opener && opener === previousOpener) add('AG14', message, opener)
    else if (named && previousNamed)
      add('AG14', message, `${firstName} abrindo de novo`)
    previousOpener = opener
    previousNamed = named

    const closing = closingOf(plain)
    if (closing && closings.has(closing)) add('AG15', message, closing)
    if (closing) closings.add(closing)

    for (const question of questionsOf(plain)) {
      if (askedBefore.some((asked) => similar(asked, question)))
        add('AG16', message, question)
      askedBefore.push(question)
    }

    const ceiling = EMOJI_CEILING[target.emojiUsage]
    const emoji = text.match(EMOJI) ?? []
    if (ceiling !== undefined && emoji.length > ceiling)
      add('AG19', message, emoji.join(''))

    const ratio = lengthRatio(messages, message.index)
    if (bands && ratio !== null && (ratio < bands.min || ratio > bands.max))
      add('AG8', message, `razão ${ratio.toFixed(2)}`)
  }

  failures.push(...genderShift(agentAt))
  return failures
}

function outcome(scenario, run, messages) {
  const failures = []
  if (run.reached === false)
    failures.push(
      failure('CP6', lastAgentIndex(messages), 'desfecho não alcançado'),
    )

  const reference = scenario.referenceTurns
  if (typeof reference !== 'number') return failures
  const turns = messages.filter((message) => message.role === 'CONTACT').length
  if (turns > reference + 2)
    failures.push(
      failure(
        'EF3',
        lastAgentIndex(messages),
        `${turns} turnos contra ${reference}`,
      ),
    )
  else if (turns > reference + 1)
    failures.push(
      failure(
        'EF4',
        lastAgentIndex(messages),
        `${turns} turnos contra ${reference}`,
      ),
    )
  return failures
}

/** The judged and reviewed failures. A label the ruler cannot hold is a finding, never a silent count. */
function labels(run, where, findings) {
  return (run.labels ?? []).flatMap((label) => {
    const entry = CATALOG[label.criterion]
    const at = `${where} · ${label.criterion}`
    if (!entry) {
      findings.add(at, 'critério que a régua não declara')
      return []
    }
    if (entry.computed) {
      findings.add(
        at,
        'critério determinístico: o script calcula, não se rotula',
      )
      return []
    }
    if (!label.excerpt?.trim()) {
      findings.add(at, 'falha sem trecho não conta — cite o trecho que a prova')
      return []
    }
    const severity = entry.severity.includes('/')
      ? label.severity
      : entry.severity
    if (!['C', 'G', 'M'].includes(severity)) {
      findings.add(at, `declare a gravidade (${entry.severity})`)
      return []
    }
    return [
      { ...failure(label.criterion, label.message, label.excerpt), severity },
    ]
  })
}

/** An edit the reviewer could not file under any criterion still cost the reader something, and it marks a hole in the ruler. */
function unclassified(run) {
  return Array.from({ length: run.unclassifiedEdits ?? 0 }, () =>
    failure('AG20', null, 'edição não classificada'),
  )
}

/**
 * Opening and closing weigh disproportionately in how a service encounter is remembered (AG18), so a
 * failure there counts again under its own criterion. A conversation of one reply has no moments: that
 * reply is the whole conversation, and doubling it would only double everything.
 */
function momentsCountTwice(failures, messages) {
  const agent = messages
    .map((message, index) => ({ ...message, index }))
    .filter((message) => message.role === 'AGENT')
  if (agent.length < 2) return
  const edges = new Set([agent[0].index, agent.at(-1).index])
  const doubled = failures
    .filter(
      (entry) =>
        entry.dimension === 'agradavel' &&
        entry.severity !== 'C' &&
        edges.has(entry.message),
    )
    .map((entry) => ({ ...entry, moment: true }))
  failures.push(...doubled)
}

function sameFailure(a, b) {
  return a.criterion === b.criterion && a.message === b.message
}

function thirds(failures, messages) {
  const agent = messages
    .map((message, index) => index)
    .filter((index) => messages[index].role === 'AGENT')
  if (!agent.length) return [null, null, null]
  const thirdOf = (index) =>
    Math.min(2, Math.floor((agent.indexOf(index) * 3) / agent.length))
  return [0, 1, 2].map((third) => {
    if (!agent.some((index) => thirdOf(index) === third)) return null
    return grade(
      failures.filter(
        (entry) =>
          entry.dimension === 'agradavel' &&
          entry.message !== null &&
          agent.includes(entry.message) &&
          thirdOf(entry.message) === third,
      ),
    )
  })
}

function backstage(messages, where) {
  return messages.flatMap((message, index) => {
    if (message.role !== 'AGENT') return []
    const hit = normalize(message.text ?? '').match(BACKSTAGE)
    return hit ? [{ where: `${where} m${index}`, term: hit[0] }] : []
  })
}

/** The first sign that the reply was packed to save space: a semicolon, a sentence too long to read in one pass, or a paragraph holding more than one subject. A paragraph of several lines is a list, and only its lines are measured. */
function densityOf(text) {
  const semicolon = text.match(/[^;\n]{0,30};[^;\n]{0,30}/)
  if (semicolon) return semicolon[0].trim()
  for (const paragraph of text.split(/\n\s*\n/)) {
    const lines = paragraph.split('\n').filter((line) => line.trim())
    const sentences = lines
      .flatMap((line) => line.split(/(?<=[.!?])\s+/))
      .filter((sentence) => sentence.trim())
    const long = sentences.find(
      (sentence) => words(sentence).length > SENTENCE_WORDS,
    )
    if (long) return clip(long.trim())
    if (
      lines.length === 1 &&
      sentences.length > PARAGRAPH_SENTENCES &&
      words(paragraph).length > PARAGRAPH_WORDS
    )
      return `${sentences.length} frases num parágrafo`
  }
  return null
}

/** An agent that thanks as "obrigado" and later as "obrigada" changed who it is mid-conversation. */
function genderShift(agentAt) {
  let first = null
  for (const message of agentAt) {
    const form = normalize(message.text ?? '').match(/\bobrigad([oa])\b/)
    if (!form) continue
    if (first === null) first = form[1]
    else if (form[1] !== first) return [failure('AG17', message.index, form[0])]
  }
  return []
}

// ============================================================================
// Comparison
// ============================================================================

/** Whether each dimension moved beyond noise: past the DMD of the A/A, with a paired interval that excludes zero. */
export function compare(current, previous, dmd) {
  const critical = (report) =>
    new Set(
      report.problems
        .filter((problem) => problem.severity === 'C')
        .map((problem) => problem.criterion),
    )
  const before = critical(previous)
  const newCritical = [...critical(current)].filter((id) => !before.has(id))

  const dimensions = byDimension((dimension) => {
    const now = current.dimensions[dimension].raw
    const then = previous.dimensions[dimension].raw
    if (now === null || then === null)
      return { delta: null, verdict: 'sem medida' }

    const delta = now - then
    const paired = pairedInterval(current, previous, dimension)
    const threshold = typeof dmd === 'object' ? dmd?.[dimension] : dmd
    if (threshold === undefined || threshold === null)
      return { delta, interval: paired, verdict: 'sem DMD: rode o A/A' }

    const real =
      Math.abs(delta) > threshold &&
      paired !== null &&
      (paired[0] > 0 || paired[1] < 0)
    const verdict = real ? (delta > 0 ? 'melhora' : 'regressão') : 'ruído'
    return { delta, interval: paired, dmd: threshold, verdict }
  })
  return { dimensions, newCritical }
}

function pairedInterval(current, previous, dimension) {
  const shared = Object.keys(current.perScenario).filter(
    (id) => previous.perScenario[id],
  )
  if (!shared.length) return null
  const differences = shared.map((id) => ({
    weight: current.perScenario[id].weight,
    value:
      mean(current.perScenario[id].runs.map((run) => run.grades[dimension])) -
      mean(previous.perScenario[id].runs.map((run) => run.grades[dimension])),
  }))
  return bootstrap(differences.map((difference) => [difference]))
}

// ============================================================================
// Statistics
// ============================================================================

/** Runs of one scenario are not independent, so the interval resamples scenarios, never conversations. */
function interval(scenarios, valueOf) {
  const clusters = scenarios
    .filter((scenario) => scenario.runs.length)
    .map((scenario) =>
      scenario.runs.map((run) => ({
        weight: scenario.weight,
        value: valueOf(run),
      })),
    )
  return bootstrap(clusters)
}

/** A seeded bootstrap, so the same battery always prints the same interval. */
function bootstrap(clusters) {
  if (!clusters.length) return null
  const random = mulberry32(1)
  const estimates = []
  for (let sample = 0; sample < BOOTSTRAP_SAMPLES; sample++) {
    const drawn = clusters.flatMap(
      () => clusters[Math.floor(random() * clusters.length)],
    )
    estimates.push(weightedMean(drawn))
  }
  estimates.sort((a, b) => a - b)
  return [
    round1(estimates[Math.floor(BOOTSTRAP_SAMPLES * 0.05)]),
    round1(estimates[Math.floor(BOOTSTRAP_SAMPLES * 0.95)]),
  ]
}

function mulberry32(seed) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function weightedMean(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  if (!total) return null
  return (
    entries.reduce((sum, entry) => sum + entry.weight * entry.value, 0) / total
  )
}

function mean(values) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function roundHalf(value) {
  return value === null ? null : Math.round(value * 2) / 2
}

function round1(value) {
  return Math.round(value * 10) / 10
}

// ============================================================================
// Text
// ============================================================================

function failure(criterion, message, excerpt) {
  const entry = CATALOG[criterion]
  return {
    criterion,
    dimension: entry.dimension,
    part: entry.part,
    severity: entry.severity,
    message,
    excerpt,
  }
}

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function words(text) {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** An interjection followed by punctuation ("perfeito!", "certo,") is the whole opener; otherwise the first three words are. */
function openerOf(plain) {
  const interjection = plain.match(/^([\p{L}]+)[!,.]/u)
  if (interjection) return interjection[1]
  const first = words(plain).slice(0, 3)
  return first.length === 3 ? first.join(' ') : null
}

function closingOf(plain) {
  const sentences = plain.split(/(?<=[.!?])\s+/).filter(Boolean)
  const last = words(sentences.at(-1) ?? '')
  return last.length >= 3 ? last.join(' ') : null
}

function questionsOf(plain) {
  return (plain.match(/[^.!?]*\?/g) ?? [])
    .map((question) => words(question))
    .filter((question) => question.length >= 4)
}

/** Two questions are the same question when they share almost all their words, whatever the order. */
function similar(a, b) {
  const left = new Set(a)
  const right = new Set(b)
  const shared = [...left].filter((word) => right.has(word)).length
  return shared / new Set([...left, ...right]).size >= 0.8
}

function lengthRatio(messages, index) {
  const contact = messages
    .slice(0, index)
    .findLast((message) => message.role === 'CONTACT')
  if (!contact) return null
  return (messages[index].text ?? '').length / Math.max(contact.text.length, 20)
}

function lastAgentIndex(messages) {
  return messages.findLastIndex((message) => message.role === 'AGENT')
}

function clip(text) {
  return text.length > 80 ? `${text.slice(0, 77)}…` : text
}

// ============================================================================
// Bulletin
// ============================================================================

export function render(report, comparison) {
  const lines = [
    `Agente: ${report.agent} · versão ${report.version} · perfil ${report.profile}`,
    `Bateria: ${report.scenarios} cenários · ${report.conversations} conversas · ${
      report.missing.length
        ? `cobertura insuficiente: falta ${report.missing.join(', ')}`
        : 'cobertura completa'
    } · portão: ${report.gate === null ? 'não informado' : report.gate ? 'aprovado' : 'reprovado'}`,
    '',
    `            nota             IC90          pior${comparison ? '   Δ      veredito' : ''}`,
  ]

  for (const dimension of DIMENSIONS) {
    const entry = report.dimensions[dimension]
    const shown =
      entry.grade !== null
        ? `${fmt(entry.grade)} · bruta ${fmt(entry.raw)}`
        : entry.provisional !== null
          ? `(${fmt(entry.provisional)} · bruta ${fmt(entry.raw)})`
          : '—'
    const range = entry.interval
      ? `[${fmt(entry.interval[0])}–${fmt(entry.interval[1])}]`
      : '—'
    const worst = entry.worst
      ? `${fmt(entry.worst.grade)} ${entry.worst.where}`
      : '—'
    const moved = comparison?.dimensions[dimension]
    const delta = moved
      ? `   ${moved.delta === null ? '—' : signed(moved.delta)}   ${moved.verdict}`
      : ''
    const detail = entry.parts
      ? `   ${PARTS.map((part) => `${part} ${fmt(entry.parts[part])}`).join(' · ')}`
      : entry.thirds
        ? `   início ${fmt(entry.thirds[0])} · meio ${fmt(entry.thirds[1])} · fim ${fmt(entry.thirds[2])}`
        : ''
    lines.push(
      `${LABELS[dimension].padEnd(11)} ${shown.padEnd(16)} ${range.padEnd(13)} ${worst}${delta}${detail}`,
    )
  }

  lines.push(
    `Geral       ${
      report.overall
        ? `${fmt(report.overall.grade)}, limitado por ${LABELS[report.overall.dimension]}`
        : '—'
    } · status: ${report.status}`,
  )
  if (comparison?.newCritical.length)
    lines.push(`Crítica nova (regressão): ${comparison.newCritical.join(', ')}`)

  lines.push('', 'Problemas, por peso (gravidade × conversas)')
  report.problems.slice(0, 10).forEach((problem, index) => {
    lines.push(
      ` ${index + 1}. ${problem.criterion.padEnd(5)} ${problem.severity}  ${problem.conversations}/${report.conversations}  ${problem.example}`,
    )
  })
  if (!report.problems.length) lines.push(' nenhum')

  if (report.candidates.length) {
    lines.push('', 'Candidatos a AG11 (bastidor), para o juiz confirmar')
    for (const candidate of report.candidates)
      lines.push(` ${candidate.where}: "${candidate.term}"`)
  }
  return lines.join('\n')
}

function fmt(value) {
  return value === null || value === undefined
    ? '—'
    : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function signed(value) {
  return `${value > 0 ? '+' : ''}${fmt(value)}`
}

// ============================================================================
// CLI
// ============================================================================

function parseDmd(raw) {
  if (raw === undefined) return undefined
  if (!raw.includes('=')) return Number(raw)
  return Object.fromEntries(
    raw.split(',').map((pair) => {
      const [dimension, value] = pair.split('=')
      return [dimension.trim(), Number(value)]
    }),
  )
}

function option(args, name) {
  const at = args.indexOf(name)
  return at === -1 ? undefined : args[at + 1]
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = argsOrUsage(
    'score-battery.mjs <battery.json> [--previous <battery.json>] [--dmd <n | dim=n,...>] [--json]',
    1,
  )
  const report = score(readJson(args[0]))
  const previousPath = option(args, '--previous')
  const previous = previousPath && score(readJson(previousPath))

  if (!report.findings.ok || (previous && !previous.findings.ok)) {
    const subject = report.findings.ok ? previousPath : args[0]
    const findings = report.findings.ok ? previous.findings : report.findings
    process.exit(findings.settle(subject, ''))
  }

  const comparison = previous
    ? compare(report, previous, parseDmd(option(args, '--dmd')))
    : undefined

  if (args.includes('--json')) {
    const { findings: _findings, perScenario: _perScenario, ...plain } = report
    console.log(JSON.stringify({ ...plain, comparison }, null, 2))
  } else {
    console.log(render(report, comparison))
  }
}
