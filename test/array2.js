var test = require('tap').test
  , ArrayMap = require('../').ArrayMap

test('ArrayMap: push(), splice(), remove()', t => {
  var arr = new ArrayMap

  arr.push('foo');
  arr.push.apply(arr, ['test', 'bar']);

  arr.splice(0, 2); // remove foo, test => bar

  // add multiple elements
  arr.add([3, 4]);
  // => 'bar', 3, 4

  t.equal(arr.size(), 3);

  arr.remove('bar')
  t.same(arr.values(), [3, 4])

  // add k/v mapping
  arr.add({k1: 'v1', k2: 'v2'});
  t.same(arr.values(), [3, 4, 'v1', 'v2'])

  t.end();
});

test('ArrayMap: set(), unset(), containsKey()', t => {
  var arr = new ArrayMap([
    1,
    2
  ])

  arr.unset('2') // remove 2
  t.equal(arr.get('2'), undefined);

  var obj = {foo: 1, id: 2}
  arr.set('obj', obj)

  t.equal(arr.size(), 2)
  t.equal(arr.item(1), obj)
  t.equal(arr.containsKey('obj'), true)
  t.equal(arr.containsKey('obj1'), false)

  t.end();
})

test('ArrayMap: keys(), values()', t => {
  var list = [
    {id: 1, v: 10},
    {id: 2, v: 20},
    {id: 3, v: 30}
  ];

  var arr = new ArrayMap(list, o => o.id)

  t.same(arr.keys(), ['1', '2', '3'])
  t.same(arr.values(), list)
  t.equal(arr.values()[0], list[0]) // refs

  t.end()
})

test('ArrayMap: find()', t => {
  var arr = new ArrayMap([1, 2, 3, 4, 5])

  var v = arr.find((v, k) => v > 3)
  t.equal(v, 4)

  t.end()
});

test('ArrayMap: options.maxSize', t => {
  var MAX_SIZE = 3;
  var arr = new ArrayMap([1, 2, 3, 4, 5], { maxSize: MAX_SIZE })

  t.same(arr.values(), [3, 4, 5]);
  t.equal(arr.size(), MAX_SIZE);

  // add new element
  arr.set('last', 'LAST_VALUE');
  t.equal(arr.item(arr.length - 1), 'LAST_VALUE');
  t.equal(arr.size(), MAX_SIZE);

  t.end()
});
