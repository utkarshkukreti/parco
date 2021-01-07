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
