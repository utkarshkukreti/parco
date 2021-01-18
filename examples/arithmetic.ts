import P, * as p from '../src'

const Integer = p.regex(/\d+/, { expected: 'an integer' }).map(Number)

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

const Full = Expr.thenSkip(p.end())

export default (string: string) => {
  const r = Full.parse(string)
  return r.ok ? r.value : r
}
