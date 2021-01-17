import P, * as p from '../src'

const Integer = P(/\d+/).map(Number)

const Factor: p.Parser<number> = Integer.or(
  p.lazy(() => Expr).wrap(P('('), P(')')),
)

const Term = Factor.then(
  P(['*', '/']).then(Factor).repeat(),
).map(([head, tail]) =>
  tail.reduce((acc, [op, x]) => (op === '*' ? acc * x : acc / x), head),
)

const Expr = Term.then(P(['+', '-']).then(Term).repeat()).map(([head, tail]) =>
  tail.reduce((acc, [op, x]) => (op === '+' ? acc + x : acc - x), head),
)

export default (string: string): number | null => {
  const r = Expr.parse(string)
  return r.ok && r.index === string.length ? r.value : null
}
