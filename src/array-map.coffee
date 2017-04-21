###*
# Implements a Array with Map features: get, set, unset, containsKey, size etc,.
#
# @author Allex Wang (allex.wxn@gmail.com)
# MIT Licensed
###

'use strict'

isArray = Array.isArray

extend = (r, args...) ->
  for s in args
    for k of s
      r[k] = s[k] if Object::hasOwnProperty.call(s, k)
  r

defprop = (obj, prop, value) ->
  Object.defineProperty obj, prop,
    enumerable: false
    configurable: false
    writable: true
    value: value

I = (o) -> o[0]
II = (o) -> o[1]

###* @constructor ###

ArrayMap = (list, options = {}) ->
  self = this
  if !(self instanceof ArrayMap)
    return new ArrayMap(list, options)

  # map primary key gernerator
  pk = options.pk
  if options.pk
    kFn = (o) -> o[pk]
  else if typeof options is 'function'
    kFn = options
    options = {}
  else
    options = options or {}
    kFn = options.keyFn
  if kFn
    defprop self, 'getKey', kFn

  # internal data struct
  defprop self, '_l', []
  defprop self, '_h', {}
  defprop self, '_k', []  # [ [k, kRef] , ... ]

  defprop self, 'length', 0

  # Enable fixed-length queue if maxSize gt 0, Defaults to 0.
  defprop self, 'maxSize', parseInt(options.maxSize, 10) or 0
  if isArray(list) and list.length > 0
    self.add list

  self

ArrayMap.from = (list, options) ->
  new ArrayMap(list, options)

# Trim the queue down to the appropriate size, removing
# items from the beginning of the internal array.

trimHead = (self) ->
  length = self.length
  limit = self.maxSize

  # Check to see if any trimming needs to be performed.
  return if limit <= 0 or length <= limit

  # Trim whatever is beyond the fixed size.
  self.splice 0, length - limit

# Trim the queue down to the appropriate size, removing
# items from the end of the internal array.

trimTail = (self) ->
  length = self.length
  limit = self.maxSize

  return if limit <= 0 or length <= limit

  # Trim whatever is beyond the fixed size.
  self.splice limit, length - limit

# simple aop impls

wrapArrayMethod = (method, before, after) ->
  ->
    fn = Array.prototype[method]
    args = arguments
    preret = undefined
    if before and (preret = before.apply(this, args)) is false
      return
    args = preret or args
    result = fn.apply(@_l, args)
    if after and after.apply(this, [ args, result ]) is false
      return
    result

module.exports = ArrayMap

__proto__ = ArrayMap.prototype

extend __proto__,

  map: wrapArrayMethod('map')

  filter: wrapArrayMethod('filter')

  splice: wrapArrayMethod('splice', null, (args, result) ->
    l = result.length
    keys = @_k
    if l > 0
      while l--
        k = @getKey(result[l])
        index = @_getKI(k)
        if index isnt -1
          delete @_h[keys[index][0]]
          keys.splice index, 1
        @length--
  )

  push: ->
    elems = arguments
    i = -1
    l = elems.length
    while ++i < l
      o = elems[i]
      @set @getKey(o), o
    @length

  _setKI: (k, o) ->
    # set key indexes
    cache = @_k
    i = @_getKI(k)
    k0 = [ String(k), o ]
    if i is -1
      cache.push k0
    else
      cache.splice i, 1, k0

  _getKI: (k) ->
    # get key indexes
    arr = @_k
    l = arr.length
    k = String(k)
    while l--
      return l if arr[l][0] is k
    -1

  getKey: (o) ->
    k = undefined
    cache = @_k or []
    isRefval = undefined
    if typeof o is 'object' and o
      k = o.id
      isRefval = true
    if !k
      i = -1
      l = cache.length
      x = undefined
      while ++i < l
        x = cache[i]
        return x[0] if x[1] is o
    if isRefval then k else String(o)

  eachKey: (fn, scope) ->
    i = 0
    keys = @_k
    len = keys.length
    while i < len
      fn.call scope, keys[i][0], keys[i], i, len
      i++
    this

  ###*
  # Get mapping keys
  # @return {Array}
  ###
  keys: -> @_k.map I

  ###*
  # Get mapping values
  # @return {Array}
  ###
  values: -> @_k.map II

  ###*
  # Implement generat string cast method.
  # @override
  ###
  toString: -> JSON.stringify @values(), null, 2

  get: (k) ->
    mk = @_h[k]
    if mk isnt undefined then mk else if typeof k is 'number' then @_l[k] else undefined

  set: (k, o) ->
    if arguments.length is 1
      o = arguments[0]
      k = @getKey(o)

    throw new TypeError('set k/v failed, the key not valid.') if !k

    @_setKI k, o

    # replace
    if @_h[k] isnt undefined
      index = @_getKI(k)
      throw new Error('Set k/v failed, the key indexes misplaced') if index is -1

      @_l[index] = o
    else
      @_l.push o
      @length++

      # Trim the queue down to the appropriate size, removing
      # items from the beginning of the internal array.
      trimHead this

    @_h[k] = o

    this

  unset: (k) ->
    v = @_h[k]
    @remove v
    v or null

  ###*
  # Returns the number of key-value mappings in this map
  #
  # @method size
  ###
  size: -> @length

  ###*
  # Returns true if this map contains a mapping for the specified key.
  #
  # @method containsKey
  ###
  containsKey: (k) -> @_h[k] isnt undefined

  add: (list) ->
    if arguments.length > 1 or isArray(list)
      args = if arguments.length > 1 then arguments else list
      i = 0
      len = args.length
      while i < len
        @set args[i]
        i++
    else
      for k of list
        if list.hasOwnProperty(k)
          @set k, list[k]
    return

  item: (index) -> @_l[index]

  indexOf: (o) -> @_l.indexOf o

  ###*
  # Iterates over elements of `collection` invoking `iteratee` for each element.
  # The iteratee is invoked with four arguments: (value, key, index, collection).
  # Iteratee functions may exit iteration early by explicitly returning `false`.
  #
  # @method each
  # @return {ArrayMap} Returns self for chains programing.
  ###
  each: (fn, scope) ->
    i = 0
    list = [].concat @_k
    len = list.length
    while i < len
      item = list[i]
      if fn.call(scope or item, item[1], item[0], i, this) is false
        break
      i++
    this

  ###
  # Array native @forEach implements.
  #
  # @method forEach
  ###
  forEach: (fn, scope) ->
    i = 0
    items = [].concat(@_l)
    len = items.length
    while i < len
      if fn.call(scope or items[i], items[i], i, items) is false
        break
      i++
    this

  find: (fn, scope) ->
    i = 0
    items = @_l
    len = items.length
    while i < len
      if fn.call scope, items[i], @_k[i]
        return items[i]
      i++
    undefined

  remove: (o) ->
    i = @indexOf(o)
    if i isnt -1 then @splice(i, 1) else false

  clone: ->
    r = new ArrayMap
    k = @_k
    list = @_l
    i = 0
    len = list.length
    while i < len
      r.set k[i], list[i]
      i++
    r.getKey = @getKey
    r

  clear: ->
    @_h = {}
    @_l = []
    @_k = []
    @length = 0
    this

__proto__.inspect =
__proto__.valueOf = __proto__.toJSON = __proto__.values
