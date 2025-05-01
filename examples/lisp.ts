import * as p from '../src/index'

export type Value =
  | { type: 'atom'; value: string }
  | { type: 'integer'; value: number }
  | { type: 'list'; value: Value[] }

// Takes a parser and returns a parser that skips whitespace after it.
const ws = <T>(parser: p.Parser<string, T>) => parser.thenSkip(p.regex_(/\s*/))

// Any sequence of non-whitespace non-bracket characters.
const Atom = p
  .regex(/[^()\[\]{}\s]+/)
  .map(string => ({ type: 'atom' as const, value: string }))
  .pipe(ws)

const Integer = p
  .regex(/\d+/)
  .map(string => ({ type: 'integer' as const, value: parseInt(string) }))
  .pipe(ws)

const List = p
  .lazy(() => Value)
  .repeat()
  .between(p.string('('), p.string(')'))
  .map(value => ({ type: 'list' as const, value }))
  .pipe(ws)

const Value: p.Parser<string, Value> = p.or<string, Value>([Atom, Integer, List])

export const toString = (value: Value): string => {
  if (value.type === 'atom') return value.value
  if (value.type === 'integer') return value.value.toString()
  return `(${value.value.map(toString).join(' ')})`
}

const Full = Value.thenSkip(p.end())

export const parse = (string: string) => Full.parse(string.trim())
