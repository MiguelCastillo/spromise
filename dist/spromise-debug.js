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
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
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
        aps = [].slice;

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
        var nameParts, nameSegment, mapValue, foundMap,
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

                name = baseParts.concat(name.split("/"));

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
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
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
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

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

            ret = callback.apply(defined[name], args);

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
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
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

define("lib/js/almond", function(){});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define( 'src/async',[],function() {
  var self = this;

  var exec;
  if ( self.setImmediate ) {
    exec = self.setImmediate;
  }
  else if ( self.process && typeof self.process.nextTick === "function" ) {
    exec = self.process.nextTick;
  }
  else {
    exec = function(cb) {
      setTimeout(cb, 0);
    };
  }


  /**
  * Handle exceptions in a setTimeout.
  * @func <function> to be called when timeout finds cycles to execute it
  * @err  <function> to be called when there is an exception thrown.  If
  *  no function is provided then the exception will be rethrown outside
  *  of the setTimeout scope
  */
  function Async( ) {
    var args     = arguments,
        func     = arguments[0],
        index    = 1,
        now      = true,
        context  = this,
        instance = {};

    // You can pass in the very first parameter if you want to schedule
    // the task to run right away or whenever run is called
    if ( typeof func === "boolean" ) {
      now = func;
      func = arguments[1];
      index = 2;
    }

    // Readjust args
    args = arguments[index] || [];

    instance.run = function run(fn) {
      exec(runner(fn || func));
    };

    instance.runSync = function(fn) {
      runner(fn || func)();
    };

    function runner(fn) {
      return function() {
        fn.apply(context, args);
      };
    }

    // Return instance
    return now ? instance.run() : instance;
  }

  return Async;
});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/promise',[
  "src/async"
], function (Async) {
  

  var states = {
    "pending": 0,
    "resolved": 2,
    "rejected": 3
  };

  var queues = {
    "always": 1,
    "resolved": 2,
    "rejected": 3
  };

  var actions = {
    "resolve": "resolve",
    "reject": "reject"
  };

  /**
   * Small Promise
   */
  function Promise(resolver, options) {
    if ( this instanceof Promise === false ) {
      return new Promise(resolver, options);
    }

    var target       = this;
    var stateManager = new StateManager(target, options || {});

    /**
     * callback registration (then, done, fail, always) must be synchrounous so
     * that the callbacks can be registered in the order they come in.
     */

    function then(onResolved, onRejected) {
      return stateManager.then(onResolved, onRejected);
    }

    // Setup a way to verify an spromise object
    then.constructor  = Promise;
    then.stateManager = stateManager;

    function done(cb) {
      stateManager.enqueue(states.resolved, cb);
      return target.promise;
    }

    function fail(cb) {
      stateManager.enqueue(states.rejected, cb);
      return target.promise;
    }

    function always(cb) {
      stateManager.enqueue(queues.always, cb);
      return target.promise;
    }

    function state() {
      return stateManager.state;
    }

    function resolve() {
      stateManager.transition(states.resolved, this, arguments);
      return target;
    }

    function reject() {
      stateManager.transition(states.rejected, this, arguments);
      return target;
    }

    target.always = always;
    target.done = done;
    target.fail = fail;
    target.resolve = resolve;
    target.reject = reject;
    target.then = then;
    target.state = state;
    target.promise = {
      always: always,
      done: done,
      fail: fail,
      then: then,
      state: state
    };

    // Interface to allow to post pone calling the resolver as long as its not needed
    if ( typeof(resolver) === "function" ) {
      resolver.call(target, target.resolve, target.reject);
    }
  }

  /**
   * Interface to play nice with libraries like when and q.
   */
  Promise.defer = function () {
    return new Promise();
  };

  /**
   * Interface to create a promise and link it to a thenable object.  The assumption is that
   * the object passed in is a thenable.  If it isn't, there is no check so an exption might
   * be going your way.
   */
  Promise.thenable = function (thenable) {
    return new Promise(thenable.then);
  };

  /**
   * Create a promise that's already rejected
   */
  Promise.rejected = function () {
    return new Promise(null, {
      context: this,
      value: arguments,
      state: states.rejected
    });
  };

  /**
   * Create a promise that's already resolved
   */
  Promise.resolved = function () {
    return new Promise(null, {
      context: this,
      value: arguments,
      state: states.resolved
    });
  };


  /**
   * StateManager is the state manager for a promise
   */
  function StateManager(promise, options) {
    // Initial state is pending
    this.state = states.pending;

    // If we already have an async object, that means that the state isn't just resolved,
    // but we also have a valid async already initialized with the proper context and data
    // we can just reuse.  This saves on a lot of cycles and memory.
    if (options.async) {
      this.state = options.state;
      this.async = options.async;
    }
    // If a state is passed in, then we go ahead and initialize the state manager with it
    else if (options.state) {
      this.transition(options.state, options.context, options.value);
    }
  }

  // Queue will figure out if the promise is resolved/rejected and do something
  // with the callback based on that.
  StateManager.prototype.enqueue = function (state, cb) {
    // Queue it up if we are still pending over here
    if (!this.state) {
      (this.queue || (this.queue = [])).push({
        type: state,
        cb: cb
      });
    }
    // If the promise is already resolved/rejected
    else if (this.state === state || queues.always === state) {
      this.async.run(cb);
    }
  };

  // Tell everyone we are resolved/rejected
  StateManager.prototype.notify = function () {
    var queue = this.queue,
      queueType = this.state,
      i = 0,
      length = queue.length,
      item;

    this.queue = null;

    do {
      item = queue[i++];
      if (item.type === queueType || item.type === queues.always) {
        this.async.run(item.cb);
      }
    } while (i < length);
  };

  // Sets the state of the promise and call the callbacks as appropriate
  StateManager.prototype.transition = function (state, context, value) {
    if (!this.state) {
      this.state = state;
      this.async = Async.call(context, false, (void 0), value);
      if (this.queue) {
        this.notify();
      }
    }
  };

  // Links together the resolution of promise1 to promise2
  StateManager.prototype.then = function (onResolved, onRejected) {
    var resolution;
    onResolved = typeof (onResolved) === "function" ? onResolved : null;
    onRejected = typeof (onRejected) === "function" ? onRejected : null;

    if ((!onResolved && this.state === states.resolved) ||
        (!onRejected && this.state === states.rejected)) {
      return new Promise(null, this);
    }

    resolution = new Resolution(new Promise());
    if ( this.state === states.resolved ) {
      this.async.run(resolution.chain(actions.resolve, onResolved || onRejected));
    }
    else if ( this.state === states.rejected ) {
      this.async.run(resolution.chain(actions.reject, onRejected || onResolved));
    }
    else {
      this.enqueue(states.resolved, resolution.chain(actions.resolve, onResolved || onRejected));
      this.enqueue(states.rejected, resolution.chain(actions.reject, onRejected || onResolved));
    }
    return resolution.promise;
  };

  /**
   * Thenable resolution
   */
  function Resolution(promise) {
    this.promise  = promise;
    this.resolved = false;
  }

  // Promise.chain DRYs onresolved and onrejected operations.  Handler is onResolved or onRejected
  Resolution.prototype.chain = function (action, handler, then) {
    var _self = this;
    return function chain() {
      // Prevent calling chain multiple times
      if (!(_self.resolved)) {
        _self.resolved = true;
        _self.context  = this;
        _self.then     = then;

        try {
          _self.finalize(action, !handler ? arguments : handler.apply(this, arguments), !handler);
        }
        catch (ex) {
          _self.promise.reject.call(_self.context, ex);
        }
      }
    };
  };

  // Routine to resolve a thenable.  Data is in the form of an arguments object (array)
  Resolution.prototype.finalize = function (action, data, unwrap) {
    var input = unwrap ? data[0] : data,
      then = (input && input.then),
      resolution, thenableType;

    if (input === this.promise) {
      throw new TypeError("Resolution input must not be the promise being resolved");
    }

    // Shortcut if the incoming promise is an intance of SPromise
    if (then && then.constructor === Promise) {
      resolution = new Resolution(this.promise);
      input.done(resolution.chain(actions.resolve)).fail(resolution.chain(actions.reject));
      return;
    }

    thenableType = (then && typeof (then) === "function" && this.then !== input && typeof (input));
    if (thenableType === "function" || thenableType === "object") {
      try {
        resolution = new Resolution(this.promise);
        then.call(input, resolution.chain(actions.resolve, false, input), resolution.chain(actions.reject, false, input));
      }
      catch (ex) {
        if (!resolution.resolved) {
          this.promise.reject.call(this.context, ex);
        }
      }
    }
    else {
      if ( unwrap ) {
        this.promise[action].apply(this.context, data);
      }
      else {
        this.promise[action].call(this.context, data);
      }
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


define('src/when',[
  "src/promise",
  "src/async"
], function(Promise, Async) {
  

  function _result(input, args, context) {
    if (typeof(input) === "function") {
      return input.apply(context, args||[]);
    }
    return input;
  }

  /**
  * Interface to allow multiple promises to be synchronized
  */
  function When( ) {
    // The input is the queue of items that need to be resolved.
    var queue    = Array.prototype.slice.call(arguments),
        promise  = Promise.defer(),
        context  = this,
        i, item, remaining, queueLength;

    if ( !queue.length ) {
      return promise.resolve(null);
    }

    //
    // Check everytime a new resolved promise occurs if we are done processing all
    // the dependent promises.  If they are all done, then resolve the when promise
    //
    function checkPending() {
      if ( remaining ) {
        remaining--;
      }

      if ( !remaining ) {
        promise.resolve.apply(context, queue);
      }
    }

    // Wrap the resolution to keep track of the proper index in the closure
    function resolve( index ) {
      return function() {
        // We will replace the item in the queue with result to make
        // it easy to send all the data into the resolve interface.
        queue[index] = arguments.length === 1 ? arguments[0] : arguments;
        checkPending();
      };
    }

    function reject() {
      promise.reject.apply(this, arguments);
    }

    function processQueue() {
      queueLength = remaining = queue.length;
      for ( i = 0; i < queueLength; i++ ) {
        item = queue[i];

        if ( item && typeof item.then === "function" ) {
          item.then(resolve(i), reject);
        }
        else {
          queue[i] = _result(item);
          checkPending();
        }
      }
    }

    // Process the promises and callbacks
    Async(processQueue);
    return promise;
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
  "src/when"
], function(promise, async, when) {
  promise.when = when;
  promise.async  = async;
  return promise;
});

  return require("src/spromise");
}));
