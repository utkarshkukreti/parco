export type Result<A> = Ok<A> | Error

export type Ok<A> = { ok: true; input: string; consumed: boolean; value: A }

export type Error = {
  ok: false
  input: string
  consumed: boolean
  value: string
}

export class Parser<A> {
  constructor(readonly fun: (input: string) => Result<A>) {}

  parse(input: string): Result<A> {
    return this.fun(input)
  }

  map<B>(fun: (a: A) => B): Parser<B> {
    return new Parser(input => {
      const r = this.fun(input)
      if (r.ok) return ok(r.input, r.consumed, fun(r.value))
      return r
    })
  }

  then<B>(b: Parser<B>): Parser<[A, B]> {
    return new Parser(input => {
      const r = this.fun(input)
      if (r.ok) {
        const rb = b.fun(r.input)
        if (rb.ok)
          return ok(rb.input, r.consumed || rb.consumed, [r.value, rb.value])
        return error(rb.input, r.consumed || rb.consumed, rb.value)
      }
      return r
    })
  }

  thenSkip<B>(b: Parser<B>): Parser<A> {
    return this.then(b).map(r => r[0])
  }

  skipThen<B>(b: Parser<B>): Parser<B> {
    return this.then(b).map(r => r[1])
  }

  or(a: Parser<A>): Parser<A> {
    return new Parser(input => {
      const r = this.fun(input)
      if (r.ok || r.consumed) return r
      const ra = a.fun(input)
      if (ra.ok || ra.consumed) return ra
      return error(
        input,
        r.consumed || ra.consumed,
        `${r.value} OR ${ra.value}`,
      )
    })
  }

  array({ join }: { join?: Parser<unknown> } = {}): Parser<A[]> {
    return new Parser(input => {
      const value = []
      for (let i = 0; ; i++) {
        if (join && i > 0) {
          const r1 = join.fun(input)
          if (r1.ok) {
          } else if (!r1.consumed) return ok(r1.input, value.length > 0, value)
          else return r1
          const r = this.fun(r1.input)
          if (r.ok) value.push(r.value)
          else return r
          input = r.input
        } else {
          const r = this.fun(input)
          if (r.ok) value.push(r.value)
          else if (!r.consumed) return ok(r.input, value.length > 0, value)
          else return r
          input = r.input
        }
      }
    })
  }
}

export type P<A> = A extends string
  ? Parser<A>
  : A extends RegExp
  ? Parser<string>
  : A extends Parser<unknown>
  ? A
  : never

export type IsP = string | RegExp | Parser<unknown>

export const p = <A extends IsP>(a: A): P<A> => {
  if (typeof a === 'string') return string(a) as any
  if (a instanceof RegExp) return regex(a) as any
  if (a instanceof Parser) return a as any

  throw new Error('unreachable')
}

export const string = <A extends string>(string: A): Parser<A> => {
  const expected = `expected ${JSON.stringify(string)}`
  return new Parser(input => {
    if (input.startsWith(string))
      return ok(input.slice(string.length), true, string)
    return error(input, false, expected)
  })
}

export const regex = (arg: RegExp | string): Parser<string> => {
  let regex = typeof arg === 'string' ? new RegExp(arg) : arg
  const expected = `expected /${regex.source}/${regex.flags}`
  regex = new RegExp(`^(?:${regex.source})`, regex.flags)
  return new Parser((input: string) => {
    const match = input.match(regex)?.[0]
    if (match !== undefined) return ok(input.slice(match.length), true, match)
    return error(input, false, expected)
  })
}

export const lazy = <A>(p: () => Parser<A>): Parser<A> =>
  new Parser(input => p().fun(input))

export const ok = <A>(input: string, consumed: boolean, value: A): Ok<A> => ({
  ok: true,
  input,
  consumed,
  value,
})

export const error = (
  input: string,
  consumed: boolean,
  value: string,
): Error => ({
  ok: false,
  input,
  consumed,
  value,
})

export default p
