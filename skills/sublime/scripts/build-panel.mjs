#!/usr/bin/env node
/**
 * Renders the report as the panel a client opens.
 *
 * The artefact is never authored by hand. A hand-authored page drifts — a different
 * palette here, a KPI dropped there — and two deliveries stop looking like one
 * practice. The mould in report.md is rigid precisely so this can read it: the
 * layout, the type and the colour are decided once, below, and the document only
 * ever supplies content.
 *
 * Check the report first: this renders what it is given and vouches for nothing.
 *
 *   node build-panel.mjs <report.md> > panel.html
 */
import { argsOrUsage, readText } from './report.mjs'
import { sections } from './check-report.mjs'

/** The stylesheet, whole and unabridged, so every delivery is the same page with different numbers in it. Changing a colour here means running dataviz/scripts/validate_palette.js against the dark surface again: the status trio and the composition ramp passed its six checks, and a hand-picked replacement will not have. */
const STYLE = `
:root {
    --ground: #0e1116;
    --surface: #161a21;
    --sunk: #1b2029;
    --ink: #e8ebf0;
    --ink-2: #a4acb9;
    --ink-3: #747c8a;
    --rule: #252b34;
    --rule-2: #333b47;
    --accent: #55b4d6;

    --ramp-1: #1d4f66;
    --ramp-2: #3f9ec4;
    --ramp-3: #a5d8ec;

    --ok: #3da06f;
    --routed: #6b7fd4;
    --bad: #d9705f;

    --measure: 66ch;
    --gutter: clamp(1.1rem, 3.5vw, 2.75rem);
    color-scheme: dark;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: "Source Serif 4", Georgia, serif;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  .sheet { max-width: 68rem; margin: 0 auto; padding: 0 var(--gutter) 5rem; }

  .sans { font-family: Archivo, system-ui, sans-serif; }
  .mono, code { font-family: "IBM Plex Mono", ui-monospace, monospace; }

  /* masthead */
  .masthead { padding: clamp(2.25rem, 5vw, 3.5rem) 0 1.75rem; border-bottom: 1px solid var(--rule-2); }

  .eyebrow {
    font-family: Archivo, system-ui, sans-serif;
    font-size: .68rem; font-weight: 600; letter-spacing: .16em;
    text-transform: uppercase; color: var(--ink-3); margin: 0 0 .8rem;
  }

  h1 {
    font-family: Archivo, system-ui, sans-serif;
    font-weight: 700; font-size: clamp(1.9rem, 5vw, 2.9rem);
    line-height: 1.04; letter-spacing: -.022em; margin: 0 0 .6rem; text-wrap: balance;
  }

  .lede { color: var(--ink-2); max-width: var(--measure); margin: 0 0 1.5rem; font-size: 1.05rem; }

  .stamp {
    display: flex; flex-wrap: wrap; gap: .3rem 1.75rem;
    font-family: "IBM Plex Mono", monospace; font-size: .72rem; color: var(--ink-2);
  }
  .stamp b { color: var(--ink-3); font-weight: 500; text-transform: uppercase; letter-spacing: .08em; margin-right: .5ch; }

  /* section scaffolding */
  h2 {
    font-family: Archivo, system-ui, sans-serif;
    font-size: .78rem; font-weight: 600; letter-spacing: .13em;
    text-transform: uppercase; color: var(--ink-3);
    margin: 3.25rem 0 1rem; padding-bottom: .55rem; border-bottom: 1px solid var(--rule);
  }
  h2:first-of-type { margin-top: 2.5rem; }

  h3 {
    font-family: Archivo, system-ui, sans-serif;
    font-size: 1rem; font-weight: 600; letter-spacing: -.01em; margin: 0 0 .2rem;
  }

  p { margin: 0 0 .8rem; max-width: var(--measure); color: var(--ink-2); font-size: .95rem; }
  p.tight { margin-bottom: .35rem; }
  .ink { color: var(--ink); }

  /* scoreboard — absolute first, percentage beside it */
  .scoreboard {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr));
    gap: 2px; background: var(--rule); border: 1px solid var(--rule); margin-bottom: 1rem;
  }

  .score { background: var(--surface); padding: 1.4rem 1.35rem 1.5rem; }

  .score .cap {
    font-family: Archivo, system-ui, sans-serif; font-size: .66rem; font-weight: 600;
    letter-spacing: .11em; text-transform: uppercase; color: var(--ink-3);
    display: block; margin-bottom: .7rem;
  }

  .score .huge {
    font-family: "IBM Plex Mono", monospace; font-variant-numeric: tabular-nums;
    display: block; line-height: .92; letter-spacing: -.045em;
  }
  .score .huge b { font-size: clamp(3rem, 9vw, 4.6rem); font-weight: 600; color: var(--ok); }
  .score .huge em {
    font-size: clamp(1.5rem, 4vw, 2.2rem); font-weight: 400; font-style: normal; color: var(--ink-3);
  }

  .score .pct {
    font-family: Archivo, system-ui, sans-serif; font-size: .82rem; font-weight: 600;
    color: var(--ok); display: block; margin-top: .85rem;
  }

  .scorenote { max-width: var(--measure); margin: 0 0 1.6rem; }

  /* KPI grid */
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(11.5rem, 1fr)); gap: 2px; background: var(--rule); border: 1px solid var(--rule); }
  .kpi { background: var(--surface); padding: 1.05rem 1.15rem 1.15rem; }

  .kpi .cap {
    font-family: Archivo, system-ui, sans-serif; font-size: .66rem; font-weight: 600;
    letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); display: block; margin-bottom: .5rem;
  }
  .kpi .val {
    font-family: "IBM Plex Mono", monospace; font-size: 1.75rem; font-weight: 500;
    letter-spacing: -.03em; line-height: 1; display: block; font-variant-numeric: tabular-nums; color: var(--ink);
  }
  .kpi .val.sm { font-size: 1.4rem; }
  .kpi .sub { font-size: .78rem; color: var(--ink-3); display: block; margin-top: .45rem; font-family: Archivo, sans-serif; }
  .kpi .sub.good { color: var(--ok); }

  .kpi.hero { grid-column: span 2; }
  @media (max-width: 34rem) { .kpi.hero { grid-column: span 1; } }

  /* meter */
  .meter { height: 5px; background: var(--sunk); margin-top: .7rem; display: flex; gap: 2px; }
  .meter i { display: block; height: 100%; background: var(--accent); }

  /* segmented bar */
  .segbar { display: flex; gap: 2px; height: 2.6rem; margin: .3rem 0 .9rem; }
  .segbar span {
    display: flex; align-items: center; padding-left: .6rem;
    font-family: Archivo, sans-serif; font-size: .74rem; font-weight: 600;
    color: #0e1116; white-space: nowrap; overflow: hidden; border-radius: 2px;
  }

  .legend { display: flex; flex-wrap: wrap; gap: .4rem 1.4rem; font-family: Archivo, sans-serif; font-size: .78rem; color: var(--ink-2); margin-bottom: .4rem; }
  .legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: .5ch; vertical-align: baseline; }

  /* comparison bars */
  .cmp { display: grid; gap: .75rem; margin: .25rem 0 1rem; }
  .cmp .row { display: grid; grid-template-columns: 9.5rem 1fr; gap: .9rem; align-items: center; }
  .cmp .lbl { font-family: Archivo, sans-serif; font-size: .8rem; color: var(--ink-2); text-align: right; }
  .cmp .track { display: flex; align-items: center; gap: .6rem; }
  .cmp .bar { height: 1.5rem; border-radius: 2px; background: var(--ramp-1); }
  .cmp .bar.now { background: var(--ramp-2); }
  .cmp .fig { font-family: "IBM Plex Mono", monospace; font-size: .84rem; font-variant-numeric: tabular-nums; color: var(--ink); }
  @media (max-width: 34rem) { .cmp .row { grid-template-columns: 1fr; } .cmp .lbl { text-align: left; } }

  /* table */
  .scroll { overflow-x: auto; margin-bottom: 1rem; }
  table { width: 100%; border-collapse: collapse; font-family: Archivo, sans-serif; font-size: .82rem; }
  th {
    text-align: left; font-size: .66rem; font-weight: 600; letter-spacing: .09em;
    text-transform: uppercase; color: var(--ink-3); padding: 0 .85rem .5rem 0;
    border-bottom: 1px solid var(--rule-2); white-space: nowrap;
  }
  td { padding: .6rem .85rem .6rem 0; border-bottom: 1px solid var(--rule); color: var(--ink-2); vertical-align: middle; }
  td.name { color: var(--ink); }
  th.n, td.n { text-align: right; }
  td.n { font-family: "IBM Plex Mono", monospace; font-variant-numeric: tabular-nums; font-size: .8rem; color: var(--ink); }
  tbody tr:last-child td { border-bottom: none; }
  .minibar { height: 6px; background: var(--ramp-2); border-radius: 2px; display: block; }

  caption { caption-side: bottom; text-align: left; font-family: Archivo, sans-serif; font-size: .74rem; color: var(--ink-3); padding-top: .7rem; max-width: var(--measure); }

  /* chips */
  .chip {
    display: inline-flex; align-items: center; gap: .4ch;
    font-family: Archivo, sans-serif; font-size: .68rem; font-weight: 600;
    letter-spacing: .04em; text-transform: uppercase; padding: .18em .55em; border-radius: 2px;
  }
  .chip.ok { background: rgba(61,160,111,.16); color: var(--ok); }
  .chip.routed { background: rgba(107,127,212,.16); color: var(--routed); }
  .chip.bad { background: rgba(217,112,95,.16); color: var(--bad); }
  .chip.mut { background: var(--sunk); color: var(--ink-3); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block; }

  /* panels */
  .panel { background: var(--surface); border: 1px solid var(--rule); padding: 1.15rem 1.25rem; }
  .panel.flag { border-left: 3px solid var(--bad); }
  .panel p:last-child { margin-bottom: 0; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); gap: 1rem; }

  ul { margin: 0 0 .8rem; padding-left: 1.1rem; color: var(--ink-2); font-size: .92rem; }
  li { margin-bottom: .3rem; max-width: var(--measure); }

  /* fx control */
  .fx { display: inline-flex; align-items: center; gap: .5ch; font-family: Archivo, sans-serif; font-size: .78rem; color: var(--ink-3); }
  .fx input {
    width: 4.5rem; background: var(--sunk); border: 1px solid var(--rule-2); color: var(--ink);
    font-family: "IBM Plex Mono", monospace; font-size: .78rem; padding: .18rem .4rem; border-radius: 2px;
  }
  .fx input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

  .foot { border-top: 1px solid var(--rule-2); margin-top: 3.5rem; padding-top: 1.2rem; font-family: Archivo, sans-serif; font-size: .76rem; color: var(--ink-3); }
  .foot p { color: var(--ink-3); font-family: inherit; font-size: inherit; }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`

/** The three rows that open the page, in the largest type on it. The absolute leads, the share sits under it — one alone hides either the scale or the completeness. */
const SCOREBOARD = [
  'Verificações aprovadas',
  'Conversas concluídas',
  'Respostas com desfecho',
]

/** The row that earns the double-width tile, because it answers the first question a client asks. */
const HERO = ['Custo por conversa']

/** Where the panel's own prose lives, each recognised by the word that opens it. */
const NOTES = { outcomes: 'Desfechos', tokens: 'Tokens', premises: 'Premissas' }

/** The two lists the verdict carries, side by side and at the same weight. A page that gives the second one less room is a page selling something. */
const READINESS = { proven: 'Provado', missing: 'Falta' }

const escape = (text) =>
  text.replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
  )

/** The mould's inline vocabulary, and nothing else: bold carries emphasis, backticks carry an identifier. A document reaching past this has left the mould. */
function inline(text) {
  return escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<span class="mono">$1</span>')
}

/** A markdown table as rows of cells, or nothing when the block is not one. */
function table(lines) {
  const rows = lines
    .filter((line) => line.trim().startsWith('|'))
    .map((line) =>
      line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((cell) => /^-+$/.test(cell)))

  return rows.length > 1 ? rows : null
}

const rowFor = (rows, name) =>
  rows.find(([label]) => label.toLowerCase().includes(name.toLowerCase()))

/** A cell that states a quantity, and so aligns right on its digits. */
const numeric = (cell) => /^[\d\s.,/%–—-]*\d[\d\s.,/%]*$|^US\$/.test(cell)

/** The parts of a whole, as the mould writes them: `21 resolvidos` names the count first, `servido do cache 852544` names it last, and both are one part of one bar. A part whose count is zero still belongs to the legend — a reader who cannot see that failures were zero has to take it on faith — so only the bar drops it, and only because a segment of no width cannot be labelled. */
function counted(line) {
  return line
    .replace(/^\*\*[^*]+\*\*\s*/, '')
    .split('·')
    .map((part) => {
      const trimmed = part.trim().replace(/\.$/, '')
      const found = /^([\d.,\s]*\d)\s+(.+)$|^(.+?)\s+([\d.,\s]*\d)$/.exec(
        trimmed,
      )
      if (!found) return null
      const [, leading, after, before, trailing] = found
      return {
        value: Number(
          (leading ?? trailing).replace(/[\s.]/g, '').replace(',', '.'),
        ),
        label: (after ?? before).trim(),
      }
    })
    .filter((part) => part && Number.isFinite(part.value))
}

function scoreboard(rows) {
  const cards = SCOREBOARD.map((name) => {
    const row = rowFor(rows, name)
    if (!row) return ''
    const [label, absolute, share] = row
    const [got, of] = absolute.split('/')
    return `      <div class="score">
        <span class="cap">${escape(label)}</span>
        <span class="huge"><b>${escape(got.trim())}</b><em>/${escape((of ?? '').trim())}</em></span>
        <span class="pct">${escape(share ?? '')}</span>
      </div>`
  })
    .filter(Boolean)
    .join('\n')

  return cards ? `    <div class="scoreboard">\n${cards}\n    </div>` : ''
}

/** Every measure that is not on the scoreboard, as its own tile. A rate also earns the meter, because a share is read faster as a length than as a number. */
function kpis(rows) {
  const cards = rows
    .filter(([label]) => !SCOREBOARD.some((name) => label.includes(name)))
    .map(([label, ...rest]) => {
      const hero = HERO.some((name) => label.includes(name)) ? ' hero' : ''
      const value = rest[0] ?? ''
      const share = rest[1] ?? ''
      const rate = /([\d.,]+)\s*%/.exec(share)?.[1]?.replace(',', '.')
      const meter =
        rate && /cache/i.test(label)
          ? `\n        <div class="meter"><i style="width:${rate}%"></i></div>`
          : ''
      const good = /100\s*%/.test(share) ? ' good' : ''
      return `      <div class="kpi${hero}">
        <span class="cap">${escape(label)}</span>
        <span class="val${value.length > 16 ? ' sm' : ''}">${inline(value)}</span>${
          share
            ? `\n        <span class="sub${good}">${inline(share)}</span>`
            : ''
        }${meter}
      </div>`
    })
    .join('\n')

  return cards ? `    <div class="kpis">\n${cards}\n    </div>` : ''
}

/** A whole split into its parts, labelled in place. The reader never counts cells: every segment carries its own share, which is also the relief a light fill needs against this surface. */
function segmented(line, tone) {
  const parts = counted(line)
  if (parts.filter(({ value }) => value > 0).length < 2) return ''

  const whole = parts.reduce((sum, { value }) => sum + value, 0)
  const legend = parts
    .map(
      ({ value, label }, at) =>
        `<span><i style="background:${tone[at] ?? tone.at(-1)}"></i>${escape(label)} · ${value.toLocaleString('pt-BR')}</span>`,
    )
    .join('\n      ')
  const bar = parts
    .filter(({ value }) => value > 0)
    .map(
      ({ value, label }, at) =>
        `<span style="flex:${value};background:${tone[at] ?? tone.at(-1)}" title="${escape(label)}">${((value / whole) * 100).toFixed(1)}%</span>`,
    )
    .join('')

  return `    <div class="legend">\n      ${legend}\n    </div>\n    <div class="segbar">${bar}</div>`
}

/** What a measure cost before against what it costs now. Only a gain that cleared the noise reaches the mould, so a bar drawn here is a difference that is real. */
function comparison(rows) {
  const row = rowFor(rows, 'Economia por conversa')
  const figures = [...(row?.[1] ?? '').matchAll(/US\$\s*([\d.,]+)/g)].map((m) =>
    Number(m[1].replace(',', '.')),
  )
  if (figures.length < 2) return ''

  const [before, after] = figures
  const money = (value) => `US$ ${value.toFixed(3).replace('.', ',')}`
  return `    <h2>Quanto ele economiza</h2>
    <h3>Custo de uma conversa completa</h3>
    <div class="cmp">
      <div class="row">
        <span class="lbl">Antes</span>
        <span class="track"><span class="bar" style="width:100%"></span><span class="fig">${money(before)}</span></span>
      </div>
      <div class="row">
        <span class="lbl">Depois</span>
        <span class="track"><span class="bar now" style="width:${Math.round((after / before) * 100)}%"></span><span class="fig">${money(after)}</span></span>
      </div>
    </div>`
}

/** A state wears the colour of what it means, and never colour alone — the word stays inside the chip. */
const TONES = [
  ['ok', /^(passou|PASS|provado|aprovado)/i],
  ['bad', /^(falhou|BLOCKED|falha|reprovado)/i],
  ['routed', /^(SKIPPED|humano|equipe|piloto)/i],
]

function chip(text) {
  const found = TONES.find(([, shape]) => shape.test(text.trim()))
  if (!found) return inline(text)
  return `<span class="chip ${found[0]}"><i class="dot"></i>${inline(text)}</span>`
}

/** A table as the page wears one: the first column names the thing, quantities align on their digits, a state column becomes chips, and a column of money grows a bar so the rows compare at a glance. */
function grid(rows) {
  const [head, ...body] = rows
  const state = head.findIndex((cell) => /^estado$|veredito/i.test(cell))
  const money = head.findIndex((cell) => /^custo$/i.test(cell))
  const most = Math.max(
    ...body.map((cells) =>
      money < 0
        ? 0
        : Number(
            (cells[money] ?? '').replace(/[^\d.,]/g, '').replace(',', '.'),
          ) || 0,
    ),
  )

  const cell = (value, at) => {
    if (at === state) return `<td>${chip(value)}</td>`
    if (at === 0 && state < 0 && numeric(value))
      return `<td class="n">${inline(value)}</td>`
    if (at === 0) return `<td class="name">${inline(value)}</td>`
    if (at === money && most > 0) {
      const own = Number(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      return `<td class="n">${inline(value)}<span class="minibar" style="width:${Math.round((own / most) * 100)}%"></span></td>`
    }
    return `<td${numeric(value) ? ' class="n"' : ''}>${inline(value)}</td>`
  }

  return `    <div class="scroll"><table><thead><tr>${head
    .map(
      (one, at) =>
        `<th${at !== 0 && numeric(body[0]?.[at] ?? '') ? ' class="n"' : ''}>${inline(one)}</th>`,
    )
    .join('')}</tr></thead><tbody>${body
    .map((cells) => `<tr>${cells.map(cell).join('')}</tr>`)
    .join('')}</tbody></table></div>`
}

/** The prose of a section, in the mould's constructs: table, list, paragraph. */
function body(text) {
  const out = []
  let list = []
  let block = []

  const flushList = () => {
    if (!list.length) return
    out.push(
      `    <ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`,
    )
    list = []
  }

  const flushBlock = () => {
    if (!block.length) return
    const rows = table(block)
    out.push(rows ? grid(rows) : `    <p>${inline(block.join(' '))}</p>`)
    block = []
  }

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushBlock()
      flushList()
      continue
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushBlock()
      list.push(trimmed.slice(2))
      continue
    }
    flushList()
    block.push(trimmed)
  }
  flushBlock()
  flushList()

  return out.join('\n')
}

/** A block of the document that opens with a bold word, found by that word. */
function note(text, name) {
  return (
    text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block.startsWith(`**${name}`)) ?? ''
  )
}

/** The list a bold label opens, however much blank line sits between the two. The mould puts the label on its own line and the items under it, so the label alone is never the whole answer. */
function itemsOf(text, name) {
  const lines = text.split('\n')
  const at = lines.findIndex((line) => line.trim().startsWith(`**${name}`))
  if (at < 0) return []

  const items = []
  for (const line of lines.slice(at + 1)) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      items.push(trimmed.slice(2))
      continue
    }
    if (trimmed && items.length) break
  }
  return items
}

/** What is proven and what is missing, side by side and at the same width. The second panel carries the flag, because a page that gives it less room is a page selling something. */
function readiness(verdict) {
  const proven = itemsOf(verdict, READINESS.proven)
  const missing = itemsOf(verdict, READINESS.missing)
  if (!proven.length && !missing.length) return ''

  const panel = (title, items, flag) =>
    `      <div class="panel${flag}">
        <h3 style="margin-bottom:.6rem">${title}</h3>
        <ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>
      </div>`

  return `    <div class="grid2">
${panel('O que já está provado', proven, '')}
${panel('O que falta antes de soltar sem observação', missing, ' flag')}
    </div>`
}

/** The rate a local figure was converted at, as a field the reader owns. A number the platform never measured is not the author's to assert, so it is declared, shown, and left editable. */
function rate(premises) {
  const found = /([\d.,]+)\s*por\s*US\$/i.exec(premises)
  if (!found) return ''

  return `    <p class="fx">
      <label for="fx">Cotação usada nos valores em real</label>
      R$ <input id="fx" type="number" step="0.01" min="0.01" value="${found[1].replace(',', '.')}" aria-label="Cotação do dólar em reais">
      por US$ 1 — premissa declarada, não medida.
    </p>`
}

export function render(markdown) {
  const found = sections(markdown)
  const title = (found[0]?.title ?? 'Prova').replace(/\s*—\s*prova\s*$/i, '')

  const opening = (found[0]?.body ?? '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
  const eyebrow = opening.find((block) => !block.startsWith('|')) ?? ''
  const lede = opening.filter((block) => !block.startsWith('|'))[1] ?? ''
  const stamp = table(
    (opening.find((block) => block.startsWith('|')) ?? '').split('\n'),
  )

  const panel = found.find(({ title: name }) =>
    name.toLowerCase().includes('painel'),
  )
  const rows = panel
    ? panel.body
        .split(/\n\s*\n/)
        .map((block) => table(block.split('\n')))
        .filter(Boolean)
        .flatMap((parsed) => parsed.slice(1))
    : []

  const premises = panel ? note(panel.body, NOTES.premises) : ''
  const verdictBody =
    found.find(({ title: name }) => /veredito/i.test(name))?.body ?? ''

  const rest = found
    .filter(({ title: name }) => !name.toLowerCase().includes('painel'))
    .slice(1)
    .map(({ title: name, body: text }) => {
      const trimmed = /veredito/i.test(name)
        ? text
            .split(/\n\s*\n/)
            .filter(
              (block) =>
                !block.trim().startsWith(`**${READINESS.proven}`) &&
                !block.trim().startsWith(`**${READINESS.missing}`),
            )
            .join('\n\n')
        : text
      const extra = /veredito/i.test(name) ? `\n${readiness(verdictBody)}` : ''
      return `    <h2>${inline(name)}</h2>\n${body(trimmed)}${extra}`
    })
    .join('\n')

  const blocks = [
    scoreboard(rows),
    kpis(rows),
    premises && `    <p class="scorenote">${inline(premises)}</p>`,
    rate(premises),
    comparison(rows),
    panel &&
      segmented(note(panel.body, NOTES.outcomes).replace(/\n/g, ' '), [
        'var(--ok)',
        'var(--routed)',
        'var(--bad)',
      ]) &&
      `    <h2>Distribuição dos desfechos</h2>\n${segmented(note(panel.body, NOTES.outcomes).replace(/\n/g, ' '), ['var(--ok)', 'var(--routed)', 'var(--bad)'])}`,
    panel &&
      segmented(note(panel.body, NOTES.tokens).replace(/\n/g, ' '), [
        'var(--ramp-3)',
        'var(--ramp-2)',
        'var(--ramp-1)',
      ]) &&
      `    <h2>Consumo</h2>\n${segmented(note(panel.body, NOTES.tokens).replace(/\n/g, ' '), ['var(--ramp-3)', 'var(--ramp-2)', 'var(--ramp-1)'])}`,
  ].filter(Boolean)

  return page({
    title,
    eyebrow,
    lede,
    stamp,
    rows,
    panel: blocks.join('\n'),
    rest,
  })
}

function page({ title, eyebrow, lede, stamp, rows, panel, rest }) {
  const pairs = stamp
    ? stamp[0]
        .map(
          (label, at) =>
            `<span><b>${escape(label)}</b>${escape(stamp[1]?.[at] ?? '')}</span>`,
        )
        .join('\n      ')
    : ''

  const volume = rowFor(rows, 'Volume')?.[1] ?? ''

  return `<title>Prova · ${escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">

<style>${STYLE}</style>

<div class="sheet">
  <header class="masthead">
    <p class="eyebrow">${inline(eyebrow)}</p>
    <h1>${escape(title)}</h1>
    ${lede ? `<p class="lede">${inline(lede)}</p>` : ''}
    <div class="stamp">
      ${pairs}
    </div>
  </header>

  <h2>Resumo executivo</h2>
${panel}

${rest}

  <footer class="foot">
    <p>
      ${inline(eyebrow)} · ${volume ? `${escape(volume)} · ` : ''}${pairs ? inline(stamp[0].map((label, at) => `${label} ${stamp[1]?.[at] ?? ''}`).join(' · ')) : ''}.
      Nenhum número deste documento foi estimado ou arredondado a favor.
    </p>
  </footer>
</div>
${
  /id="fx"/.test(panel)
    ? `<script>
  (function () {
    var fx = document.getElementById('fx')
    var marks = [].slice.call(document.querySelectorAll('[data-usd]'))
    function render() {
      var value = parseFloat(fx.value)
      if (!isFinite(value) || value <= 0) return
      marks.forEach(function (mark) {
        mark.textContent = 'R$ ' + (parseFloat(mark.dataset.usd) * value).toFixed(2).replace('.', ',')
      })
    }
    fx.addEventListener('input', render)
    render()
  })()
</script>
`
    : ''
}`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [reportPath] = argsOrUsage('build-panel.mjs <report.md>', 1)
  process.stdout.write(render(readText(reportPath)))
}
