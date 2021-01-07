export type Result<A> = Ok<A> | Error

export type Ok<A> = { ok: true; input: string; value: A }

export type Error = { ok: false; input: string; value: string }

export class Parser<A> {
  constructor(readonly fun: (input: string) => Result<A>) {}

  parse(input: string): Result<A> {
    return this.fun(input)
  }
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
