import { Bench } from 'tinybench'

import Json from '../examples/json'
import Sample from './json.sample'

const inputs: string[] = [Sample]

const bench = new Bench({ time: 5000 })

for (const input of inputs) {
  bench.add(`${input.length} bytes`, () => Json(input))
}

await bench.warmup()

await bench.run()

console.table(bench.table())
