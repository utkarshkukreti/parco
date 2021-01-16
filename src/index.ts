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

export class Parser<A> {
  constructor(readonly fun: (input: string, index: number) => Result<A>) {}

  parse(input: string): Result<A> {
    return this.fun(input, 0)
  }

  map<B>(fun: (a: A) => B): Parser<B> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (r.ok) return Ok(r.index, fun(r.value))
      return r
    })
  }

  filter(fun: (a: A) => boolean, error: string): Parser<A> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (r.ok) {
        if (fun(r.value)) return r
        return Error(r.index, error)
      }
      return r
    })
  }

  filterMap<B>(fun: (a: A) => B | null, error: string): Parser<B> {
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

  then<B>(b: Parser<B>): Parser<[A, B]> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      const rb = b.fun(input, r.index)
      if (!rb.ok) return rb
      return Ok(rb.index, [r.value, rb.value])
    })
  }

  thenSkip<B>(b: Parser<B>): Parser<A> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      const rb = b.fun(input, r.index)
      if (!rb.ok) return rb
      return Ok(rb.index, r.value)
    })
  }

  skipThen<B>(b: Parser<B>): Parser<B> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (!r.ok) return r
      return b.fun(input, r.index)
    })
  }

  or(a: Parser<A>): Parser<A> {
    return new Parser((input, index) => {
      const r = this.fun(input, index)
      if (r.ok || r.index > index) return r
      const ra = a.fun(input, index)
      if (ra.ok || ra.index > index) return ra
      return Error(index, `${r.value} OR ${ra.value}`)
    })
  }

  array({ join }: { join?: Parser<unknown> } = {}): Parser<A[]> {
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
}

export type P = {
  <A>(a: (input: string, index: number) => Result<A>): Parser<A>
  <A extends string>(a: A): Parser<A>
  (a: RegExp): Parser<string>
  <A>(a: Parser<A>): Parser<A>
}

export const p: P = <A>(
  a:
    | ((input: string, index: number) => Result<A>)
    | string
    | RegExp
    | Parser<A>,
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
  regex = new RegExp(`^(?:${regex.source})`, regex.flags)
  return new Parser((input, index) => {
    const match = input.slice(index).match(regex)?.[0]
    if (match !== undefined) return Ok(index + match.length, match)
    return Error(index, expected)
  })
}

export const lazy = <A>(p: () => Parser<A>): Parser<A> =>
  new Parser((input, index) => p().fun(input, index))

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
