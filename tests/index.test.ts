import * as fs from 'fs'

import Arithmetic from '../examples/arithmetic'
import Json from '../examples/json'
import P, * as p from '../src'

test('string', () => {
  const foo = p.string('foo')

  expect(foo.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"foo\\"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('f')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"foo\\"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('foo')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)
  expect(foo.parse('foo bar')).toMatchInlineSnapshot(`
    Object {
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
    Object {
      "expected": Array [
        "\\"foo\\"",
        "\\"bar\\"",
        "\\"foobar\\"",
      ],
      "index": 0,
      "ok": false,
    }
  `)

  expect(keyword.parse('foo')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)

  expect(keyword.parse('foob')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)

  expect(keyword.parse('foobar')).toMatchInlineSnapshot(`
    Object {
      "index": 6,
      "ok": true,
      "value": "foobar",
    }
  `)

  expect(keyword.parse('bar')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "bar",
    }
  `)

  expect(keyword.parse('barfoo')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "bar",
    }
  `)

  const plus: p.Parser<'+' | '+++'> = p.string(['+', '+++'])

  expect(plus.parse('*')).toMatchInlineSnapshot(`
    Object {
      "expected": Array [
        "\\"+\\"",
        "\\"+++\\"",
      ],
      "index": 0,
      "ok": false,
    }
  `)

  expect(plus.parse('+')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "+",
    }
  `)

  expect(plus.parse('++')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "+",
    }
  `)

  expect(plus.parse('+++')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "+++",
    }
  `)

  expect(plus.parse('++++')).toMatchInlineSnapshot(`
    Object {
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
    Object {
      "expected": "/\\\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
  expect(int.parse('1')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "1",
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "123",
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    Object {
      "expected": "/\\\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
  expect(int.parse('123 456')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "123",
    }
  `)
  expect(int.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "expected": "/\\\\d+/",
      "index": 0,
      "ok": false,
    }
  `)

  const foo = p.regex(/foo/giy)
  expect(foo.parse('FO o')).toMatchInlineSnapshot(`
    Object {
      "expected": "/foo/i",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('FOo bar')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "FOo",
    }
  `)
  expect(foo.parse('a FOo bar')).toMatchInlineSnapshot(`
    Object {
      "expected": "/foo/i",
      "index": 0,
      "ok": false,
    }
  `)
})

test('regex_', () => {
  const ints: p.Parser<void>[] = [p.regex_(/\d+/), p.regex_('\\d+')]

  for (const int of ints) {
    expect(int.parse('')).toMatchInlineSnapshot(`
      Object {
        "expected": "/\\\\d+/",
        "index": 0,
        "ok": false,
      }
    `)
    expect(int.parse('1')).toMatchInlineSnapshot(`
      Object {
        "index": 1,
        "ok": true,
        "value": undefined,
      }
    `)
    expect(int.parse('123')).toMatchInlineSnapshot(`
      Object {
        "index": 3,
        "ok": true,
        "value": undefined,
      }
    `)
    expect(int.parse(' 123')).toMatchInlineSnapshot(`
      Object {
        "expected": "/\\\\d+/",
        "index": 0,
        "ok": false,
      }
    `)
    expect(int.parse('123 456')).toMatchInlineSnapshot(`
      Object {
        "index": 3,
        "ok": true,
        "value": undefined,
      }
    `)
    expect(int.parse('abc')).toMatchInlineSnapshot(`
      Object {
        "expected": "/\\\\d+/",
        "index": 0,
        "ok": false,
      }
    `)
  }

  const foo: p.Parser<void> = p.regex_(/foo/giy)
  expect(foo.parse('FO o')).toMatchInlineSnapshot(`
    Object {
      "expected": "/foo/i",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('FOo bar')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": undefined,
    }
  `)
  expect(foo.parse('a FOo bar')).toMatchInlineSnapshot(`
    Object {
      "expected": "/foo/i",
      "index": 0,
      "ok": false,
    }
  `)
})

test('end', () => {
  const end = p.end()

  expect(end.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": true,
      "value": undefined,
    }
  `)
  expect(end.parse('foo')).toMatchInlineSnapshot(`
    Object {
      "expected": "end of input",
      "index": 0,
      "ok": false,
    }
  `)

  const foo = P('foo').thenSkip(p.end())

  expect(foo.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"foo\\"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(foo.parse('foo')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "foo",
    }
  `)
  expect(foo.parse('foobar')).toMatchInlineSnapshot(`
    Object {
      "expected": "end of input",
      "index": 3,
      "ok": false,
    }
  `)
})

test('p', () => {
  const foo: p.Parser<'foo'> = P('foo')
  const bar: p.Parser<string> = P('bar')
  const baz: p.Parser<string> = P(/baz/i)
  const baz2: p.Parser<'baz'> = P(P('baz'))
  const baz3: p.Parser<'baz'> = P((_, index) => p.Ok(index, 'baz'))
  try {
    // @ts-expect-error
    P(123)
  } catch {}
  ignore(foo, bar, baz, baz2, baz3)
})

test('Parser.map()', () => {
  const int = p.regex(/\d+/).map(parseInt)

  expect(int.parse('1')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": 1,
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": 123,
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    Object {
      "expected": "/\\\\d+/",
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
    Object {
      "index": 1,
      "ok": true,
      "value": 1,
    }
  `)

  expect(odd.parse('12')).toMatchInlineSnapshot(`
    Object {
      "expected": "an odd integer",
      "index": 2,
      "ok": false,
    }
  `)

  expect(odd.parse('123')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": 123,
    }
  `)

  expect(odd.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "expected": "/\\\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
})

test('Parser.optional()', () => {
  const ab: p.Parser<['a', 'b'] | null> = P('a').then(P('b')).optional(null)

  expect(ab.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": true,
      "value": null,
    }
  `)
  expect(ab.parse('a')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(ab.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        "a",
        "b",
      ],
    }
  `)
  expect(ab.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        "a",
        "b",
      ],
    }
  `)

  const ab2: p.Parser<['a', 'b'] | '!'> = P('a').then(P('b')).optional('!')

  // @ts-expect-error
  const ab3: p.Parser<['a', 'b']> = P('a').then(P('b')).optional()
  ignore(ab3)

  expect(ab2.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": true,
      "value": "!",
    }
  `)
  expect(ab2.parse('a')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(ab2.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        "a",
        "b",
      ],
    }
  `)
  expect(ab2.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        "a",
        "b",
      ],
    }
  `)
})

test('Parser.bind()', () => {
  const dup = P(/./).bind(string => P(string))

  expect(dup.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": "/./",
      "index": 0,
      "ok": false,
    }
  `)
  expect(dup.parse('a')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(dup.parse('aa')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": "a",
    }
  `)
  expect(dup.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(dup.parse('aab')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": "a",
    }
  `)
  expect(dup.parse('aba')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
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
    Object {
      "expected": "/\\\\d+/",
      "index": 0,
      "ok": false,
    }
  `)
  expect(expr.parse('1')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"+\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(expr.parse('1+')).toMatchInlineSnapshot(`
    Object {
      "expected": "/\\\\d+/",
      "index": 2,
      "ok": false,
    }
  `)
  expect(expr.parse('1+23')).toMatchInlineSnapshot(`
    Object {
      "index": 4,
      "ok": true,
      "value": 24,
    }
  `)
  expect(expr.parse('1+23+')).toMatchInlineSnapshot(`
    Object {
      "index": 4,
      "ok": true,
      "value": 24,
    }
  `)
  expect(expr.parse('1+23+456')).toMatchInlineSnapshot(`
    Object {
      "index": 4,
      "ok": true,
      "value": 24,
    }
  `)
})

test('Parser.thenSkip() / Parser.skipThen()', () => {
  const a: p.Parser<'a'> = P('a').thenSkip(P('b'))
  const b: p.Parser<'b'> = P('a').skipThen(P('b'))
  const ab: p.Parser<['a', 'b']> = P('z')
    .skipThen(P('a'))
    .thenSkip(P('z'))
    .then(P('b'))

  expect(a.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(a.parse('a')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(a.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": "a",
    }
  `)

  expect(b.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(b.parse('a')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(b.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": "b",
    }
  `)

  expect(ab.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"z\\"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(ab.parse('z')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(ab.parse('za')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"z\\"",
      "index": 2,
      "ok": false,
    }
  `)
  expect(ab.parse('zaz')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 3,
      "ok": false,
    }
  `)
  expect(ab.parse('zazb')).toMatchInlineSnapshot(`
    Object {
      "index": 4,
      "ok": true,
      "value": Array [
        "a",
        "b",
      ],
    }
  `)
})

test('Parser.or()', () => {
  const abc = P<string>('a').or(P('b')).or(P(/c/i))

  expect(abc.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": Array [
        Array [
          "\\"a\\"",
          "\\"b\\"",
        ],
        "/c/i",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(abc.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "a",
    }
  `)
  expect(abc.parse('b')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "b",
    }
  `)
  expect(abc.parse('c')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "c",
    }
  `)
  expect(abc.parse('C')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "C",
    }
  `)
  expect(abc.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "a",
    }
  `)
  expect(abc.parse('Ca')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "C",
    }
  `)

  const a = P('a')
    .then(P('b'))
    .map(([a, b]) => a + b)
    .or(P('a'))

  expect(a.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": Array [
        "\\"a\\"",
        "\\"a\\"",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(a.parse('a')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(a.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": "ab",
    }
  `)
  expect(a.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": "ab",
    }
  `)

  const ab: p.Parser<'a' | 'b'> = P('a').or(P('b'))
  ignore(ab)
})

test('Parser.repeat()', () => {
  const abs: p.Parser<['a', 'b'][]> = P('a').then(P('b')).repeat()

  expect(abs.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": true,
      "value": Array [],
    }
  `)
  expect(abs.parse('a')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(abs.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        Array [
          "a",
          "b",
        ],
      ],
    }
  `)
  expect(abs.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        Array [
          "a",
          "b",
        ],
      ],
    }
  `)
  expect(abs.parse('aba')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 3,
      "ok": false,
    }
  `)
  expect(abs.parse('abab')).toMatchInlineSnapshot(`
    Object {
      "index": 4,
      "ok": true,
      "value": Array [
        Array [
          "a",
          "b",
        ],
        Array [
          "a",
          "b",
        ],
      ],
    }
  `)
  expect(abs.parse('ababa')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 5,
      "ok": false,
    }
  `)
})

test('Parser.join()', () => {
  const as: p.Parser<'a'[]> = P('a').join(P(';').then(P(';')))

  expect(as.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": true,
      "value": Array [],
    }
  `)
  expect(as.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": Array [
        "a",
      ],
    }
  `)
  expect(as.parse('az')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": Array [
        "a",
      ],
    }
  `)
  expect(as.parse('a;')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\";\\"",
      "index": 2,
      "ok": false,
    }
  `)
  expect(as.parse('a;;')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
      "index": 3,
      "ok": false,
    }
  `)
  expect(as.parse('a;;a')).toMatchInlineSnapshot(`
    Object {
      "index": 4,
      "ok": true,
      "value": Array [
        "a",
        "a",
      ],
    }
  `)
  expect(as.parse('a;;az')).toMatchInlineSnapshot(`
    Object {
      "index": 4,
      "ok": true,
      "value": Array [
        "a",
        "a",
      ],
    }
  `)
  expect(as.parse('a;;a;')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\";\\"",
      "index": 5,
      "ok": false,
    }
  `)
  expect(as.parse('a;;a;;')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
      "index": 6,
      "ok": false,
    }
  `)
  expect(as.parse('a;;a;;a')).toMatchInlineSnapshot(`
    Object {
      "index": 7,
      "ok": true,
      "value": Array [
        "a",
        "a",
        "a",
      ],
    }
  `)
  expect(as.parse('a;;a;;a;')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\";\\"",
      "index": 8,
      "ok": false,
    }
  `)
})

test('Parser.chainLeft() / Parser.chainRight()', () => {
  const Integer = p.regex(/\d+/, { expected: 'an integer' })

  const op = (op: string) =>
    P(op).map(() => (l: string, r: string) => `(${op} ${l} ${r})`)

  const expr: p.Parser<string> = Integer.chainRight(
    p.or([op('**'), op('^^'), op('||')]),
  ).chainLeft(p.or([op('+'), op('-')]))

  const parse = (string: string) => {
    const r = expr.parse(string)
    return r.ok ? r.value : r
  }

  expect(parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": "an integer",
      "index": 0,
      "ok": false,
    }
  `)
  expect(parse('1+')).toMatchInlineSnapshot(`
    Object {
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
  const bar: p.Parser<'bar'> = P('foo').pipe(foo => foo.map(() => 'bar'))
  ignore(bar)
})

test('lazy', () => {
  const ab = P('a').then(p.lazy(() => b))
  const b = P('b')

  expect(ab.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"a\\"",
      "index": 0,
      "ok": false,
    }
  `)
  expect(ab.parse('a')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"b\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(ab.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        "a",
        "b",
      ],
    }
  `)
  expect(ab.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        "a",
        "b",
      ],
    }
  `)
})

test('or', () => {
  type T = 'a' | ['b', 'c'] | 'd'
  const abcd: p.Parser<T> = p.or<T>([P('a'), P('b').then(P('c')), P('d')])

  expect(abcd.parse('')).toMatchInlineSnapshot(`
    Object {
      "expected": Array [
        "\\"a\\"",
        "\\"b\\"",
        "\\"d\\"",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(abcd.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "a",
    }
  `)
  expect(abcd.parse('b')).toMatchInlineSnapshot(`
    Object {
      "expected": "\\"c\\"",
      "index": 1,
      "ok": false,
    }
  `)
  expect(abcd.parse('bc')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": true,
      "value": Array [
        "b",
        "c",
      ],
    }
  `)
  expect(abcd.parse('c')).toMatchInlineSnapshot(`
    Object {
      "expected": Array [
        "\\"a\\"",
        "\\"b\\"",
        "\\"d\\"",
      ],
      "index": 0,
      "ok": false,
    }
  `)
  expect(abcd.parse('d')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "d",
    }
  `)
  expect(abcd.parse('ab')).toMatchInlineSnapshot(`
    Object {
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
    Object {
      "index": 0,
      "ok": true,
      "value": "foo",
    }
  `)
})

test('fail', () => {
  const foo: p.Parser<'foo'> = P('foo').thenSkip(p.fail('!!!'))

  expect(foo.parse('foo')).toMatchInlineSnapshot(`
    Object {
      "expected": "!!!",
      "index": 3,
      "ok": false,
    }
  `)
})

describe('examples', () => {
  test('json', () => {
    expect(Json('')).toMatchInlineSnapshot(`
      Object {
        "expected": Array [
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
      Object {
        "index": 3,
        "ok": true,
        "value": "123",
      }
    `)
    expect(Json('-123e-7')).toMatchInlineSnapshot(`
      Object {
        "index": 7,
        "ok": true,
        "value": "-123e-7",
      }
    `)
    expect(Json('"foo \\t\\r\\nbar"')).toMatchInlineSnapshot(`
      Object {
        "index": 15,
        "ok": true,
        "value": "\\"foo \\\\t\\\\r\\\\nbar\\"",
      }
    `)
    expect(Json('["foo"]')).toMatchInlineSnapshot(`
      Object {
        "index": 7,
        "ok": true,
        "value": Array [
          "\\"foo\\"",
        ],
      }
    `)
    expect(Json('["foo":]')).toMatchInlineSnapshot(`
      Object {
        "expected": "]",
        "index": 6,
        "ok": false,
      }
    `)
    expect(Json('{"foo": "bar"}')).toMatchInlineSnapshot(`
      Object {
        "index": 14,
        "ok": true,
        "value": Array [
          Array [
            "\\"foo\\"",
            "\\"bar\\"",
          ],
        ],
      }
    `)
    expect(Json('{1: "bar"}')).toMatchInlineSnapshot(`
      Object {
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
      Object {
        "expected": Array [
          "an integer",
          "\\"(\\"",
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
      Object {
        "expected": Array [
          "an integer",
          "\\"(\\"",
        ],
        "index": 0,
        "ok": false,
      }
    `)
    expect(Arithmetic('1+')).toMatchInlineSnapshot(`
      Object {
        "expected": Array [
          "an integer",
          "\\"(\\"",
        ],
        "index": 2,
        "ok": false,
      }
    `)
    expect(Arithmetic('1*(')).toMatchInlineSnapshot(`
      Object {
        "expected": Array [
          "an integer",
          "\\"(\\"",
        ],
        "index": 3,
        "ok": false,
      }
    `)
    expect(Arithmetic('1*(((33)+')).toMatchInlineSnapshot(`
      Object {
        "expected": Array [
          "an integer",
          "\\"(\\"",
        ],
        "index": 9,
        "ok": false,
      }
    `)
    expect(Arithmetic('1!')).toMatchInlineSnapshot(`
      Object {
        "expected": "end of input",
        "index": 1,
        "ok": false,
      }
    `)
  })
})

const ignore = (..._args: unknown[]) => {}
