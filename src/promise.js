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

    // If a state is passed in, then we go ahead and initialize the state manager with it
    if (options.state) {
      this.transition(options.state, options.context, options.value);
    }
  }

  // Queue will figure out if the promise is pending/resolved/rejected and do the appropriate
  // action with the callback based on that.
  StateManager.prototype.enqueue = function (state, cb, sync) {
    // Queue it up if we are still pending over here
    if (!this.state) {
      (this.queue || (this.queue = [])).push({
        type: state,
        cb: cb
      });
    }
    // If the promise is already resolved/rejected
    else if (this.state === state || queues.always === state) {
      var _self = this;
      if ( sync === true ) {
        cb.apply(_self.context, _self.value);
      }
      else {
        Async(function() {
          cb.apply(_self.context, _self.value);
        });
      }
    }
  };

  // Sets the state of the promise and call the callbacks as appropriate
  StateManager.prototype.transition = function (state, context, value, sync) {
    if (this.state) {
      return;
    }

    this.state   = state;
    this.context = context;
    this.value   = value;

    // Process queue if anything is waiting to be notified
    if (this.queue) {
      var queue = this.queue,
        length = queue.length,
        i = 0,
        item;

      this.queue = null;

      do {
        item = queue[i++];
        this.enqueue(item.type, item.cb, sync);
      } while (i < length);
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
    this.enqueue(states.resolved, resolution.chain(actions.resolve, onResolved || onRejected));
    this.enqueue(states.rejected, resolution.chain(actions.reject, onRejected || onResolved));
    return resolution.promise;
  };


  /**
   * Thenable resolution
   */
  function Resolution(promise) {
    this.promise = promise;
  }


  // Promise.chain DRYs onresolved and onrejected operations.  Handler is onResolved or onRejected
  Resolution.prototype.chain = function (action, handler) {
    var _self = this, _handler;
    return function resolveHandler() {
      try {
        if ( !_self.resolved ) {
          _handler = handler;
          handler = null;
          _self.resolved = true;
          _self.finalize(action, _handler ? [_handler.apply(this, arguments)] : arguments);
        }
      }
      catch(ex) {
        _self.promise.reject.call(_self.context, ex);
      }
    };
  };


  // Routine to resolve a thenable.  Data is in the form of an arguments object (array)
  Resolution.prototype.finalize = function (action, data) {
    var input = data[0],
      then    = (input && input.then),
      promise = this.promise,
      context = this.context,
      resolution, thenableType;

    // 2.3.1
    if (input === this.promise) {
      throw new TypeError("Resolution input must not be the promise being resolved");
    }

    // 2.3.2
    // Shortcut if the incoming promise is an intance of SPromise
    if (then && then.constructor === Promise) {
      resolution = new Resolution(promise);
      then.stateManager.enqueue(states.resolved, resolution.chain(actions.resolve), true);
      then.stateManager.enqueue(states.rejected, resolution.chain(actions.reject), true);
      return;
    }

    // 2.3.3
    thenableType = then && (typeof (then) === "function" && typeof (input));
    if (thenableType === "function" || thenableType === "object") {
      try {
        resolution = new Resolution(promise);
        then.call(input, resolution.chain(actions.resolve), resolution.chain(actions.reject));
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
      promise[action].apply(context, data);
      //promise.then.stateManager.transition(action === actions.resolve ? states.resolved : states.rejected, context, data, true);
    }
  };


  // Expose enums for the states
  Promise.states = states;
  return Promise;
});
