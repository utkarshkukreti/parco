import P, * as p from '../src'

export type Value = string | Value[] | [string, Value][]

const Keyword = P(/true|false|null/)
const String = P(/"(:?[^\\"\t\n\r\x00]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/)
const Number = P(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)

const ch = (string: string) => p.regex(`[ \t\r\n]*${string}[ \t\r\n]*`)

const Array: p.Parser<Value[]> = ch('\\[')
  .skipThen(p.lazy(() => Value).array({ join: ch(',') }))
  .thenSkip(ch('\\]'))

const Object_: p.Parser<[string, Value][]> = ch('\\{')
  .skipThen(
    String.thenSkip(ch(':'))
      .then(p.lazy(() => Value))
      .array({ join: ch(',') }),
  )
  .thenSkip(ch('\\}'))

const Value = P<Value>(String).or(Keyword).or(Number).or(Array).or(Object_)

export default (string: string): Value | null => {
  string = string.trim()
  const r = Value.parse(string)
  return r.ok && r.input === '' ? r.value : null
}
