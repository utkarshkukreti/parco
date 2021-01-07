export type Result<A> = Ok<A> | Error

export type Ok<A> = { ok: true; input: string; value: A }

export type Error = { ok: false; input: string; value: string }

export class Parser<A> {
  constructor(readonly fun: (input: string) => Result<A>) {}

  parse(input: string): Result<A> {
    return this.fun(input)
  }
}
