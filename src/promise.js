/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define([
  "src/async"
], function (async) {
  "use strict";

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
