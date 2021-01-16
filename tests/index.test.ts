import * as fs from 'fs'

import * as globby from 'globby'

import Json from '../examples/json'
import P, * as p from '../src'

test('string', () => {
  const foo = p.string('foo')

  expect(foo.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": false,
      "value": "expected \\"foo\\"",
    }
  `)
  expect(foo.parse('f')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": false,
      "value": "expected \\"foo\\"",
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
})

test('regex', () => {
  const int = p.regex(/\d+/)
  expect(int.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": false,
      "value": "expected /\\\\d+/",
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
      "index": 0,
      "ok": false,
      "value": "expected /\\\\d+/",
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
      "index": 0,
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)

  const foo = p.regex(/foo/i)
  expect(foo.parse('FO o')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": false,
      "value": "expected /foo/i",
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
      "index": 0,
      "ok": false,
      "value": "expected /foo/i",
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
      "index": 0,
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
})

test('Parser.filter()', () => {
  const odd = p
    .regex(/\d+/)
    .map(parseInt)
    .filter(n => n % 2 == 1, 'expected an odd integer')

  expect(odd.parse('1')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": 1,
    }
  `)

  expect(odd.parse('12')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": false,
      "value": "expected an odd integer",
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
      "index": 0,
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
})

test('Parser.filterMap()', () => {
  const odd = p
    .regex(/\d+/)
    .map(parseInt)
    .filterMap(
      n => (n % 2 == 1 ? `${n} is odd!` : null),
      'expected an odd integer',
    )

  expect(odd.parse('1')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": true,
      "value": "1 is odd!",
    }
  `)

  expect(odd.parse('12')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": false,
      "value": "expected an odd integer",
    }
  `)

  expect(odd.parse('123')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": true,
      "value": "123 is odd!",
    }
  `)

  expect(odd.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
})

test('Parser.andThen()', () => {
  const dup = P(/./).andThen(string => P(string))

  expect(dup.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": false,
      "value": "expected /./",
    }
  `)
  expect(dup.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": false,
      "value": "expected \\"a\\"",
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
      "index": 1,
      "ok": false,
      "value": "expected \\"a\\"",
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
      "index": 1,
      "ok": false,
      "value": "expected \\"a\\"",
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
      "index": 0,
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(expr.parse('1')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": false,
      "value": "expected \\"+\\"",
    }
  `)
  expect(expr.parse('1+')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": false,
      "value": "expected /\\\\d+/",
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
      "index": 0,
      "ok": false,
      "value": "expected \\"a\\"",
    }
  `)
  expect(a.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": false,
      "value": "expected \\"b\\"",
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
      "index": 0,
      "ok": false,
      "value": "expected \\"a\\"",
    }
  `)
  expect(b.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": false,
      "value": "expected \\"b\\"",
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
      "index": 0,
      "ok": false,
      "value": "expected \\"z\\"",
    }
  `)
  expect(ab.parse('z')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": false,
      "value": "expected \\"a\\"",
    }
  `)
  expect(ab.parse('za')).toMatchInlineSnapshot(`
    Object {
      "index": 2,
      "ok": false,
      "value": "expected \\"z\\"",
    }
  `)
  expect(ab.parse('zaz')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": false,
      "value": "expected \\"b\\"",
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
      "index": 0,
      "ok": false,
      "value": "expected \\"a\\" OR expected \\"b\\" OR expected /c/i",
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
      "index": 0,
      "ok": false,
      "value": "expected \\"a\\" OR expected \\"a\\"",
    }
  `)
  expect(a.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": false,
      "value": "expected \\"b\\"",
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
})

test('Parser.array()', () => {
  const abs: p.Parser<['a', 'b'][]> = P('a').then(P('b')).array()

  expect(abs.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": true,
      "value": Array [],
    }
  `)
  expect(abs.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": false,
      "value": "expected \\"b\\"",
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
      "index": 3,
      "ok": false,
      "value": "expected \\"b\\"",
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
      "index": 5,
      "ok": false,
      "value": "expected \\"b\\"",
    }
  `)

  const as: p.Parser<'a'[]> = P('a').array({ join: P(';').then(P(';')) })

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
      "index": 2,
      "ok": false,
      "value": "expected \\";\\"",
    }
  `)
  expect(as.parse('a;;')).toMatchInlineSnapshot(`
    Object {
      "index": 3,
      "ok": false,
      "value": "expected \\"a\\"",
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
      "index": 5,
      "ok": false,
      "value": "expected \\";\\"",
    }
  `)
  expect(as.parse('a;;a;;')).toMatchInlineSnapshot(`
    Object {
      "index": 6,
      "ok": false,
      "value": "expected \\"a\\"",
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
      "index": 8,
      "ok": false,
      "value": "expected \\";\\"",
    }
  `)
})

test('lazy', () => {
  const ab = P('a').then(p.lazy(() => b))
  const b = P('b')

  expect(ab.parse('')).toMatchInlineSnapshot(`
    Object {
      "index": 0,
      "ok": false,
      "value": "expected \\"a\\"",
    }
  `)
  expect(ab.parse('a')).toMatchInlineSnapshot(`
    Object {
      "index": 1,
      "ok": false,
      "value": "expected \\"b\\"",
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
      "index": 0,
      "ok": false,
      "value": "expected \\"a\\" OR expected \\"b\\" OR expected \\"d\\"",
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
      "index": 1,
      "ok": false,
      "value": "expected \\"c\\"",
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
      "index": 0,
      "ok": false,
      "value": "expected \\"a\\" OR expected \\"b\\" OR expected \\"d\\"",
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

describe('examples', () => {
  test('json', () => {
    const ys = globby.sync('node_modules/json-test-suite/test_parsing/y_*.json')
    const ns = globby.sync('node_modules/json-test-suite/test_parsing/n_*.json')

    expect(ys).toHaveLength(95)
    expect(ns).toHaveLength(188)

    for (const file of ys) {
      const input = fs.readFileSync(file, 'utf-8').trim()
      expect(Json(input)).toBeTruthy()
    }

    for (const file of ns) {
      const input = fs.readFileSync(file, 'utf-8').trim()
      // Some of these may throw an error due to stack overflow while parsing,
      // which is fine.
      let ok = true
      try {
        ok = Json(input) === null
      } catch {}
      expect(ok).toBeTruthy()
    }
  })
})

const ignore = (..._args: unknown[]) => {}
