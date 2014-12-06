/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 *
 * https://github.com/MiguelCastillo/spromise
 */


(function (root, factory) {
  if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
    // CommonJS support
    module.exports = factory();
  }
  else if (typeof define === 'function' && define.amd) {
    // Do AMD support
    define(factory);
  } else {
    // Non AMD loading
    root.spromise = factory();
  }
}(this, function () {

var define, require;
(function() {
  var root = this;
  var modules = {};

  /**
   * Load the module by calling its factory with the appropriate dependencies, if at all possible
   */
  function load(mod) {
    if (typeof(mod.factory) === "function") {
      return require(mod.deps, mod.factory);
    }
    return mod.factory;
  }

  /**
   * Resolve dependencies
   */
  function resolve(deps, _module) {
    var i, length, dep, mod, result = [];

    for (i = 0, length = deps.length; i < length; i++) {
      dep = deps[i];
      mod = modules[dep] || _module[dep];

      if (!mod) {
        throw new TypeError("Module " + dep + " has not yet been loaded");
      }

      if (modules[dep]) {
        if (!mod.hasOwnProperty("code")) {
          mod.code = load(mod);
        }
        result[i] = mod.code;
      }
      else {
        result[i] = mod;
      }
    }

    return result;
  }

  /**
   * Interface to get a dependency and resolve any unresolved dependencies.
   */
  require = function require(deps, factory) {
    var name, result, _module = {}, _exports = {};
    _module.require = require;
    _module.exports = _exports;
    _module.module  = {exports: _exports};

    if (typeof(deps) === "string") {
      name = deps;
      deps = [deps];
    }

    // Resolve all dependencies
    if (deps.length) {
      deps = resolve(deps.slice(0), _module);
    }

    if (typeof(factory) !== "function") {
      return name ? modules[name].code : factory;
    }

    result = factory.apply(root, deps);
    return result === (void 0) ? _module.module.exports : result;
  };

  /**
   * Interface to register a module.  Only names defines can be used.
   */
  define = function define(name, deps, factory) {
    modules[name] = {
      name: name,
      deps: deps,
      factory: factory
    };
  };

}).call(this);

define("src/samdy", function(){});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

var root = this;
define('src/async',['require','exports','module'],function(require, exports, module) {
  

  var _self = root;
  var nextTick;

  /**
   * Find the prefered method for queue callbacks in the event loop
   */
  if (_self.setImmediate) {
    nextTick = _self.setImmediate;
  }
  else if (_self.process && typeof(_self.process.nextTick) === "function") {
    nextTick = _self.process.nextTick;
  }
  else {
    nextTick = function(cb) {
      _self.setTimeout(cb, 0);
    };
  }

  function Async(cb) {
    nextTick(cb);
  }

  /**
   */
  Async.delay = function(callback, timeout, args) {
    _self.setTimeout(callback.apply.bind(callback, this, args || []), timeout);
  };

  module.exports = Async;
});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

define('src/promise',['require','exports','module','src/async'],function(require, exports, module) {
  

  var Async = require("src/async");

  var states = {
    "pending":  0,
    "always":   1,
    "resolved": 2,
    "rejected": 3,
    "notify":   4
  };

  var strStates = [
    "pending",
    "",
    "resolved",
    "rejected",
    ""
  ];


  /**
   * Small Promise
   */
  function Promise(resolver, stateManager) {
    if (this instanceof(Promise) === false) {
      return new Promise(resolver, stateManager);
    }

    var target = this;

    if (stateManager instanceof(StateManager) === false) {
      stateManager = new StateManager();
    }

    target.then = function then(onResolved, onRejected) {
      return stateManager.then(onResolved, onRejected);
    };

    target.resolve = function resolve() {
      stateManager.transition(states.resolved, this, arguments);
      return target;
    };

    target.reject = function reject() {
      stateManager.transition(states.rejected, this, arguments);
      return target;
    };

    // Read only access point for the promise.
    target.promise = {
      then:   target.then,
      always: target.always,
      done:   target.done,
      catch:  target.fail,
      fail:   target.fail,
      notify: target.notify,
      state:  target.state
    };

    // Make sure we have a proper promise reference
    target.promise.promise = target.promise;

    // Tuck away the state manager to allow fast promise resolutions and quick way to
    // check if the promise is an instance of spromise.
    target.then.constructor  = Promise;
    target.then.stateManager = stateManager;

    // Interface to allow to post pone calling the resolver as long as its not needed
    if (typeof(resolver) === "function") {
      resolver.call(target, target.resolve, target.reject);
    }
  }

  Promise.prototype.delay = function delay(ms) {
    var _self = this;
    return new Promise(function(resolve, reject) {
      _self.then(function() {
        Async.delay(resolve.bind(this), ms, arguments);
      }, reject.bind(this));
    });
  };

  Promise.prototype.always = function always(cb) {
    this.then.stateManager.enqueue(states.always, cb);
    return this.promise;
  };

  Promise.prototype.done = function done(cb) {
    this.then.stateManager.enqueue(states.resolved, cb);
    return this.promise;
  };

  Promise.prototype.fail = Promise.prototype.catch = function fail(cb) {
    this.then.stateManager.enqueue(states.rejected, cb);
    return this.promise;
  };

  Promise.prototype.notify = function notify(cb) {
    this.then.stateManager.enqueue(states.notify, cb);
    return this.promise;
  };

  Promise.prototype.state = function state() {
    return strStates[this.then.stateManager.state];
  };

  Promise.prototype.isPending = function isPending() {
    return this.then.stateManager.state === states.pending;
  };

  Promise.prototype.isResolved = function isResolved() {
    return this.then.stateManager.state === states.resolved;
  };

  Promise.prototype.isRejected = function isRejected() {
    return this.then.stateManager.state === states.resolved;
  };


  /**
   * Interface to play nice with libraries like when and q.
   */
  Promise.defer = function () {
    return new Promise();
  };


  /**
   * Create a promise that's already rejected
   *
   * @returns {Promise} A promise that is alraedy rejected with the input value
   */
  Promise.reject = function () {
    return new Promise(null, new StateManager({
      context: this,
      value: arguments,
      state: states.rejected
    }));
  };


  /**
   * Interface that makes sure a promise is returned, regardless of the input.
   * 1. If the input is a promsie, then that's immediately returned.
   * 2. If the input is a thenable (has a then method), then a new promise is returned
   *    that's chained to the input thenable.
   * 3. If the input is any other value, then a new promise is returned and resolved with
   *    the input value
   *
   * @returns {Promise}
   */
  Promise.resolve = Promise.thenable = function (value) {
    if (value) {
      if (value instanceof(Promise) === true) {
        return value;
      }
      else if (typeof(value.then) === "function") {
        return new Promise(value.then);
      }
    }

    return new Promise(null, new StateManager({
      context: this,
      value: arguments,
      state: states.resolved
    }));
  };


  /**
   * Creates a promise that's resolved after ms number of milleseconds. All arguments passed
   * in to delay, with the excpetion of ms, will be used to resolve the new promise with.
   *
   * @param {number} ms - Number of milliseconds to wait before the promise is resolved.
   */
  Promise.delay = function delay(ms) {
    var args = Array.prototype.slice(arguments, 1);
    return new Promise(function(resolve) {
      Async.delay(resolve.bind(this), ms, args);
    });
  };


  /**
   * Provides a set of interfaces to manage callback queues and the resolution state
   * of the promises.
   */
  function StateManager(options) {
    // Initial state is pending
    this.state = states.pending;

    // If a state is passed in, then we go ahead and initialize the state manager with it
    if (options && options.state) {
      this.transition(options.state, options.context, options.value);
    }
  }


  /**
   * Figure out if the promise is pending/resolved/rejected and do the appropriate action
   * with the callback based on that.
   */
  StateManager.prototype.enqueue = function (state, cb, sync) {
    var _self = this;
    var _state = this.state;

    if (!_state) {
      (this.queue || (this.queue = [])).push({
        state: state,
        cb: cb
      });
    }

    // If not pending, then lets execute the callback
    else if (_state === state || states.always === state) {
      if (sync) {
        cb.apply(_self.context, _self.value);
      }
      else {
        Async(function() {cb.apply(_self.context, _self.value);});
      }
    }

    // Do proper notify events
    else if (states.notify === state) {
      if (sync) {
        cb.call(_self.context, _self.state, _self.value);
      }
      else {
        Async(function() {cb.call(_self.context, _self.state, _self.value);});
      }
    }
  };


  /**
   * Transitions the state of the promise from pending to either resolved or
   * rejected.  If the promise has already been resolved or rejected, then
   * this is a noop.
   */
  StateManager.prototype.transition = function (state, context, value, sync) {
    if (this.state) {
      return;
    }

    this.state   = state;
    this.context = context;
    this.value   = value;

    // Process queue if anything is waiting to be notified
    if (this.queue) {
      var queue  = this.queue;
      var length = queue.length;
      var i      = 0;
      var item;

      this.queue = null;

      while (i < length) {
        item = queue[i++];
        this.enqueue(item.state, item.cb, sync);
      }
    }
  };


  StateManager.prototype.then = function(onResolved, onRejected) {
    // Make sure onResolved and onRejected are functions or null otherwise
    onResolved = typeof(onResolved) === "function" ? onResolved : null;
    onRejected = typeof(onRejected) === "function" ? onRejected : null;

    // Shortcut:
    // If there are no onResolved or onRejected callbacks and the promise
    // is already resolved, we just return a new promise and copy the state
    if ((!onResolved && this.state === states.resolved) ||
        (!onRejected && this.state === states.rejected)) {
      return new Promise(null, this);
    }

    // Hand off between p1 and resolution logic for p2
    var resolution = new Resolution(new Promise());

    if (onResolved || onRejected) {
      this.enqueue(states.notify, resolution.resolve(onResolved, onRejected));
    }
    else {
      this.enqueue(states.notify, resolution.notify());
    }

    return resolution.promise;
  };


  /**
   * Thenable resolution
   */
  function Resolution(promise) {
    this.promise = promise;
  }


  /**
   * Resolve is used when an onResolved/onRejected callbacks are provided, which
   * need to be called with the the value of the promise once it is resolved.
   */
  Resolution.prototype.resolve = function(onResolved, onRejected) {
    var resolution = this;
    return function resolve(state, value) {
      var handler = (state === states.resolved) ? (onResolved || onRejected) : (onRejected || onResolved);

      try {
        // Try catch in case calling the handler throws an exception
        resolution.finalize(state, this, [handler.apply(this, value)]);
      }
      catch(ex) {
        resolution.promise.reject.call(this, ex);
      }
    };
  };


  /**
   * Notify is used when adopting the state of a promise
   */
  Resolution.prototype.notify = function() {
    var resolution = this;
    return function notify(state, value) {
      resolution.finalize(state, this, value);
    };
  };


  /**
   * Chain DRYs resolvePromise and rejectPromise.
   * This chain is used when interoperating with in other promise implementations
   */
  Resolution.prototype.chain = function(state) {
    var resolution = this;
    return function chain() {
      if (!resolution.resolved) {
        resolution.resolved = true;
        resolution.finalize(state, this, arguments);
      }
    };
  };


  /**
   * Conveniece try/catch wrapper for the resolution finalizing step
   */
  Resolution.prototype.finalize = function(state, context, value) {
    try {
      this._finalize(state, context, value);
    }
    catch (ex) {
      this.promise.reject.call(context, ex);
    }
  };


  /**
   * Promise resolution procedure
   *
   * @param {states} state - Is the state of the promise resolution (resolved/rejected)
   * @param {context} context - Is that context used when calling resolved/rejected
   * @param {array} data - Is value of the resolved promise
   */
  Resolution.prototype._finalize = function (state, context, data) {
    var promise = this.promise;
    var input   = data[0];
    var then    = input && input.then;
    var thenType, resolution;

    // 2.3.1 https://promisesaplus.com/#point-48
    if (input === promise) {
      throw new TypeError("Resolution input must not be the promise being resolved");
    }

    // 2.3.2 https://promisesaplus.com/#point-49
    // if the incoming promise is an instance of spromise, we adopt its state
    if (then && then.constructor === Promise) {
      then.stateManager.enqueue(states.notify, this.notify(), true);
      return;
    }

    // 2.3.3 https://promisesaplus.com/#point-53
    // If thenable is function or object, then try to resolve using that.
    thenType = then && typeof(then) === "function" && typeof(input);
    if (thenType === "function" || thenType === "object") {
      try {
        resolution = new Resolution(promise);
        then.call(input, resolution.chain(states.resolved), resolution.chain(states.rejected));
      }
      catch (ex) {
        if (!resolution.resolved) {
          promise.reject.call(context, ex);
        }
      }
    }

    // 2.3.4
    // Just resolve the promise
    else {
      promise.then.stateManager.transition(state, context, data, true);
    }
  };


  // Expose enums for the states
  Promise.states = states;
  module.exports = Promise;
});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

define('src/all',['require','exports','module','src/promise','src/async'],function(require, exports, module) {
  

  var Promise = require("src/promise"),
      Async   = require("src/async");

  function _result(input, args, context) {
    if (typeof(input) === "function") {
      return input.apply(context, args||[]);
    }
    return input;
  }

  function All(values) {
    values = values || [];

    // The input is the queue of items that need to be resolved.
    var resolutions = [],
        promise     = Promise.defer(),
        context     = this,
        remaining   = values.length;

    if (!values.length) {
      return promise.resolve(values);
    }

    // Check everytime a new resolved promise occurs if we are done processing all
    // the dependent promises.  If they are all done, then resolve the when promise
    function checkPending() {
      remaining--;
      if (!remaining) {
        promise.resolve.call(context, resolutions);
      }
    }

    // Wrap the resolution to keep track of the proper index in the closure
    function resolve(index) {
      return function() {
        resolutions[index] = arguments.length === 1 ? arguments[0] : arguments;
        checkPending();
      };
    }

    function processQueue() {
      var i, item, length;
      for (i = 0, length = remaining; i < length; i++) {
        item = values[i];
        if (item && typeof item.then === "function") {
          item.then(resolve(i), promise.reject);
        }
        else {
          resolutions[i] = _result(item);
          checkPending();
        }
      }
    }

    // Process the promises and callbacks
    Async(processQueue);
    return promise;
  }

  module.exports = All;
});


/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

define('src/when',['require','exports','module','src/promise','src/all'],function(require, exports, module) {
  

  var Promise = require("src/promise"),
      All     = require("src/all");

  /**
   * Interface to allow multiple promises to be synchronized
   */
  function When() {
    var context = this, args = arguments;
    return new Promise(function(resolve, reject) {
      All.call(context, args).then(function(results) {
        resolve.apply(context, results);
      },
      function(reason) {
        reject.call(context, reason);
      });
    });
  }

  module.exports = When;
});


/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

define('src/race',['require','exports','module','src/promise'],function(require, exports, module) {
  

  var Promise = require("src/promise");

  function Race(iterable) {
    if (!iterable) {
      return Promise.resolve();
    }

    return new Promise(function(resolve, reject) {
      var i, length, _done = false;
      for (i = 0, length = iterable.length; i < length; i++) {
        iterable[i].then(_resolve, _reject);
      }

      function _resolve() {
        if (!_done) {
          _done = true;
          resolve.apply(this, arguments);
        }
      }

      function _reject() {
        if (!_done) {
          _done = true;
          reject.apply(this, arguments);
        }
      }
    });
  }

  module.exports = Race;
});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

define('src/spromise',['require','exports','module','src/promise','src/async','src/when','src/all','src/race'],function(require, exports, module) {
  

  var Promise  = require("src/promise");
  Promise.aync = require("src/async");
  Promise.when = require("src/when");
  Promise.all  = require("src/all");
  Promise.race = require("src/race");

  module.exports = Promise;
});

  return require("src/spromise");
}));
