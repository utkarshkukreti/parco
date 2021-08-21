import * as p from '../src/index'

export type Value = string | Value[] | [string, Value][]

const Keyword = p.string(['true', 'false', 'null'])
const String = p.regex(
  /"(?:[^\\"\t\n\r\x00]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
)
const Number = p.regex(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)

const ch = (re: string, expected = re) =>
  p.regex_(`[ \t\r\n]*${re}[ \t\r\n]*`, { expected })

const Array = p
  .lazy(() => Value)
  .join(ch(','))
  .between(ch('\\[', '['), ch('\\]', ']'))

const Object = String.thenSkip(ch(':'))
  .then(p.lazy(() => Value))
  .join(ch(','))
  .between(ch('{'), ch('}'))

const Value: p.Parser<Value> = p.or<Value>(
  [String, Number, Object, Array, Keyword],
  { expected: ['a string', 'a number', 'an object', 'an array', 'a keyword'] },
)

const Full = Value.thenSkip(p.end())

export default (string: string) => Full.parse(string.trim())
