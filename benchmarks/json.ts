import * as Benchmark from 'benchmark'

import Json from '../examples/json'
import Sample from './json.sample'

const times = +(process.argv[2] || '5')

const inputs: string[] = [Sample]

const run = (name: string, input: string, fn: () => unknown) => {
  const benchmark = new Benchmark(fn).run({ async: false })
  console.log([
    {
      name,
      'ops/s': ~~benchmark.hz,
      'mib/s': +((benchmark.hz * input.length) / 1048576).toFixed(2),
    },
  ])
}

for (const input of inputs) {
  for (let i = 0; i < times; i++) {
    run(`${input.length} bytes`, input, () => Json(input))
  }
}
