export type Result<A> = Ok<A> | Error

export type Ok<A> = { ok: true; input: string; value: A }

export type Error = { ok: false; input: string; value: string }

export class Parser<A> {
  constructor(readonly fun: (input: string) => Result<A>) {}

  parse(input: string): Result<A> {
    return this.fun(input)
  }

  map<B>(fun: (a: A) => B): Parser<B> {
    return new Parser(input => {
      const r = this.fun(input)
      if (r.ok) return ok(r.input, fun(r.value))
      return r
    })
  }

  then<B>(b: Parser<B>): Parser<[A, B]> {
    return new Parser(input => {
      const r = this.fun(input)
      if (r.ok) {
        const rb = b.fun(r.input)
        if (rb.ok) return ok(rb.input, [r.value, rb.value])
        return rb
      }
      return r
    })
  }

  or(a: Parser<A>): Parser<A> {
    return new Parser(input => {
      const r = this.fun(input)
      if (r.ok) return r
      const ra = a.fun(input)
      if (ra.ok) return ra
      return error(input, `${r.value} OR ${ra.value}`)
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
    if (input.startsWith(string)) return ok(input.slice(string.length), string)
    return error(input, expected)
  })
}

export const regex = (regex: RegExp): Parser<string> => {
  const expected = `expected /${regex.source}/${regex.flags}`
  regex = new RegExp(`^(?:${regex.source})`, regex.flags)
  return new Parser((input: string) => {
    const match = input.match(regex)?.[0]
    if (match !== undefined) return ok(input.slice(match.length), match)
    return error(input, expected)
  })
}

export const ok = <A>(input: string, value: A): Ok<A> => ({
  ok: true,
  input,
  value,
})

export const error = (input: string, value: string): Error => ({
  ok: false,
  input,
  value,
})

export default p
