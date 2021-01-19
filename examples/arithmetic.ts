import P, * as p from '../src'

const Integer = p.regex(/\d+/, { expected: 'an integer' }).map(Number)

const Op = (string: string, fun: (l: number, r: number) => number) =>
  P(string).map(() => fun)

const Expr: p.Parser<number> = Integer.or(
  p.lazy(() => Expr).wrap(P('('), P(')')),
)
  .chainRight(Op('**', (l, r) => l ** r))
  .chainLeft(p.or([Op('*', (l, r) => l * r), Op('/', (l, r) => l / r)]))
  .chainLeft(p.or([Op('+', (l, r) => l + r), Op('-', (l, r) => l - r)]))

const Full = Expr.thenSkip(p.end())

export default (string: string) => {
  const r = Full.parse(string)
  return r.ok ? r.value : r
}
