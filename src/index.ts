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

export class Parser<Input, Output> {
  constructor(readonly run: (input: Input, index: number) => Result<Output>) {}

  parse(input: Input, index = 0): Result<Output> {
    return this.run(input, index)
  }

  map<B>(fun: (a: Output) => B): Parser<Input, B> {
    return new Parser((input, index) => {
      const r = this.run(input, index)
      if (!r.ok) return r
      return Ok(r.index, fun(r.value))
    })
  }

  filter(
    fun: (a: Output) => boolean,
    expected: Expected,
  ): Parser<Input, Output> {
    return new Parser((input, index) => {
      const r = this.run(input, index)
      if (!r.ok || fun(r.value)) return r
      return Error(r.index, expected)
    })
  }

  optional<B>(default_: B): Parser<Input, Output | B> {
    return new Parser<Input, Output | B>((input, index) => {
      const r = this.run(input, index)
      if (r.ok || r.index > index) return r
      return Ok(index, default_)
    })
  }

  try(): Parser<Input, Output> {
    return new Parser((input, index) => {
      const r = this.run(input, index)
      if (r.ok) return r
      return Error(index, r.expected)
    })
  }

  bind<B>(b: (a: Output) => Parser<Input, B>): Parser<Input, B> {
    return new Parser((input, index) => {
      const r = this.run(input, index)
      if (!r.ok) return r
      return b(r.value).run(input, r.index)
    })
  }

  then<B>(b: Parser<Input, B>): Parser<Input, [Output, B]> {
    return new Parser((input, index) => {
      const r = this.run(input, index)
      if (!r.ok) return r
      const rb = b.run(input, r.index)
      if (!rb.ok) return rb
      return Ok(rb.index, [r.value, rb.value])
    })
  }

  thenSkip<B>(b: Parser<Input, B>): Parser<Input, Output> {
    return new Parser((input, index) => {
      const r = this.run(input, index)
      if (!r.ok) return r
      const rb = b.run(input, r.index)
      if (!rb.ok) return rb
      return Ok(rb.index, r.value)
    })
  }

  skipThen<B>(b: Parser<Input, B>): Parser<Input, B> {
    return new Parser((input, index) => {
      const r = this.run(input, index)
      if (!r.ok) return r
      return b.run(input, r.index)
    })
  }

  between<Before, After>(
    before: Parser<Input, Before>,
    after: Parser<Input, After>,
  ): Parser<Input, Output> {
    return new Parser((input, index) => {
      const rb = before.run(input, index)
      if (!rb.ok) return rb
      const r = this.run(input, rb.index)
      if (!r.ok) return r
      const ra = after.run(input, r.index)
      if (!ra.ok) return ra
      return Ok(ra.index, r.value)
    })
  }

  or<B>(b: Parser<Input, B>): Parser<Input, Output | B> {
    return new Parser<Input, Output | B>((input, index) => {
      const r = this.run(input, index)
      if (r.ok || r.index > index) return r
      const rb = b.run(input, index)
      if (rb.ok || rb.index > index) return rb
      return Error(index, [r.expected, rb.expected])
    })
  }

  repeat(count?: number): Parser<Input, Output[]> {
    if (count !== undefined) {
      return new Parser((input, index) => {
        const value = []
        for (let i = 0; i < count; i++) {
          const r = this.run(input, index)
          if (!r.ok) return r
          value.push(r.value)
          index = r.index
        }
        return Ok(index, value)
      })
    }

    return new Parser((input, index) => {
      const value = []
      for (;;) {
        const r = this.run(input, index)
        if (!r.ok) return r.index === index ? Ok(index, value) : r
        value.push(r.value)
        index = r.index
      }
    })
  }

  join<B>(b: Parser<Input, B>): Parser<Input, Output[]> {
    return new Parser((input, index) => {
      const value: Output[] = []
      const r = this.run(input, index)
      if (!r.ok) return r.index === index ? Ok(index, value) : r
      value.push(r.value)
      index = r.index
      for (;;) {
        const rb = b.run(input, index)
        if (!rb.ok) return rb.index === index ? Ok(index, value) : rb
        index = rb.index
        const r = this.run(input, index)
        if (!r.ok) return r
        value.push(r.value)
        index = r.index
      }
    })
  }

  chainLeft(
    op: Parser<Input, (left: Output, right: Output) => Output>,
  ): Parser<Input, Output> {
    return this.then(op.then(this).repeat()).map(([head, tail]) =>
      tail.reduce((acc, [op, right]) => op(acc, right), head),
    )
  }

  chainRight(
    op: Parser<Input, (left: Output, right: Output) => Output>,
  ): Parser<Input, Output> {
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

export const string = <Output extends string>(
  arg: Output | Output[],
): Parser<string, Output> => {
  if (Array.isArray(arg)) {
    const expected = arg.map(a => JSON.stringify(a))
    const re = arg
      .slice()
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join('|')
    // This `as` is sound as long as our regex construction above is correct!
    return regex(re, { expected }) as Parser<string, Output>
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
): Parser<string, string> => {
  const [regex, expected] = _regex(arg, expected_)
  return new Parser((input, index) => {
    regex.lastIndex = index
    if (regex.test(input))
      return Ok(regex.lastIndex, input.slice(index, regex.lastIndex))
    return Error(index, expected)
  })
}

export const regex_ = (
  arg: RegExp | string,
  { expected: expected_ }: { expected?: Expected } = {},
): Parser<string, undefined> => {
  const [regex, expected] = _regex(arg, expected_)
  return new Parser((input, index) => {
    regex.lastIndex = index
    if (regex.test(input)) return Ok(regex.lastIndex, undefined)
    return Error(index, expected)
  })
}

export const end = (): Parser<string, void> =>
  new Parser((input, index) =>
    index >= input.length ? Ok(index, undefined) : Error(index, 'end of input'),
  )

export const lazy = <Input, Output>(
  p: () => Parser<Input, Output>,
): Parser<Input, Output> => new Parser((input, index) => p().run(input, index))

export const or = <Input, Output>(
  ps: Parser<Input, Output>[],
  { expected }: { expected?: Expected } = {},
): Parser<Input, Output> => {
  if (expected) {
    return new Parser((input, index) => {
      for (const p of ps) {
        const r = p.run(input, index)
        if (r.ok || r.index > index) return r
      }
      return Error(index, expected)
    })
  }

  return new Parser((input, index) => {
    const expected = []
    for (const p of ps) {
      const r = p.run(input, index)
      if (r.ok || r.index > index) return r
      expected.push(r.expected)
    }
    return Error(index, expected)
  })
}

export const succeed = <Input, Output>(value: Output): Parser<Input, Output> =>
  new Parser((_, index) => Ok(index, value))

export const fail = <Input, Output>(
  expected: Expected,
): Parser<Input, Output> => new Parser((_, index) => Error(index, expected))

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

const escapeRegex = (string: string) =>
  string.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
