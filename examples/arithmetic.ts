import P, * as p from '../src'

const Integer = p.regex(/\d+/, { expected: 'an integer' }).map(Number)

const Binary = (op: string, fun: (l: number, r: number) => number) =>
  P(op).map(() => fun)

const Unary = (op: string, fun: (x: number) => number) => P(op).map(() => fun)

const Expr: p.Parser<number> = Integer.or(
  p.lazy(() => Expr).wrap(P('('), P(')')),
)
  .pipe(x =>
    p
      .or([Unary('-', x => -x), Unary('~', x => ~x)])
      .repeat()
      .then(x)
      .map(([ops, x]) => ops.reduceRight((acc, op) => op(acc), x)),
  )
  .chainRight(Binary('**', (l, r) => l ** r))
  .chainLeft(p.or([Binary('*', (l, r) => l * r), Binary('/', (l, r) => l / r)]))
  .chainLeft(p.or([Binary('+', (l, r) => l + r), Binary('-', (l, r) => l - r)]))

const Full = Expr.thenSkip(p.end())

export default (string: string) => {
  const r = Full.parse(string)
  return r.ok ? r.value : r
}
