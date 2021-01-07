export type Result<A> = Ok<A> | Error

export type Ok<A> = { ok: true; input: string; value: A }

export type Error = { ok: false; input: string; value: string }

export class Parser<A> {
  constructor(readonly fun: (input: string) => Result<A>) {}

  parse(input: string): Result<A> {
    return this.fun(input)
  }
}

export const string = <A extends string>(string: A): Parser<A> =>
  new Parser(input => {
    if (input.startsWith(string)) {
      return { ok: true, input: input.slice(string.length), value: string }
    }
    return { ok: false, input, value: `expected ${JSON.stringify(string)}` }
  })
