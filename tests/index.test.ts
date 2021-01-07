import P, * as p from '../src'

test('string', () => {
  const foo = p.string('foo')

  expect(foo.parse('')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": "",
      "ok": false,
      "value": "expected \\"foo\\"",
    }
  `)
  expect(foo.parse('f')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": "f",
      "ok": false,
      "value": "expected \\"foo\\"",
    }
  `)
  expect(foo.parse('foo')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": "foo",
    }
  `)
  expect(foo.parse('foo bar')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": " bar",
      "ok": true,
      "value": "foo",
    }
  `)
})

test('regex', () => {
  const int = p.regex(/\d+/)
  expect(int.parse('')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": "",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(int.parse('1')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": "1",
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": "123",
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": " 123",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(int.parse('123 456')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": " 456",
      "ok": true,
      "value": "123",
    }
  `)
  expect(int.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": "abc",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)

  const foo = p.regex(/foo/i)
  expect(foo.parse('FO o')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": "FO o",
      "ok": false,
      "value": "expected /foo/i",
    }
  `)
  expect(foo.parse('FOo bar')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": " bar",
      "ok": true,
      "value": "FOo",
    }
  `)
  expect(foo.parse('a FOo bar')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": "a FOo bar",
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
  try {
    // @ts-expect-error
    P(123)
  } catch {}
  ignore(foo, bar, baz, baz2)
})

test('Parser.map()', () => {
  const int = p.regex(/\d+/).map(parseInt)

  expect(int.parse('1')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": 1,
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": 123,
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": " 123",
      "ok": false,
      "value": "expected /\\\\d+/",
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
      "consumed": false,
      "input": "",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(expr.parse('1')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": false,
      "value": "expected \\"+\\"",
    }
  `)
  expect(expr.parse('1+')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(expr.parse('1+23')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": 24,
    }
  `)
  expect(expr.parse('1+23+')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "+",
      "ok": true,
      "value": 24,
    }
  `)
  expect(expr.parse('1+23+456')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "+456",
      "ok": true,
      "value": 24,
    }
  `)
})

test('Parser.or()', () => {
  const abc = P<string>('a').or(P('b')).or(P(/c/i))

  expect(abc.parse('')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": "",
      "ok": false,
      "value": "expected \\"a\\" OR expected \\"b\\" OR expected /c/i",
    }
  `)
  expect(abc.parse('a')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": "a",
    }
  `)
  expect(abc.parse('b')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": "b",
    }
  `)
  expect(abc.parse('c')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": "c",
    }
  `)
  expect(abc.parse('C')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": "C",
    }
  `)
  expect(abc.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "b",
      "ok": true,
      "value": "a",
    }
  `)
  expect(abc.parse('Ca')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "a",
      "ok": true,
      "value": "C",
    }
  `)

  const a = P(
    P('a')
      .then(P('b'))
      .map(([a, b]) => a + b),
  ).or(P('a'))

  expect(a.parse('')).toMatchInlineSnapshot(`
    Object {
      "consumed": false,
      "input": "",
      "ok": false,
      "value": "expected \\"a\\" OR expected \\"a\\"",
    }
  `)
  expect(a.parse('a')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": false,
      "value": "expected \\"b\\"",
    }
  `)
  expect(a.parse('ab')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "",
      "ok": true,
      "value": "ab",
    }
  `)
  expect(a.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "consumed": true,
      "input": "c",
      "ok": true,
      "value": "ab",
    }
  `)
})

const ignore = (..._args: unknown[]) => {}
