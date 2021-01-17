export type Result<A> = Ok<A> | Error

export type Ok<A> = {
  ok: true
  index: number
  value: A
}

export type Error = {
  ok: false
  index: number
  expected: Expected
}

export type Expected = string | Expected[]

export class Parser<A, Input = string> {
  constructor(readonly fun: (input: Input, index: number) => Result<A>) {}

  parse(input: Input, index = 0): Result<A> {
    return this.fun(input, index)
  }

  map<B>(fun: (a: A) => B): Parser<B, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      return Ok(r.index, fun(r.value))
    })
  }

  filter(fun: (a: A) => boolean, expected: Expected): Parser<A, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      if (fun(r.value)) return r
      return Error(r.index, expected)
    })
  }

  filterMap<B>(fun: (a: A) => B | null, expected: Expected): Parser<B, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      const value = fun(r.value)
      if (value !== null) return Ok(r.index, value)
      return Error(r.index, expected)
    })
  }

  optional(): Parser<A | null, Input>
  optional<B>(default_: B): Parser<A | B, Input>

  optional<B>(default_?: B) {
    const default__ = typeof default_ === 'undefined' ? null : default_
    return new Parser<A | B | null, Input>((input, index) => {
      const r = this.fun(input, index)
      if (r.ok || r.index > index) return r
      return Ok(index, default__)
    })
  }

  andThen<B>(b: (a: A) => Parser<B, Input>): Parser<B, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      return b(r.value).fun(input, r.index)
    })
  }

  then<B>(b: Parser<B, Input>): Parser<[A, B], Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      const rb = b.fun(input, r.index)
      if (!rb.ok) return rb
      return Ok(rb.index, [r.value, rb.value])
    })
  }

  thenSkip<B>(b: Parser<B, Input>): Parser<A, Input> {
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

  wrap<B, C>(b: Parser<B, Input>, c: Parser<C, Input>): Parser<A, Input> {
    return new Parser((input, index) => {
      const rb = b.fun(input, index)
      if (!rb.ok) return rb
      const r = this.fun(input, rb.index)
      if (!r.ok) return r
      const rc = c.fun(input, r.index)
      if (!rc.ok) return rc
      return Ok(rc.index, r.value)
    })
  }

  or<B>(b: Parser<B, Input>): Parser<A | B, Input> {
    return new Parser<A | B, Input>((input, index) => {
      const r = this.fun(input, index)
      if (r.ok || r.index > index) return r
      const rb = b.fun(input, index)
      if (rb.ok || rb.index > index) return rb
      return Error(index, [r.expected, rb.expected])
    })
  }

  repeat<B>({ join }: { join?: Parser<B, Input> } = {}): Parser<A[], Input> {
    return new Parser((input, index) => {
      const value = []
      for (let i = 0; ; i++) {
        let r
        if (join && i > 0) {
          const rb = join.fun(input, index)
          if (!rb.ok) return rb.index === index ? Ok(index, value) : rb
          index = rb.index
          r = this.fun(input, index)
          if (!r.ok) return r
        } else {
          r = this.fun(input, index)
          if (!r.ok) return r.index === index ? Ok(index, value) : r
        }
        value.push(r.value)
        index = r.index
      }
    })
  }

  pipe<B>(fun: (_: this) => B): B {
    return fun(this)
  }
}

export type P = {
  <A, Input = string>(a: (input: Input, index: number) => Result<A>): Parser<
    A,
    Input
  >
  <A extends string>(a: A | A[]): Parser<A, string>
  (a: RegExp): Parser<string, string>
  <A, Input = string>(a: Parser<A, Input>): Parser<A, Input>
}

export const p: P = <A, Input>(
  a:
    | ((input: Input, index: number) => Result<A>)
    | string
    | string[]
    | RegExp
    | Parser<A, Input>,
) =>
  typeof a === 'function'
    ? new Parser(a)
    : typeof a === 'string' || Array.isArray(a)
    ? string(a)
    : a instanceof RegExp
    ? regex(a)
    : a

export const string = <A extends string>(arg: A | A[]): Parser<A> => {
  if (Array.isArray(arg)) {
    const expected = arg.map(a => JSON.stringify(a))
    const re = new RegExp(
      arg
        .slice()
        .sort((a, b) => b.length - a.length)
        .map(escapeRegex)
        .join('|'),
    )
    // This `as` is sound as long as our regex construction above is correct!
    return regex(re, { expected }) as Parser<A>
  }
  const expected = JSON.stringify(arg)
  return new Parser((input, index) => {
    if (input.slice(index).startsWith(arg)) return Ok(index + arg.length, arg)
    return Error(index, expected)
  })
}

export const regex = (
  arg: RegExp | string,
  { expected: expected_ }: { expected?: Expected } = {},
): Parser<string> => {
  let regex = typeof arg === 'string' ? new RegExp(arg) : arg
  const expected = expected_ || `/${regex.source}/${regex.flags}`
  regex = new RegExp(regex.source, regex.flags + 'y')
  return new Parser((input, index) => {
    regex.lastIndex = index
    const match = regex.exec(input)?.[0]
    if (match !== undefined) return Ok(index + match.length, match)
    return Error(index, expected)
  })
}

export const lazy = <A, Input>(p: () => Parser<A, Input>): Parser<A, Input> =>
  new Parser((input, index) => p().fun(input, index))

export const or = <A, Input = string>(
  ps: Parser<A, Input>[],
  { expected }: { expected?: Expected } = {},
): Parser<A, Input> => {
  return new Parser((input, index) => {
    const expected_: null | Expected[] = expected === undefined ? [] : null
    for (const p of ps) {
      const r = p.fun(input, index)
      if (r.ok || r.index > index) return r
      expected_ && expected_.push(r.expected)
    }
    return Error(index, expected_ || expected || '?')
  })
}

export const Ok = <A>(index: number, value: A): Ok<A> => ({
  ok: true,
  index,
  value,
})

export const Error = (index: number, value: Expected): Error => ({
  ok: false,
  index,
  expected: value,
})

export default p

const escapeRegex = (string: string) =>
  string.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
