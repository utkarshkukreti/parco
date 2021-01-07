export type Result<A> = Ok<A> | Error

export type Ok<A> = { ok: true; input: string; value: A }

export type Error = { ok: false; input: string; value: string }
