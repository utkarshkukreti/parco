export type Result<Output> = Ok<Output> | Error

export type Ok<Output> = {
  ok: true
  index: number
  value: Output
}

export type Error = {
  ok: false
  index: number
  expected: Expected
}

export type Expected = string | Expected[]

export class Parser<Output, Input = string> {
  constructor(readonly fun: (input: Input, index: number) => Result<Output>) {}

  parse(input: Input, index = 0): Result<Output> {
    return this.fun(input, index)
  }

  map<B>(fun: (a: Output) => B): Parser<B, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      return Ok(r.index, fun(r.value))
    })
  }

  filter(
    fun: (a: Output) => boolean,
    expected: Expected,
  ): Parser<Output, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok || fun(r.value)) return r
      return Error(r.index, expected)
    })
  }

  optional<B>(default_: B): Parser<Output | B, Input> {
    return new Parser<Output | B, Input>((input, index) => {
      const r = this.fun(input, index)
      if (r.ok || r.index > index) return r
      return Ok(index, default_)
    })
  }

  bind<B>(b: (a: Output) => Parser<B, Input>): Parser<B, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      return b(r.value).fun(input, r.index)
    })
  }

  then<B>(b: Parser<B, Input>): Parser<[Output, B], Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      const rb = b.fun(input, r.index)
      if (!rb.ok) return rb
      return Ok(rb.index, [r.value, rb.value])
    })
  }

  thenSkip<B>(b: Parser<B, Input>): Parser<Output, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      const rb = b.fun(input, r.index)
      if (!rb.ok) return rb
      return Ok(rb.index, r.value)
    })
  }

  skipThen<B>(b: Parser<B, Input>): Parser<B, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      return b.fun(input, r.index)
    })
  }

  between<Before, After>(
    before: Parser<Before, Input>,
    after: Parser<After, Input>,
  ): Parser<Output, Input> {
    return new Parser((input, index) => {
      const rb = before.fun(input, index)
      if (!rb.ok) return rb
      const r = this.fun(input, rb.index)
      if (!r.ok) return r
      const ra = after.fun(input, r.index)
      if (!ra.ok) return ra
      return Ok(ra.index, r.value)
    })
  }

  or<B>(b: Parser<B, Input>): Parser<Output | B, Input> {
    return new Parser<Output | B, Input>((input, index) => {
      const r = this.fun(input, index)
      if (r.ok || r.index > index) return r
      const rb = b.fun(input, index)
      if (rb.ok || rb.index > index) return rb
      return Error(index, [r.expected, rb.expected])
    })
  }

  repeat(): Parser<Output[], Input> {
    return new Parser((input, index) => {
      const value = []
      for (;;) {
        const r = this.fun(input, index)
        if (!r.ok) return r.index === index ? Ok(index, value) : r
        value.push(r.value)
        index = r.index
      }
    })
  }

  join<B>(b: Parser<B, Input>): Parser<Output[], Input> {
    return new Parser((input, index) => {
      const value: Output[] = []
      const r = this.fun(input, index)
      if (!r.ok) return r.index === index ? Ok(index, value) : r
      value.push(r.value)
      index = r.index
      for (;;) {
        const rb = b.fun(input, index)
        if (!rb.ok) return rb.index === index ? Ok(index, value) : rb
        index = rb.index
        const r = this.fun(input, index)
        if (!r.ok) return r
        value.push(r.value)
        index = r.index
      }
    })
  }

  chainLeft(
    op: Parser<(left: Output, right: Output) => Output, Input>,
  ): Parser<Output, Input> {
    return this.then(op.then(this).repeat()).map(([head, tail]) =>
      tail.reduce((acc, [op, right]) => op(acc, right), head),
    )
  }

  chainRight(
    op: Parser<(left: Output, right: Output) => Output, Input>,
  ): Parser<Output, Input> {
    return this.then(op.then(this).repeat()).map(([head, tail]) =>
      [head]
        .concat(tail.map(t => t[1]))
        .reduceRight((acc, left, i) => tail[i]![0](left, acc)),
    )
  }

  pipe<B>(fun: (_: this) => B): B {
    return fun(this)
  }
}

export type P = {
  <Output, Input = string>(
    a: (input: Input, index: number) => Result<Output>,
  ): Parser<Output, Input>
  <Output extends string>(a: Output | Output[]): Parser<Output, string>
  (a: RegExp): Parser<string, string>
  <Output, Input = string>(a: Parser<Output, Input>): Parser<Output, Input>
}

export const p: P = <Output, Input>(
  a:
    | ((input: Input, index: number) => Result<Output>)
    | string
    | string[]
    | RegExp
    | Parser<Output, Input>,
) =>
  typeof a === 'function'
    ? new Parser(a)
    : typeof a === 'string' || Array.isArray(a)
    ? string(a)
    : a instanceof RegExp
    ? regex(a)
    : a

export const string = <Output extends string>(
  arg: Output | Output[],
): Parser<Output> => {
  if (Array.isArray(arg)) {
    const expected = arg.map(a => JSON.stringify(a))
    const re = arg
      .slice()
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join('|')
    // This `as` is sound as long as our regex construction above is correct!
    return regex(re, { expected }) as Parser<Output>
  }
  const expected = JSON.stringify(arg)
  return new Parser((input, index) => {
    if (input.slice(index).startsWith(arg)) return Ok(index + arg.length, arg)
    return Error(index, expected)
  })
}

const _regex = (
  arg: RegExp | string,
  expected_: Expected | undefined,
): [RegExp, Expected] => {
  const [source, flags] =
    typeof arg === 'string'
      ? [arg, '']
      : [arg.source, arg.flags.replace(/y|g/g, '')]
  const expected = expected_ || `/${source}/${flags}`
  const regex = new RegExp(source, flags + 'y')
  return [regex, expected]
}

export const regex = (
  arg: RegExp | string,
  { expected: expected_ }: { expected?: Expected } = {},
): Parser<string> => {
  const [regex, expected] = _regex(arg, expected_)
  return new Parser((input, index) => {
    regex.lastIndex = index
    const match = regex.exec(input)?.[0]
    if (match !== undefined) return Ok(regex.lastIndex, match)
    return Error(index, expected)
  })
}

export const regex_ = (
  arg: RegExp | string,
  { expected: expected_ }: { expected?: Expected } = {},
): Parser<void> => {
  const [regex, expected] = _regex(arg, expected_)
  return new Parser((input, index) => {
    regex.lastIndex = index
    if (regex.test(input)) return Ok(regex.lastIndex, undefined)
    return Error(index, expected)
  })
}

export const end = (): Parser<void, string> =>
  new Parser((input, index) =>
    index >= input.length ? Ok(index, undefined) : Error(index, 'end of input'),
  )

export const lazy = <Output, Input>(
  p: () => Parser<Output, Input>,
): Parser<Output, Input> => new Parser((input, index) => p().fun(input, index))

export const or = <Output, Input = string>(
  ps: Parser<Output, Input>[],
  { expected }: { expected?: Expected } = {},
): Parser<Output, Input> => {
  if (expected) {
    return new Parser((input, index) => {
      for (const p of ps) {
        const r = p.fun(input, index)
        if (r.ok || r.index > index) return r
      }
      return Error(index, expected)
    })
  }

  return new Parser((input, index) => {
    const expected = []
    for (const p of ps) {
      const r = p.fun(input, index)
      if (r.ok || r.index > index) return r
      expected.push(r.expected)
    }
    return Error(index, expected)
  })
}

export const succeed = <Output, Input>(value: Output): Parser<Output, Input> =>
  new Parser((_, index) => Ok(index, value))

export const fail = <Output, Input>(
  expected: Expected,
): Parser<Output, Input> => new Parser((_, index) => Error(index, expected))

export const Ok = <Output>(index: number, value: Output): Ok<Output> => ({
  ok: true,
  index,
  value,
})

export const Error = (index: number, expected: Expected): Error => ({
  ok: false,
  index,
  expected,
})

export default p

const escapeRegex = (string: string) =>
  string.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
