import P, * as p from '../src'

export type Value = string | Value[] | [string, Value][]

const Keyword = P(['true', 'false', 'null'])
const String = P(/"(?:[^\\"\t\n\r\x00]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/)
const Number = P(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)

const ch = (re: string, expected = re) =>
  p.regex(`[ \t\r\n]*${re}[ \t\r\n]*`, { expected })

export const Value: p.Parser<Value> = p.or<Value>(
  [String, Keyword, Number, p.lazy(() => Array.or(Object_))],
  { expected: ['a string', 'a keyword', 'a number', 'an array', 'an object'] },
)

const Array = Value.repeat({ join: ch(',') }).wrap(
  ch('\\[', '['),
  ch('\\]', ']'),
)

const Object_ = String.thenSkip(ch(':'))
  .then(Value)
  .repeat({ join: ch(',') })
  .wrap(ch('{'), ch('}'))

const Full = Value.thenSkip(p.end())

export default (string: string) => Full.parse(string.trim())
