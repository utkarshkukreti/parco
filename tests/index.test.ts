import * as p from '../src'

test('string', () => {
  const foo = p.string('foo')

  expect(foo.parse('')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": false,
      "value": "expected \\"foo\\"",
    }
  `)
  expect(foo.parse('f')).toMatchInlineSnapshot(`
    Object {
      "input": "f",
      "ok": false,
      "value": "expected \\"foo\\"",
    }
  `)
  expect(foo.parse('foo')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": true,
      "value": "foo",
    }
  `)
  expect(foo.parse('foo bar')).toMatchInlineSnapshot(`
    Object {
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
      "input": "",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(int.parse('1')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": true,
      "value": "1",
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": true,
      "value": "123",
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    Object {
      "input": " 123",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(int.parse('123 456')).toMatchInlineSnapshot(`
    Object {
      "input": " 456",
      "ok": true,
      "value": "123",
    }
  `)
  expect(int.parse('abc')).toMatchInlineSnapshot(`
    Object {
      "input": "abc",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)

  const foo = p.regex(/foo/i)
  expect(foo.parse('FO o')).toMatchInlineSnapshot(`
    Object {
      "input": "FO o",
      "ok": false,
      "value": "expected /foo/i",
    }
  `)
  expect(foo.parse('FOo bar')).toMatchInlineSnapshot(`
    Object {
      "input": " bar",
      "ok": true,
      "value": "FOo",
    }
  `)
  expect(foo.parse('a FOo bar')).toMatchInlineSnapshot(`
    Object {
      "input": "a FOo bar",
      "ok": false,
      "value": "expected /foo/i",
    }
  `)
})

test('Parser.map()', () => {
  const int = p.regex(/\d+/).map(parseInt)

  expect(int.parse('1')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": true,
      "value": 1,
    }
  `)
  expect(int.parse('123')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": true,
      "value": 123,
    }
  `)
  expect(int.parse(' 123')).toMatchInlineSnapshot(`
    Object {
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
      "input": "",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(expr.parse('1')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": false,
      "value": "expected \\"+\\"",
    }
  `)
  expect(expr.parse('1+')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": false,
      "value": "expected /\\\\d+/",
    }
  `)
  expect(expr.parse('1+23')).toMatchInlineSnapshot(`
    Object {
      "input": "",
      "ok": true,
      "value": 24,
    }
  `)
  expect(expr.parse('1+23+')).toMatchInlineSnapshot(`
    Object {
      "input": "+",
      "ok": true,
      "value": 24,
    }
  `)
  expect(expr.parse('1+23+456')).toMatchInlineSnapshot(`
    Object {
      "input": "+456",
      "ok": true,
      "value": 24,
    }
  `)
})
