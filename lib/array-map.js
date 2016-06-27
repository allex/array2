/**
 * Implements a Array with Map features: get, set, unset, containsKey, size etc,.
 *
 * @author Allex Wang (allex.wxn@gmail.com)
 * MIT Licensed
 */

var util = require('util')
  , EE = require('events').EventEmitter
  , isArray = Array.isArray

exports.ArrayMap = ArrayMap;

function defProp(obj, prop, value) {
  Object.defineProperty(obj, prop, {
    enumerable: false,
    configurable: false,
    writable: true,
    value: value
  })
}

function I(o) { return o[0] }
function II(o) { return o[1] }

// simple aop impls
function wrapArrayMethod(method, before, after) {
  var wrapper = function() {
    var fn = Array.prototype[method], args = arguments, preret
    if (before && (preret = before.apply(this, args)) === false) {
      return;
    }
    args = preret || args
    var result = fn.apply(this._q, args);
    if (after && after.apply(this, [args, result]) === false) {
      return;
    }
    return result;
  }
  return wrapper;
}


/** @constructor */
function ArrayMap(list, options) {

  if (!(this instanceof ArrayMap)) {
    return new ArrayMap(list, options);
  }

  EE.call(this);

  var kFn;
  if (typeof options === 'function') {
    kFn = options;
    options = {};
  } else {
    options = options || {};
    kFn = options.keyFn;
  }

  defProp(this, '_q', []);
  defProp(this, '_dic', {});
  defProp(this, '_keys', []);

  this.length = 0;

  if (kFn) {
    this.getKey = kFn;
  }

  if (isArray(list) && list.length > 0) {
    this.add(list);
  }
}

util.inherits(ArrayMap, EE);

util._extend(ArrayMap.prototype, {

  map: wrapArrayMethod('map'),

  filter: wrapArrayMethod('filter'),

  splice: wrapArrayMethod('splice',
    null,
    function(args, result) {
      var l = result.length, keys = this._keys
      if (l > 0) {
        while (l--) {
          var k = this.getKey(result[l]), index = this._getKI(k);
          if (index !== -1) {
            delete this._dic[keys[index][0]];
            keys.splice(index, 1);
          }
          this.length--;
        }
      }
    }),

  push: function() {
    for (var elems = arguments, i = -1, l = elems.length, k; ++i < l; ) {
      o = elems[i]
      this.set(this.getKey(o), o);
    }
    return this.length
  },

  _setKI: function(k, o) {
    // set key indexes
    var cache = this._keys, i = this._getKI(k), k0 = [ String(k), o ]
    if (i === -1) {
      cache.push(k0);
    } else {
      cache.splice(i, 1, k0);
    }
  },

  _getKI: function(k) {
    // get key indexes
    var arr = this._keys, l = arr.length;
    k = String(k);
    while (l--) {
      if (arr[l][0] === k) return l;
    }
    return -1;
  },

  getKey: function(o) {
    var k, cache = this._keys || [], isRefval
    if (typeof o === 'object' && o) {
      k = o.id
      isRefval = true
    }
    if (!k) {
      for (var i = -1, l = cache.length, x; ++i < l; ) {
        x = cache[i]
        if (x[1] === o) return x[0];
      }
    }
    return isRefval ? k : String(o)
  },

  eachKey: function(fn, scope) {
    for (var i = 0, len = this._keys.length; i < len; i++) {
      fn.call(scope, this._keys[i][0], this._q[i], i, len);
    }
    return this
  },

  /**
   * Get mapping keys
   * @return {Array}
   */
  keys: function() {
    return this._keys.map(I)
  },

  /**
   * Get mapping values
   * @return {Array}
   */
  values: function() {
    return this._keys.map(II)
  },

  set: function(k, o) {
    if (arguments.length == 1) {
      o = arguments[0];
      k = this.getKey(o);
    }
    if (!k) {
      throw new TypeError('set k/v failed, the key not valid.')
    }
    this._setKI(k, o);
    // replace
    if (this._dic[k] !== undefined) {
      var index = this._getKI(k);
      if (index === -1) {
        throw new Error('Set k/v failed, the key indexes misplaced')
      }
      this._q[index] = o;
    } else {
      this._q.push(o);
      this.length++;
    }
    this._dic[k] = o;
    return this;
  },

  get: function(k) {
    var mk = this._dic[k]
      , item = mk !== undefined ? mk : typeof k == 'number' ? this._q[k] : undefined;
    return item;
  },

  /**
   * Removes the mapping for a key from this map if it is present (optional operation)
   *
   * Returns the value to which this map previously associated the key, or null if
   * the map contained no mapping for the key.
   */
  unset: function(k) {
    var v = this._dic[k];
    this.remove(v)
    return v || null;
  },

  /**
   * Returns the number of key-value mappings in this map
   *
   * @method size
   */
  size: function() {
    return this.length;
  },

  /**
   * Returns true if this map contains a mapping for the specified key.
   *
   * @method containsKey
   */
  containsKey: function(k) {
    return this._dic[k] !== undefined;
  },

  add: function(list) {
    if (arguments.length > 1 || isArray(list)) {
      var args = arguments.length > 1 ? arguments : list;
      for (var i = 0, len = args.length; i < len; i++) {
        this.set(args[i]);
      }
    } else {
      for (var k in list) {
        this.set(k, objs[k]);
      }
    }
  },

  item: function(index) {
    return this._q[index];
  },

  indexOf: function(o) {
    return this._q.indexOf(o);
  },

  forEach: function(fn, scope) {
    for (var i = 0, items = [].concat(this._q), len = items.length; i < len; i++) {
      if (fn.call(scope || items[i], items[i], i, items) === false) break;
    }
    return this
  },

  find: function(fn, scope) {
    for (var i = 0, items = this._q, len = items.length; i < len; i++) {
      if (fn.call(scope, items[i], this._keys[i])) {
        return items[i];
      }
    }
    return null;
  },

  remove: function(o) {
    var i = this.indexOf(o);
    return i !== -1 ? this.splice(i, 1) : false
  },

  clone: function() {
    var r = new ArrayMap();
    var k = this._keys, it = this._q;
    for (var i = 0, len = it.length; i < len; i++) {
      r.set(k[i], it[i]);
    }
    r.getKey = this.getKey;
    return r;
  },

  clear: function() {
    this.length = 0;
    this._dic = {};
    this._q = [];
    this._keys = [];
    return this;
  }

});

