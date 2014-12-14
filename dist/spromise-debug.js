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

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

var define, require;
(function() {
  var root = this,
      cache = {};

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
  function resolve(deps, rem) {
    var i, length, dep, mod, result = [];

    for (i = 0, length = deps.length; i < length; i++) {
      dep = deps[i];
      mod = cache[dep] || rem[dep];

      if (!mod) {
        throw new TypeError("Module " + dep + " has not yet been loaded");
      }

      if (cache[dep]) {
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
   * Interface to retrieve a module and resolve any unresolved dependencies.
   */
  require = function require(deps, factory) {
    var name, result, rem = {};
    rem.require = require;
    rem.exports = {};
    rem.module  = {exports: rem.exports};

    if (typeof(deps) === "string") {
      name = deps;
      deps = [deps];
    }

    if (deps.length) {
      deps = resolve(deps.slice(0), rem);
    }

    if (typeof(factory) === "function") {
      result = factory.apply(root, deps);
    }
    else {
      result = cache[name] ? cache[name].code : factory;
    }

    return result === (void 0) ? rem.module.exports : result;
  };

  /**
   * Interface to register a module.  Only named module can be registered.
   */
  define = function define(name, deps, factory) {
    cache[name] = {
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
  

  var async = require("src/async");

  var states = {
    "pending"  : 0,
    "resolved" : 1,
    "rejected" : 2,
    "always"   : 3,
    "notify"   : 4
  };

  var strStates = [
    "pending",
    "resolved",
    "rejected"
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

    target.then = function(onResolved, onRejected) {
      return stateManager.then(onResolved, onRejected);
    };

    target.resolve = function() {
      stateManager.transition(states.resolved, arguments, this);
      return target;
    };

    target.reject = function() {
      stateManager.transition(states.rejected, arguments, this);
      return target;
    };

    target.done = function(cb) {
      stateManager.enqueue(states.resolved, cb);
      return target.promise;
    };

    target.catch = target.fail = function(cb) {
      stateManager.enqueue(states.rejected, cb);
      return target.promise;
    };

    target.finally = target.always = function(cb) {
      stateManager.enqueue(states.always, cb);
      return target.promise;
    };

    target.notify = function(cb, sync) {
      stateManager.enqueue(states.notify, cb, sync);
      return target.promise;
    };

    target.state = function() {
      return strStates[stateManager.state];
    };

    target.isPending = function() {
      return stateManager.state === states.pending;
    };

    target.isResolved = function() {
      return stateManager.state === states.resolved;
    };

    target.isRejected = function() {
      return stateManager.state === states.resolved;
    };

    // Read only access point for the promise.
    target.promise = {
      then   : target.then,
      always : target.always,
      done   : target.done,
      catch  : target.fail,
      fail   : target.fail,
      notify : target.notify,
      state  : target.state
    };

    // Make sure we have a proper promise reference
    target.promise.promise = target.promise;

    // Quick way to check if an instance of a promise is spromise.
    target.then.constructor = Promise;

    // Interface to allow to post pone calling the resolver as long as its not needed
    if (typeof(resolver) === "function") {
      resolver.call(target, target.resolve, target.reject);
    }
  }


  Promise.prototype.delay = function delay(ms) {
    var _self = this;
    return new Promise(function(resolve, reject) {
      _self.then(function() {
        async.delay(resolve.bind(this), ms, arguments);
      }, reject.bind(this));
    });
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
      async.delay(resolve.bind(this), ms, args);
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
      this.transition(options.state, options.value, options.context);
    }
  }


  /**
   * Figure out if the promise is pending/resolved/rejected and do the appropriate action
   * with the callback based on that.
   */
  StateManager.prototype.enqueue = function (state, cb, sync) {
    var _self  = this,
        _state = this.state;

    if (!_state) {
      (this.queue || (this.queue = [])).push({
        state: state,
        cb: cb
      });
    }
    else {
      // If not pending, then lets execute the callback
      if (_state === state || states.always === state) {
        if (sync) {
          cb.apply(_self.context, _self.value);
        }
        else {
          async(function() {cb.apply(_self.context, _self.value);});
        }
      }
      // Do proper notify events
      else if (states.notify === state) {
        if (sync) {
          cb.call(_self.context, _self.state, _self.value);
        }
        else {
          async(function() {cb.call(_self.context, _self.state, _self.value);});
        }
      }
    }
  };


  /**
   * Transitions the state of the promise from pending to either resolved or
   * rejected.  If the promise has already been resolved or rejected, then
   * this is a noop.
   */
  StateManager.prototype.transition = function (state, value, context, sync) {
    if (this.state) {
      return;
    }

    this.state   = state;
    this.context = context;
    this.value   = value;

    // Process queue if anything is waiting to be notified
    if (this.queue) {
      var item;
      var queue  = this.queue,
          length = queue.length,
          i      = 0;

      this.queue = null;

      while (i < length) {
        item = queue[i++];
        this.enqueue(item.state, item.cb, sync);
      }
    }
  };


  // 2.2.7: https://promisesaplus.com/#point-40
  StateManager.prototype.then = function(onResolved, onRejected) {
    // Make sure onResolved and onRejected are functions or null otherwise
    onResolved = typeof(onResolved) === "function" ? onResolved : null;
    onRejected = typeof(onRejected) === "function" ? onRejected : null;

    // If there are no onResolved or onRejected callbacks and the promise
    // is already resolved, we just return a new promise and copy the state
    //
    // 2.2.7.3 and 2.2.7.4: https://promisesaplus.com/#point-43
    if ((!onResolved && this.state === states.resolved) ||
        (!onRejected && this.state === states.rejected)) {
      return new Promise(null, this);
    }

    // Hand off between promise1 and resolution logic for promise2
    var stateManager = new StateManager(),
        promise2     = new Promise(null, stateManager);

    this.enqueue(states.notify, function(state, value) {
      var resolution = new Resolution({stateManager: stateManager, promise: promise2}),
          handler    = (state === states.resolved) ? (onResolved || onRejected) : (onRejected || onResolved);

      if (handler) {
        // Try catch in case calling the handler throws an exception
        try {
          // NOTE: Calling handler with `apply` violates 2.2.5. But that's done to be
          // compatible with $.ajax context
          value = [handler.apply(this, value)];
        }
        catch(ex) {
          return promise2.reject.call(this, ex);
        }
      }

      resolution.tryFinalize(state, value, this);
    });

    return promise2;
  };


  /**
   * Thenable resolution
   */
  function Resolution(options) {
    this.stateManager = options.stateManager;
    this.promise      = options.promise;
  }


  /**
   * Connects the state change of promise1 to the resolution of promise2.
   */
  Resolution.prototype.delegate = function() {
    var resolution = this;
    return function delegate(state, value) {
      resolution.tryFinalize(state, value, this);
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
        resolution.tryFinalize(state, arguments, this);
      }
    };
  };


  /**
   * Conveniece try/catch wrapper for the resolution finalizing step
   */
  Resolution.prototype.tryFinalize = function(state, value, context) {
    try {
      this.finalize(state, value, context);
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
  Resolution.prototype.finalize = function (state, value, context) {
    var promise = this.promise,
        input   = value[0],
        then    = input && input.then; // Reading `.then` could throw

    // 2.3.1 https://promisesaplus.com/#point-48
    if (input === promise) {
      throw new TypeError("Resolution input must not be the promise being resolved");
    }

    // 2.3.2 https://promisesaplus.com/#point-49
    // if the incoming promise is an instance of spromise, we adopt its state
    if (then && then.constructor === Promise) {
      return input.notify(this.delegate());
    }

    // 2.3.3 https://promisesaplus.com/#point-53
    // If thenable is function or object, then try to resolve using that.
    var thenType = then && typeof(then) === "function" && typeof(input);
    if (thenType === "function" || thenType === "object") {
      var resolution = new Resolution(this);
      try {
        then.call(input, resolution.chain(states.resolved), resolution.chain(states.rejected));
      }
      catch (ex) {
        if (!resolution.resolved) {
          promise.reject.call(context, ex);
        }
      }
    }

    // 2.3.4 https://promisesaplus.com/#point-64
    // If x is not an object or function, fulfill promise with x
    else {
      this.stateManager.transition(state, value, context, true);
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
