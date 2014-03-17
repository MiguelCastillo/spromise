/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define([
  "src/async"
], function (Async) {
  "use strict";

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
      laziness();
      return stateManager.then(onResolved, onRejected);
    }

    // Setup a way to verify an spromise object
    then.constructor  = Promise;
    then.stateManager = stateManager;

    function done(cb) {
      laziness();
      stateManager.enqueue(states.resolved, cb);
      return target.promise;
    }

    function fail(cb) {
      laziness();
      stateManager.enqueue(states.rejected, cb);
      return target.promise;
    }

    function always(cb) {
      laziness();
      stateManager.queue(queues.always, cb);
      return target.promise;
    }

    function state() {
      return stateManager._state;
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
    function laziness() {
      var _resolver;
      if ( typeof(resolver) === "function" ) {
        _resolver = resolver;
        resolver = null;
        _resolver(target.resolve, target.reject);
      }
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
  Promise.states       = states;
  return Promise;
});
