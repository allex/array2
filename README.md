array2
======

Implements a Array with Map features: get, set, unset, containsKey, size etc,.

Author: Allex Wang (allex.wxn@gmail.com)

MIT Licensed

## Install

```sh
npm install array2
```

## Usage

```js
var ArrayMap = require("array2").ArrayMap

var arr = new ArrayMap()
arr.push.apply(arr, [1, 2, 3])
console.log('.clear().size() =>', arr.clear().size())
arr.set('6', 300)
arr.set('2', 3000)
arr.set('300', 3)
arr.remove(4)
arr.push.apply(arr, ['20', 30, 40, 50])

console.log('[6] =>', arr.get('6'))
console.log(':8 =>', arr.get(8))
console.log('keys =>', arr.keys())
console.log('values =>', arr.values())

console.log('===== test ArrayMap with a custom primary key ====');

var arr2 = new ArrayMap([
    {id: 1, v: 100},
    {id: 1, v: 10000},
    {id: 2, v: 200},
    {id: 3, v: 300},
    {id: 4, v: 400},
    {id: 5, v: 500},
    {id: 6, v: 600},
    {id: 7, v: 700},
], o => o.id)

arr2.forEach((v, i) => console.log(i, '=>', v))

console.log('splice(2, 3) =>', arr2.splice(2, 3))
console.log('arr2.map()', arr2.map((o, i) => o.v))
console.log('keys =>', arr2.keys())
console.log('values =>', arr2.values())
console.log('unset(7)')
arr2.unset(7)
console.log('containsKey(7) =>', arr2.containsKey(7));

console.log('===== test ArrayMap with a fixed length ====');

var arr3 = new ArrayMap([1, 2, 3, 4], {maxSize: 3})
console.log('keys =>', arr2.keys()) // => 2, 3, 4

arr3.set('foo', 'foo_value');
console.log('values=>', arr2.values()) // 3, 4, foo_value
```

