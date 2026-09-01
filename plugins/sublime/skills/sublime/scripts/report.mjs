/** Shared reporting for the bundled checks: they are read by a model and by a person, so one voice serves both. */
import { readFileSync } from 'node:fs'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const OFF = '\x1b[0m'

export class Findings {
  #entries = []

  /** One thing that does not hold, named where it is and what has to change. */
  add(where, message) {
    this.#entries.push({ where, message })
  }

  get entries() {
    return [...this.#entries]
  }

  get ok() {
    return this.#entries.length === 0
  }

  /** Prints the outcome and answers with the exit code, so no caller has to decide what a finding means. */
  settle(subject, passed) {
    if (this.ok) {
      console.log(`${GREEN}✓${OFF} ${subject} — ${passed}`)
      return 0
    }
    console.log(
      `${RED}✗${OFF} ${subject} — ${this.#entries.length} problema(s)\n`,
    )
    for (const { where, message } of this.#entries) {
      console.log(`  ${RED}•${OFF} ${where}\n    ${DIM}${message}${OFF}`)
    }
    console.log('')
    return 1
  }
}

/** The arguments a check declares, or its own usage and a stop. */
export function argsOrUsage(usage, count) {
  const args = process.argv.slice(2)
  if (args.length < count) {
    console.error(`uso: node ${usage}`)
    process.exit(2)
  }
  return args
}

export function readText(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    console.error(`não consegui ler ${path}: ${error.message}`)
    process.exit(2)
  }
}

export function readJson(path) {
  const raw = readText(path)
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error(`${path} não é JSON válido: ${error.message}`)
    process.exit(2)
  }
}

/** True when `id` stands as its own token inside `text` — the traceability link is a name, so it is matched as a word and never as a substring. */
export function mentions(text, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\w-])${escaped}([^\\w-]|$)`).test(text)
}
