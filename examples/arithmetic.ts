import P, * as p from '../src'

const Integer = p.regex(/\d+/, { expected: 'an integer' }).map(Number)

const Factor: p.Parser<number> = Integer.or(
  p.lazy(() => Expr).wrap(P('('), P(')')),
)

const Term = Factor.chainLeft(P(['*', '/']), (l, op, r) =>
  op === '*' ? l * r : l / r,
)

const Expr = Term.chainLeft(P(['+', '-']), (l, op, r) =>
  op === '+' ? l + r : l - r,
)

const Full = Expr.thenSkip(p.end())

export default (string: string) => {
  const r = Full.parse(string)
  return r.ok ? r.value : r
}
