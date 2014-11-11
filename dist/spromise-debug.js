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
 * @license almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("lib/almond/almond", function(){});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/async',[],function() {
  var _self = this;
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

  return Async;
});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/promise',[
  "src/async"
], function (async) {
  

  var states = {
    "pending": 0,
    "always": 1,
    "resolved": 2,
    "rejected": 3,
    "notify": 4
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

    function then(onResolved, onRejected) {
      return stateManager.then(onResolved, onRejected);
    }

    // Setup a way to verify an spromise object
    then.constructor  = Promise;
    then.stateManager = stateManager;

    function resolve() {
      stateManager.transition(states.resolved, this, arguments);
      return target;
    }

    function reject() {
      stateManager.transition(states.rejected, this, arguments);
      return target;
    }

    target.resolve = resolve;
    target.reject  = reject;
    target.then    = then;

    // Read only access point for the promise.
    target.promise = {
      then: then,
      always: this.always,
      done: this.done,
      catch: this.fail,
      fail: this.fail,
      notify: this.notify,
      state: this.state
    };

    // Interface to allow to post pone calling the resolver as long as its not needed
    if (typeof(resolver) === "function") {
      resolver.call(target, target.resolve, target.reject);
    }
  }


  Promise.prototype.delay = function(ms) {
    var _self = this;
    return new Promise(function(resolve, reject) {
      _self.then(function() {
        async.delay(resolve.bind(this), ms, arguments);
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
    if (value instanceof Promise) {
      return value;
    }

    if (value && typeof(value.then) === "function") {
      return new Promise(value.then);
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
      this.transition(options.state, options.context, options.value);
    }
  }


  /**
   * Figure out if the promise is pending/resolved/rejected and do the appropriate action
   * with the callback based on that.
   */
  StateManager.prototype.enqueue = function (state, cb, sync) {
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
        cb.apply(this.context, this.value);
      }
      else {
        async(cb.apply.bind(cb, this.context, this.value));
      }
    }

    // Do proper notify events
    else if (states.notify === state) {
      if (sync) {
        cb.call(this.context, this.state, this.value);
      }
      else {
        async(cb.call.bind(cb, this.context, this.state, this.value));
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
    // Make sure onResolved and onRejected are correct
    onResolved = typeof(onResolved) === "function" ? onResolved : null;
    onRejected = typeof(onRejected) === "function" ? onRejected : null;

    if ((!onResolved && this.state === states.resolved) ||
        (!onRejected && this.state === states.rejected)) {
      return new Promise(null, this);
    }

    var resolution = new Resolution();
    this.enqueue(states.notify, (onResolved || onRejected) ? resolution.resolve(onResolved, onRejected) : resolution.notify());
    return resolution.promise;
  };


  /**
   * Thenable resolution
   */
  function Resolution(promise) {
    this.promise = promise || new Promise();
  }


  Resolution.prototype.resolve = function(onResolved, onRejected) {
    var _self = this;
    return function resolve(state, value) {
      var handler = (state === states.resolved ? (onResolved || onRejected) : (onRejected || onResolved));

      try {
        // Try/catch block in case calling the handler throws an exception
        _self.context = this;
        _self.finalize(state, [handler.apply(this, value)]);
      }
      catch(ex) {
        _self.promise.reject.call(_self.context, ex);
      }
    };
  };


  // Notify when a promise has change state.
  Resolution.prototype.notify = function () {
    var _self = this;
    return function notify(state, value) {
      try {
        _self.context = this;
        _self.finalize(state, value);
      }
      catch (ex) {
        _self.promise.reject.call(_self.context, ex);
      }
    };
  };


  // Promise.chain DRYs onresolved and onrejected operations.  Handler is onResolved or onRejected
  // This chain is partcularly used when dealing with external promises where we just just have to
  // resolve the result
  Resolution.prototype.chain = function (state) {
    var _self = this;
    return function chain() {
      try {
        // Handler can only be called once!
        if (!_self.resolved) {
          _self.resolved = true;
          _self.context  = this;
          _self.finalize(state, arguments);
        }
      }
      catch (ex) {
        _self.promise.reject.call(_self.context, ex);
      }
    };
  };


  /**
   * Process the output from a promise resolutions.
   * @param {states} state - Is the state of the promise resolution (resolved/rejected)
   * @param {array} data - Is value of the resolved promise
   */
  Resolution.prototype.finalize = function (state, data) {
    var input   = data[0];
    var then    = (input && input.then);
    var promise = this.promise;
    var context = this.context;
    var resolution, thenableType;

    // 2.3.1
    if (input === this.promise) {
      throw new TypeError("Resolution input must not be the promise being resolved");
    }

    // 2.3.2
    // Shortcut if the incoming promise is an instance of spromise
    if (then && then.constructor === Promise) {
      then.stateManager.enqueue(states.notify, this.notify(), true);
      return;
    }

    // 2.3.3
    // If thenable is function or object, then try to resolve using that.
    thenableType = typeof (then) === "function" ? typeof (input) : null;
    if (thenableType === "function" || thenableType === "object") {
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
  return Promise;
});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/all',[
  "src/promise",
  "src/async"
], function(Promise, Async) {
  

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

  return All;
});


/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/when',[
  "src/promise",
  "src/all"
], function(Promise, All) {
  

  /**
  * Interface to allow multiple promises to be synchronized
  */
  function When() {
    var context = this, args = arguments;
    return Promise(function(resolve, reject) {
      All.call(context, args).then(function(results) {
        resolve.apply(context, results);
      },
      function(reason) {
        reject.call(context, reason);
      });
    });
  }

  return When;
});


/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/spromise',[
  "src/promise",
  "src/async",
  "src/when",
  "src/all"
], function(promise, async, when, all) {
  promise.async  = async;
  promise.when = when;
  promise.all = all;
  return promise;
});


  return require("src/spromise");
}));
