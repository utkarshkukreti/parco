export type Result<A> = Ok<A> | Error

export type Ok<A> = {
  ok: true
  index: number
  value: A
}

export type Error = {
  ok: false
  index: number
  value: string
}

export class Parser<A, Input = string> {
  constructor(readonly fun: (input: Input, index: number) => Result<A>) {}

  parse(input: Input, index = 0): Result<A> {
    return this.fun(input, index)
  }

  map<B>(fun: (a: A) => B): Parser<B, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (r.ok) return Ok(r.index, fun(r.value))
      return r
    })
  }

  filter(fun: (a: A) => boolean, error: string): Parser<A, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (r.ok) {
        if (fun(r.value)) return r
        return Error(r.index, error)
      }
      return r
    })
  }

  filterMap<B>(fun: (a: A) => B | null, error: string): Parser<B, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (r.ok) {
        const value = fun(r.value)
        if (value !== null) return Ok(r.index, value)
        return Error(r.index, error)
      }
      return r
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

  wrap(a: Parser<unknown, Input>, b: Parser<unknown, Input>): Parser<A, Input> {
    return new Parser((input, index) => {
      const ra = a.fun(input, index)
      if (!ra.ok) return ra
      const r = this.fun(input, ra.index)
      if (!r.ok) return r
      const rb = b.fun(input, r.index)
      if (!rb.ok) return rb
      return Ok(rb.index, r.value)
    })
  }

  or(a: Parser<A, Input>): Parser<A, Input> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (r.ok || r.index > index) return r
      const ra = a.fun(input, index)
      if (ra.ok || ra.index > index) return ra
      return Error(index, `${r.value} OR ${ra.value}`)
    })
  }

  array({ join }: { join?: Parser<unknown, Input> } = {}): Parser<A[], Input> {
    return new Parser((input, index) => {
      const value = []
      for (let i = 0; ; i++) {
        if (join && i > 0) {
          const r1 = join.fun(input, index)
          if (r1.ok) {
          } else if (r1.index === index) return Ok(index, value)
          else return r1
          index = r1.index
          const r = this.fun(input, index)
          if (r.ok) value.push(r.value)
          else return r
          index = r.index
        } else {
          const r = this.fun(input, index)
          if (r.ok) value.push(r.value)
          else if (r.index === index) return Ok(index, value)
          else return r
          index = r.index
        }
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
  <A extends string>(a: A): Parser<A, string>
  (a: RegExp): Parser<string, string>
  <A, Input = string>(a: Parser<A, Input>): Parser<A, Input>
}

export const p: P = <A, Input>(
  a:
    | ((input: Input, index: number) => Result<A>)
    | string
    | RegExp
    | Parser<A, Input>,
) =>
  typeof a === 'function'
    ? new Parser(a)
    : typeof a === 'string'
    ? string(a)
    : a instanceof RegExp
    ? regex(a)
    : a

export const string = <A extends string>(string: A): Parser<A> => {
  const expected = `expected ${JSON.stringify(string)}`
  return new Parser((input, index) => {
    if (input.slice(index).startsWith(string))
      return Ok(index + string.length, string)
    return Error(index, expected)
  })
}

export const regex = (arg: RegExp | string): Parser<string> => {
  let regex = typeof arg === 'string' ? new RegExp(arg) : arg
  const expected = `expected /${regex.source}/${regex.flags}`
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
): Parser<A, Input> => {
  return new Parser((input, index) => {
    const errors = []
    for (const p of ps) {
      const r = p.fun(input, index)
      if (r.ok || r.index > index) return r
      errors.push(r.value)
    }
    return Error(index, errors.join(' OR '))
  })
}

export const Ok = <A>(index: number, value: A): Ok<A> => ({
  ok: true,
  index,
  value,
})

export const Error = (index: number, value: string): Error => ({
  ok: false,
  index,
  value,
})

export default p
