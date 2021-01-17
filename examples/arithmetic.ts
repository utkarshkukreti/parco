import P, * as p from '../src'

const Integer = P(/\d+/).map(Number)

const Factor: p.Parser<number> = Integer.or(
  p.lazy(() => Expr).wrap(P('('), P(')')),
)

const Term = Factor.then(
  P('*').or(P('/')).then(Factor).repeat(),
).map(([acc, xs]) =>
  xs.reduce((acc, [op, x]) => (op === '*' ? acc * x : acc / x), acc),
)

const Expr = Term.then(P('+').or(P('-')).then(Term).repeat()).map(([acc, xs]) =>
  xs.reduce((acc, [op, x]) => (op === '+' ? acc + x : acc - x), acc),
)

export default (string: string): number | null => {
  const r = Expr.parse(string)
  return r.ok && r.index === string.length ? r.value : null
}
