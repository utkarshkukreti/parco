import P, * as p from '../src'

const Integer = p.regex(/\d+/, { expected: 'an integer' }).map(Number)

const Expr3: p.Parser<number> = Integer.or(
  p.lazy(() => Expr).wrap(P('('), P(')')),
)

const Expr2 = Expr3.chainRight(P(['**']), (l, _op, r) => l ** r)

const Expr1 = Expr2.chainLeft(P(['*', '/']), (l, op, r) =>
  op === '*' ? l * r : l / r,
)

const Expr = Expr1.chainLeft(P(['+', '-']), (l, op, r) =>
  op === '+' ? l + r : l - r,
)

const Full = Expr.thenSkip(p.end())

export default (string: string) => {
  const r = Full.parse(string)
  return r.ok ? r.value : r
}
