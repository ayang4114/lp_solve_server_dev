const assert = require('assert')

function flatten(array) {
  let result = []
  for (let a of array) {
    if (Array.isArray(a)) {
      let flattened = flatten(a)
      result = result.concat(flattened)
    } else {
      result.push(a)
    }
  }
  return result
}


const test_cases = [
  'for i = 1 to 6: 12_xi + 5_yi <= 123',
  'for t = 1 to 5: 3x_t + 2t >= 78',
  'for i = 1 to 5: for t = 2 to 4: x_it - y_it <= 0',
  'for i = 1 to 6:\n12x_i + 5y_i <= 123',
  'for\nt\n=\n1\nto\n5:\n3x_t + 2t >= 78',
  'for i=1 to 5  \n:\nfor t = \n2 to 4: x_it\n - \ny_it <= 0',
  'for i=1 to 5, t = \n1 to 4: for c = 1 to 5: x_itc\n - \ny_itc <= 0'
]

const small_test = test_cases[6]
// for (let s of test_cases) {
//   assert.strictEqual(regex.test(s), true)
// }

function parseForStatement(line, name) {
  const index = line.indexOf(':')
  const for_statement = line.slice(0, index)
  // Get the assignment variable, and get the range of that variable.
  // Based on the previous regex test, there are at most and at least 2 numbers.

  // Match numbers
  const numbers = for_statement.match(/\d+/g)
  // The only word besides for is the assignment variable and 'to':
  // Slice 1 to ignore the first term.
  const variables = for_statement.match(/[a-zA-Z]+/g).slice(1).filter(x => x !== 'to')
  let env = []
  for (let i = 0; i < variables.length; i++) {
    const first = numbers[i * 2]
    const second = numbers[i * 2 + 1]
    env.push({
      name: variables[i],
      start: parseInt(first),
      end: parseInt(second),
      current: parseInt(first)
    })
  }
  function loop(arr, func, init) {
    function helper(arr, func, init, arr2) {
      if (arr.length === 0)
        return func(init, arr2)
      while (arr[0].current <= arr[0].end) {
        init = helper(arr.slice(1), func, init, arr2)
        arr[0].current++
      }
      arr[0].current = arr[0].start
      return init
    }
    return helper(arr, func, init, arr)
  }

  const subscript_regex = /_\w+/g
  const constraints = loop(env, function (value, vars) {
    let expr = line.slice(index + 1).trim()
    const subscripts = expr.match(subscript_regex)
    const subscripts_transformed = subscripts.map(x => {
      for (let v of vars)
        x = x.replace(v.name, v.current)
      return x
    })
    for (let i = 0; i < subscripts.length; i++) {
      expr = expr.replace(subscripts[i], subscripts_transformed[i])
    }
    value.push(eval(expr))
    return value
  }, [])
  return flatten(constraints)
}

function eval(line, name) {
  let constraints = []
  const regex = /^for\s+[a-zA-Z]+\s*=\s*\d+\s+to\s+\d+\s*(\s*\,\s*[a-zA-Z]+\s*=\s*\d+\s+to\s+\d+)*\s*:/
  if (regex.test(line)) {
    constraints = parseForStatement(line, name)
  } else {
    return line
  }
  return constraints
}

const result = eval(small_test, '24')
console.log(result.length === 100)