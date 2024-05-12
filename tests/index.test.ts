import * as fs from 'fs'
import { test, expect, describe } from 'vitest'

import Arithmetic from '../examples/arithmetic'
import Json from '../examples/json'
import * as p from '../src'

test('string', () => {
  const foo = p.string('foo')

  expect(foo.parse('')).toMatchInlineSnapshot(`
    {
      "expected": ""foo"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('f')).toMatchInlineSnapshot(`
    {
      "expected": ""foo"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('foo')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)
  expect(foo.parse('foo bar')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)

  const keyword: p.Parser<'foo' | 'bar' | 'foobar'> = p.string([
    'foo',
    'bar',
    'foobar',
  ])

  expect(keyword.parse('f')).toMatchInlineSnapshot(`
    {
      "expected": [
        ""foo"",
        ""bar"",
        ""foobar"",
      ],
      "index": 0,
      "ok": false,
    }
  `)

  expect(keyword.parse('foo')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)

  expect(keyword.parse('foob')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)

  expect(keyword.parse('foobar')).toMatchInlineSnapshot(`
    {
      "index": 6,
      "ok": true,
      "value": "foobar",
    }
  `)

  expect(keyword.parse('bar')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "bar",
    }
  `)

  expect(keyword.parse('barfoo')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "bar",
    }
  `)

  const plus: p.Parser<'+' | '+++'> = p.string(['+', '+++'])

  expect(plus.parse('*')).toMatchInlineSnapshot(`
    {
      "expected": [
        ""+"",
        ""+++"",
      ],
      "index": 0,
      "ok": false,
    }
  `)

  expect(plus.parse('+')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "+",
    }
  `)

  expect(plus.parse('++')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "+",
    }
  `)

  expect(plus.parse('+++')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "+++",
    }
  `)

  expect(plus.parse('++++')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "+++",
    }
  `)

  // @ts-expect-error
  const plus_: p.Parser<'+' | '++'> = p.string(['+', '+++'])
  ignore(plus_)
})

test('regex', () => {
  const int = p.regex(/\d+/)
  expect(int.parse('')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
  expect(int.parse('1')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "1",
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "123",
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
  expect(int.parse('123 456')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "123",
    }
  `)
  expect(int.parse('abc')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)

  const foo = p.regex(/foo/giy)
  expect(foo.parse('FO o')).toMatchInlineSnapshot(`
    {
      "expected": "/foo/i",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('FOo bar')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "FOo",
    }
  `)
  expect(foo.parse('a FOo bar')).toMatchInlineSnapshot(`
    {
      "expected": "/foo/i",
      "index": 0,
      "ok": false,
    }
  `)
})

test('regex_', () => {
  const int: p.Parser<undefined> = p.regex_(/\d+/)

  expect(int.parse('')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
  expect(int.parse('1')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": undefined,
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": undefined,
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
  expect(int.parse('123 456')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": undefined,
    }
  `)
  expect(int.parse('abc')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)

  const foo: p.Parser<undefined> = p.regex_(/foo/giy)
  expect(foo.parse('FO o')).toMatchInlineSnapshot(`
    {
      "expected": "/foo/i",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('FOo bar')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": undefined,
    }
  `)
  expect(foo.parse('a FOo bar')).toMatchInlineSnapshot(`
    {
      "expected": "/foo/i",
      "index": 0,
      "ok": false,
    }
  `)
})

test('end', () => {
  const end = p.end()

  expect(end.parse('')).toMatchInlineSnapshot(`
    {
      "index": 0,
      "ok": true,
      "value": undefined,
    }
  `)
  expect(end.parse('foo')).toMatchInlineSnapshot(`
    {
      "expected": "end of input",
      "index": 0,
      "ok": false,
    }
  `)

  const foo = p.string('foo').thenSkip(p.end())

  expect(foo.parse('')).toMatchInlineSnapshot(`
    {
      "expected": ""foo"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('foo')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)
  expect(foo.parse('foobar')).toMatchInlineSnapshot(`
    {
      "expected": "end of input",
      "index": 3,
      "ok": false,
    }
  `)
})

test('Parser.map()', () => {
  const int = p.regex(/\d+/).map(parseInt)

  expect(int.parse('1')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": 1,
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": 123,
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
})

test('Parser.filter()', () => {
  const odd = p
    .regex(/\d+/)
    .map(parseInt)
    .filter(n => n % 2 === 1, 'an odd integer')

  expect(odd.parse('1')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": 1,
    }
  `)

  expect(odd.parse('12')).toMatchInlineSnapshot(`
    {
      "expected": "an odd integer",
      "index": 2,
      "ok": false,
    }
  `)

  expect(odd.parse('123')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": 123,
    }
  `)

  expect(odd.parse('abc')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
})

test('Parser.optional()', () => {
  const ab: p.Parser<['a', 'b'] | null> = p
    .string('a')
    .then(p.string('b'))
    .optional(null)

  expect(ab.parse('')).toMatchInlineSnapshot(`
    {
      "index": 0,
      "ok": true,
      "value": null,
    }
  `)
  expect(ab.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(ab.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)
  expect(ab.parse('abc')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)

  const ab2: p.Parser<['a', 'b'] | '!'> = p
    .string('a')
    .then(p.string('b'))
    .optional('!')

  // @ts-expect-error
  const ab3: p.Parser<['a', 'b']> = p.string('a').then(p.string('b')).optional()
  ignore(ab3)

  expect(ab2.parse('')).toMatchInlineSnapshot(`
    {
      "index": 0,
      "ok": true,
      "value": "!",
    }
  `)
  expect(ab2.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(ab2.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)
  expect(ab2.parse('abc')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)
})

test('Parser.try()', () => {
  const ab = p.string('a').then(p.string('b'))
  const ac = p.string('a').then(p.string('c'))
  const abOrAc: p.Parser<['a', 'b'] | ['a', 'c']> = ab.try().or(ac)

  expect(abOrAc.parse('')).toMatchInlineSnapshot(`
    {
      "expected": [
        ""a"",
        ""a"",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(abOrAc.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""c"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(abOrAc.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)
  expect(abOrAc.parse('ac')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "c",
      ],
    }
  `)
  expect(abOrAc.parse('abc')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)
  expect(abOrAc.parse('acb')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "c",
      ],
    }
  `)
})

test('Parser.bind()', () => {
  const dup = p.regex(/./).bind(string => p.string(string))

  expect(dup.parse('')).toMatchInlineSnapshot(`
    {
      "expected": "/./",
      "index": 0,
      "ok": false,
    }
  `)
  expect(dup.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(dup.parse('aa')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": "a",
    }
  `)
  expect(dup.parse('ab')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(dup.parse('aab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": "a",
    }
  `)
  expect(dup.parse('aba')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 1,
      "ok": false,
    }
  `)
})

test('Parser.then()', () => {
  const int = p.regex(/\d+/).map(parseInt)
  const expr = int
    .then(p.string('+'))
    .then(int)
    .map(([[a, _], b]) => a + b)

  expect(expr.parse('')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
  expect(expr.parse('1')).toMatchInlineSnapshot(`
    {
      "expected": ""+"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(expr.parse('1+')).toMatchInlineSnapshot(`
    {
      "expected": "/\\d+/",
      "index": 2,
      "ok": false,
    }
  `)
  expect(expr.parse('1+23')).toMatchInlineSnapshot(`
    {
      "index": 4,
      "ok": true,
      "value": 24,
    }
  `)
  expect(expr.parse('1+23+')).toMatchInlineSnapshot(`
    {
      "index": 4,
      "ok": true,
      "value": 24,
    }
  `)
  expect(expr.parse('1+23+456')).toMatchInlineSnapshot(`
    {
      "index": 4,
      "ok": true,
      "value": 24,
    }
  `)
})

test('Parser.thenSkip() / Parser.skipThen()', () => {
  const a: p.Parser<'a'> = p.string('a').thenSkip(p.string('b'))
  const b: p.Parser<'b'> = p.string('a').skipThen(p.string('b'))
  const ab: p.Parser<['a', 'b']> = p
    .string('z')
    .skipThen(p.string('a'))
    .thenSkip(p.string('z'))
    .then(p.string('b'))

  expect(a.parse('')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(a.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(a.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": "a",
    }
  `)

  expect(b.parse('')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(b.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(b.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": "b",
    }
  `)

  expect(ab.parse('')).toMatchInlineSnapshot(`
    {
      "expected": ""z"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(ab.parse('z')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(ab.parse('za')).toMatchInlineSnapshot(`
    {
      "expected": ""z"",
      "index": 2,
      "ok": false,
    }
  `)
  expect(ab.parse('zaz')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 3,
      "ok": false,
    }
  `)
  expect(ab.parse('zazb')).toMatchInlineSnapshot(`
    {
      "index": 4,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)
})

test('Parser.or()', () => {
  const abc = p.string('a').or(p.string('b')).or(p.regex(/c/i))

  expect(abc.parse('')).toMatchInlineSnapshot(`
    {
      "expected": [
        [
          ""a"",
          ""b"",
        ],
        "/c/i",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(abc.parse('a')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "a",
    }
  `)
  expect(abc.parse('b')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "b",
    }
  `)
  expect(abc.parse('c')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "c",
    }
  `)
  expect(abc.parse('C')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "C",
    }
  `)
  expect(abc.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "a",
    }
  `)
  expect(abc.parse('Ca')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "C",
    }
  `)

  const a = p
    .string('a')
    .then(p.string('b'))
    .map(([a, b]) => a + b)
    .or(p.string('a'))

  expect(a.parse('')).toMatchInlineSnapshot(`
    {
      "expected": [
        ""a"",
        ""a"",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(a.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(a.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": "ab",
    }
  `)
  expect(a.parse('abc')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": "ab",
    }
  `)

  const ab: p.Parser<'a' | 'b'> = p.string('a').or(p.string('b'))
  ignore(ab)
})

test('Parser.repeat()', () => {
  const abs: p.Parser<['a', 'b'][]> = p.string('a').then(p.string('b')).repeat()

  expect(abs.parse('')).toMatchInlineSnapshot(`
    {
      "index": 0,
      "ok": true,
      "value": [],
    }
  `)
  expect(abs.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(abs.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        [
          "a",
          "b",
        ],
      ],
    }
  `)
  expect(abs.parse('abc')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        [
          "a",
          "b",
        ],
      ],
    }
  `)
  expect(abs.parse('aba')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 3,
      "ok": false,
    }
  `)
  expect(abs.parse('abab')).toMatchInlineSnapshot(`
    {
      "index": 4,
      "ok": true,
      "value": [
        [
          "a",
          "b",
        ],
        [
          "a",
          "b",
        ],
      ],
    }
  `)
  expect(abs.parse('ababa')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 5,
      "ok": false,
    }
  `)

  const a3: p.Parser<'a'[]> = p.string('a').repeat(3)

  expect(a3.parse('')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(a3.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(a3.parse('b')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(a3.parse('aa')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 2,
      "ok": false,
    }
  `)
  expect(a3.parse('ab')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(a3.parse('aaa')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": [
        "a",
        "a",
        "a",
      ],
    }
  `)
  expect(a3.parse('aab')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 2,
      "ok": false,
    }
  `)
  expect(a3.parse('aaab')).toMatchInlineSnapshot(`
    {
      "index": 3,
      "ok": true,
      "value": [
        "a",
        "a",
        "a",
      ],
    }
  `)
})

test('Parser.join()', () => {
  const as: p.Parser<'a'[]> = p
    .string('a')
    .join(p.string(';').then(p.string(';')))

  expect(as.parse('')).toMatchInlineSnapshot(`
    {
      "index": 0,
      "ok": true,
      "value": [],
    }
  `)
  expect(as.parse('a')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": [
        "a",
      ],
    }
  `)
  expect(as.parse('az')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": [
        "a",
      ],
    }
  `)
  expect(as.parse('a;')).toMatchInlineSnapshot(`
    {
      "expected": "";"",
      "index": 2,
      "ok": false,
    }
  `)
  expect(as.parse('a;;')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 3,
      "ok": false,
    }
  `)
  expect(as.parse('a;;a')).toMatchInlineSnapshot(`
    {
      "index": 4,
      "ok": true,
      "value": [
        "a",
        "a",
      ],
    }
  `)
  expect(as.parse('a;;az')).toMatchInlineSnapshot(`
    {
      "index": 4,
      "ok": true,
      "value": [
        "a",
        "a",
      ],
    }
  `)
  expect(as.parse('a;;a;')).toMatchInlineSnapshot(`
    {
      "expected": "";"",
      "index": 5,
      "ok": false,
    }
  `)
  expect(as.parse('a;;a;;')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 6,
      "ok": false,
    }
  `)
  expect(as.parse('a;;a;;a')).toMatchInlineSnapshot(`
    {
      "index": 7,
      "ok": true,
      "value": [
        "a",
        "a",
        "a",
      ],
    }
  `)
  expect(as.parse('a;;a;;a;')).toMatchInlineSnapshot(`
    {
      "expected": "";"",
      "index": 8,
      "ok": false,
    }
  `)
})

test('Parser.chainLeft() / Parser.chainRight()', () => {
  const Integer = p.regex(/\d+/, { expected: 'an integer' })

  const op = (op: string) =>
    p.string(op).map(() => (l: string, r: string) => `(${op} ${l} ${r})`)

  const expr: p.Parser<string> = Integer.chainRight(
    p.or([op('**'), op('^^'), op('||')]),
  ).chainLeft(p.or([op('+'), op('-')]))

  const parse = (string: string) => {
    const r = expr.parse(string)
    return r.ok ? r.value : r
  }

  expect(parse('')).toMatchInlineSnapshot(`
    {
      "expected": "an integer",
      "index": 0,
      "ok": false,
    }
  `)
  expect(parse('1+')).toMatchInlineSnapshot(`
    {
      "expected": "an integer",
      "index": 2,
      "ok": false,
    }
  `)
  expect(parse('123')).toMatchInlineSnapshot(`"123"`)
  expect(parse('1+2-3')).toMatchInlineSnapshot(`"(- (+ 1 2) 3)"`)
  expect(parse('1**2**3**4+5**6+7')).toMatchInlineSnapshot(
    `"(+ (+ (** 1 (** 2 (** 3 4))) (** 5 6)) 7)"`,
  )
  expect(parse('1**2**3**4**5')).toMatchInlineSnapshot(
    `"(** 1 (** 2 (** 3 (** 4 5))))"`,
  )
  expect(parse('1**2^^3^^4||5')).toMatchInlineSnapshot(
    `"(** 1 (^^ 2 (^^ 3 (|| 4 5))))"`,
  )
})

test('Parser.pipe()', () => {
  const bar: p.Parser<'bar'> = p.string('foo').pipe(foo => foo.map(() => 'bar'))
  ignore(bar)
})

test('lazy', () => {
  const ab = p.string('a').then(p.lazy(() => b))
  const b = p.string('b')

  expect(ab.parse('')).toMatchInlineSnapshot(`
    {
      "expected": ""a"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(ab.parse('a')).toMatchInlineSnapshot(`
    {
      "expected": ""b"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(ab.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)
  expect(ab.parse('abc')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "a",
        "b",
      ],
    }
  `)
})

test('or', () => {
  type T = 'a' | ['b', 'c'] | 'd'
  const abcd: p.Parser<T> = p.or<T>([
    p.string('a'),
    p.string('b').then(p.string('c')),
    p.string('d'),
  ])

  expect(abcd.parse('')).toMatchInlineSnapshot(`
    {
      "expected": [
        ""a"",
        ""b"",
        ""d"",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(abcd.parse('a')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "a",
    }
  `)
  expect(abcd.parse('b')).toMatchInlineSnapshot(`
    {
      "expected": ""c"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(abcd.parse('bc')).toMatchInlineSnapshot(`
    {
      "index": 2,
      "ok": true,
      "value": [
        "b",
        "c",
      ],
    }
  `)
  expect(abcd.parse('c')).toMatchInlineSnapshot(`
    {
      "expected": [
        ""a"",
        ""b"",
        ""d"",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(abcd.parse('d')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "d",
    }
  `)
  expect(abcd.parse('ab')).toMatchInlineSnapshot(`
    {
      "index": 1,
      "ok": true,
      "value": "a",
    }
  `)
})

test('succeed', () => {
  const foo: p.Parser<'foo'> = p.succeed('foo')
  // @ts-expect-error
  const bar: p.Parser<'foo'> = p.succeed('bar')
  ignore(bar)

  expect(foo.parse('')).toMatchInlineSnapshot(`
    {
      "index": 0,
      "ok": true,
      "value": "foo",
    }
  `)
})

test('fail', () => {
  const foo: p.Parser<'foo'> = p.string('foo').thenSkip(p.fail('!!!'))

  expect(foo.parse('foo')).toMatchInlineSnapshot(`
    {
      "expected": "!!!",
      "index": 3,
      "ok": false,
    }
  `)
})

describe('examples', () => {
  test('json', () => {
    expect(Json('')).toMatchInlineSnapshot(`
      {
        "expected": [
          "a string",
          "a number",
          "an object",
          "an array",
          "a keyword",
        ],
        "index": 0,
        "ok": false,
      }
    `)
    expect(Json('123')).toMatchInlineSnapshot(`
      {
        "index": 3,
        "ok": true,
        "value": "123",
      }
    `)
    expect(Json('-123e-7')).toMatchInlineSnapshot(`
      {
        "index": 7,
        "ok": true,
        "value": "-123e-7",
      }
    `)
    expect(Json('"foo \\t\\r\\nbar"')).toMatchInlineSnapshot(`
      {
        "index": 15,
        "ok": true,
        "value": ""foo \\t\\r\\nbar"",
      }
    `)
    expect(Json('["foo"]')).toMatchInlineSnapshot(`
      {
        "index": 7,
        "ok": true,
        "value": [
          ""foo"",
        ],
      }
    `)
    expect(Json('["foo":]')).toMatchInlineSnapshot(`
      {
        "expected": "]",
        "index": 6,
        "ok": false,
      }
    `)
    expect(Json('{"foo": "bar"}')).toMatchInlineSnapshot(`
      {
        "index": 14,
        "ok": true,
        "value": [
          [
            ""foo"",
            ""bar"",
          ],
        ],
      }
    `)
    expect(Json('{1: "bar"}')).toMatchInlineSnapshot(`
      {
        "expected": "}",
        "index": 1,
        "ok": false,
      }
    `)
  })

  test('json: json-test-suite', () => {
    const read = (startsWith: string) => {
      const path = 'node_modules/json-test-suite/test_parsing'
      return fs
        .readdirSync(path)
        .filter(file => file.startsWith(startsWith))
        .map(file => fs.readFileSync(path + '/' + file, 'utf-8'))
    }

    const ys = read('y_')
    const ns = read('n_')

    expect(ys).toHaveLength(95)
    expect(ns).toHaveLength(188)

    for (const input of ys) {
      expect(Json(input).ok).toEqual(true)
    }

    for (const input of ns) {
      // Some of these may throw an error due to stack overflow while parsing,
      // which is fine.
      let ok = false
      try {
        ok = Json(input).ok
      } catch {}
      expect(ok).toEqual(false)
    }
  })

  test('arithmetic', () => {
    expect(Arithmetic('')).toMatchInlineSnapshot(`
      {
        "expected": [
          "an integer",
          ""("",
        ],
        "index": 0,
        "ok": false,
      }
    `)
    expect(Arithmetic('1')).toMatchInlineSnapshot(`1`)
    expect(Arithmetic('2*3')).toMatchInlineSnapshot(`6`)
    expect(Arithmetic('4+5*6')).toMatchInlineSnapshot(`34`)
    expect(Arithmetic('7*8+9')).toMatchInlineSnapshot(`65`)
    expect(Arithmetic('((10)+(9*8-7*6)*(5))-4-3-(2-1)')).toMatchInlineSnapshot(
      `152`,
    )
    expect(Arithmetic('1+2*3/4-5-6/7*8/9')).toMatchInlineSnapshot(
      `-3.261904761904762`,
    )
    expect(Arithmetic('999*999999*99999/9999')).toMatchInlineSnapshot(
      `9990889199.019802`,
    )
    expect(Arithmetic('2**3')).toMatchInlineSnapshot(`8`)
    expect(Arithmetic('2+3**4')).toMatchInlineSnapshot(`83`)
    expect(Arithmetic('2+3**2**5')).toMatchInlineSnapshot(`1853020188851843`)
    expect(Arithmetic('2+3**4+5**6')).toMatchInlineSnapshot(`15708`)
    expect(Arithmetic('2+3**4+5**6**2')).toMatchInlineSnapshot(
      `1.455191522836685e+25`,
    )
    expect(Arithmetic('-1')).toMatchInlineSnapshot(`-1`)
    expect(Arithmetic('--2')).toMatchInlineSnapshot(`2`)
    expect(Arithmetic('---3')).toMatchInlineSnapshot(`-3`)
    expect(Arithmetic('-4----5')).toMatchInlineSnapshot(`1`)
    expect(Arithmetic('6*-7/-8+9**-2')).toMatchInlineSnapshot(
      `5.262345679012346`,
    )
    expect(Arithmetic('-3')).toMatchInlineSnapshot(`-3`)
    expect(Arithmetic('~3')).toMatchInlineSnapshot(`-4`)
    expect(Arithmetic('~-3')).toMatchInlineSnapshot(`2`)
    expect(Arithmetic('-~3')).toMatchInlineSnapshot(`4`)
    expect(Arithmetic('-~-3')).toMatchInlineSnapshot(`-2`)
    expect(Arithmetic('~-~3')).toMatchInlineSnapshot(`-5`)
    expect(Arithmetic('~-~3-~~4+4**~1+~8')).toMatchInlineSnapshot(`-17.9375`)
    expect(Arithmetic('a')).toMatchInlineSnapshot(`
      {
        "expected": [
          "an integer",
          ""("",
        ],
        "index": 0,
        "ok": false,
      }
    `)
    expect(Arithmetic('1+')).toMatchInlineSnapshot(`
      {
        "expected": [
          "an integer",
          ""("",
        ],
        "index": 2,
        "ok": false,
      }
    `)
    expect(Arithmetic('1*(')).toMatchInlineSnapshot(`
      {
        "expected": [
          "an integer",
          ""("",
        ],
        "index": 3,
        "ok": false,
      }
    `)
    expect(Arithmetic('1*(((33)+')).toMatchInlineSnapshot(`
      {
        "expected": [
          "an integer",
          ""("",
        ],
        "index": 9,
        "ok": false,
      }
    `)
    expect(Arithmetic('1!')).toMatchInlineSnapshot(`
      {
        "expected": "end of input",
        "index": 1,
        "ok": false,
      }
    `)
  })
})

const ignore = (..._args: unknown[]) => {}
