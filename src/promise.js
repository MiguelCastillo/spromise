/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define(["src/async"], function(async) {
  "use strict";

  var states = {
    "pending": 0,
    "resolved": 1,
    "rejected": 2
  };

  var queues = {
    "always": 0,
    "resolved": 1,
    "rejected": 2
  };

  var actions = {
    "resolve": "resolve",
    "reject": "reject"
  };

  var thenableTypes = {
    "object": true,
    "function": true
  };


  /**
  * Small Promise
  */
  function Promise(promise, options) {
    // Make sure we have a promise1promise1 object
    promise = promise || {};
    var _stateManager = new StateManager(promise, options || {});

    /**
    * callback registration (then, done, fail, always) must be synchrounous so that
    * the callbacks can be registered in the order they come in.
    */

    function then( onResolved, onRejected ) {
      return _stateManager.link( onResolved, onRejected );
    }

    // Setup a way to verify an spromise object
    then.constructor = Promise.thenable;


    function done( cb ) {
      _stateManager.queue( states.resolved, cb );
      return promise;
    }

    function fail( cb ) {
      _stateManager.queue( states.rejected, cb );
      return promise;
    }

    function always( cb ) {
      _stateManager.queue( queues.always, cb );
      return promise;
    }

    function state() {
      return _stateManager._state;
    }

    function resolve( ) {
      _stateManager.transition( states.resolved, this, arguments );
      return promise;
    }

    function reject( ) {
      _stateManager.transition( states.rejected, this, arguments );
      return promise;
    }

    promise.always  = always;
    promise.done    = done;
    promise.fail    = fail;
    promise.resolve = resolve;
    promise.reject  = reject;
    promise.then    = then;
    promise.state   = state;
    promise.promise = {
      always: always,
      done: done,
      fail: fail,
      then: then,
      state: state
    };

    return promise;
  }



  /**
  * Add quick way to tell if a promise is an spromise
  */
  Promise.thenable = function() {
    throw new TypeError();
  };


  /**
  * Interface to play nice with libraries like when and q.
  */
  Promise.defer = function(target, options) {
    return new Promise(target, options);
  };


  /**
  * StateManager is the state manager for a promise
  */
  function StateManager(promise, options) {
    this.promise = promise;

    // If we already have an async object, that means that the state isn't just resolved,
    // but we also have a valid async already initialized with the proper context and data
    // we can just reuse.  This saves on a lot of cycles and memory.
    if ( options.async ) {
      this.state = options.state;
      this.async = options.async;
    }
    // If a state is passed in, then we go ahead and initialize the state manager with it
    else if ( options.state ) {
      this.transition( options.state, options.context, options.value );
    }
  }

  // Queue will figure out if the promise is resolved/rejected and do something
  // with the callback based on that.
  StateManager.prototype.queue = function ( state, cb ) {
    // Queue it up if we are still pending over here
    if (!this.state) {
      (this.deferred || (this.deferred = [])).push({type: state, cb: cb});
    }
    // If the promise is already resolved/rejected
    else if (this.state === state) {
      this.async.run(cb);
    }
  };

  // Tell everyone we are resolved/rejected
  StateManager.prototype.notify = function () {
    var deferred  = this.deferred,
        queueType = this.state,
        i = 0, length = deferred.length, item;

    do {
      item = deferred[i++];
      if ( item.type === queueType || item.type === queues.always ) {
        this.async.run(item.cb);
      }
    } while( i < length );

    // Clean up memory when we are done processing the queue
    this.deferred = null;
  };

  // Sets the state of the promise and call the callbacks as appropriate
  StateManager.prototype.transition = function ( state, context, value ) {
    if ( !this.state ) {
      this.state = state;
      this.async = async.call(context, false, (void 0), value);
      if ( this.deferred ) {
        this.notify();
      }
    }
  };

  // Links together the resolution of promise1 to promise2
  StateManager.prototype.link = function(onResolved, onRejected) {
    var resolution, promise2;

    onResolved = typeof (onResolved) === "function" ? onResolved : null;
    onRejected = typeof (onRejected) === "function" ? onRejected : null;

    if ( (!onResolved && this.state === states.resolved) || (!onRejected && this.state === states.rejected) ) {
      promise2 = new Promise({}, this);
    }
    else {
      promise2 = new Promise();
      resolution = new Resolution(promise2);
      this.queue(states.resolved, resolution.chain(actions.resolve, onResolved || onRejected));
      this.queue(states.rejected, resolution.chain(actions.reject, onRejected || onResolved));
    }

    return promise2;
  };


  /**
  * Thenable resolution
  */
  function Resolution(promise) {
    this.promise = promise;
    this.resolved = 0;
  }

  // Promise.chain DRYs onresolved and onrejected operations.  Handler is onResolved or onRejected
  // That's determing by the function passed in by the called of chain.
  Resolution.prototype.chain = function ( action, handler ) {
    var _self = this;
    return function chain( ) {
      // Prevent calling chain multiple times
      if ( _self.resolved++ ) {
        return;
      }

      _self.context = this;

      var data;
      try {
        // ====> Non compliant code.  I really make use of this operator to properly propagate
        // context when chaining promises.  For example, when setting the context in $.ajax and
        // and chaining that directly to a promise, I want to be able to faithfully retain the
        // context that was setup in $.ajax.
        //if ( handler ) {
        //  data = handler.apply(this, arguments);
        //}

        // ====> Non compliant code.  If calling handler does not return anything, I would like
        // to continue to propagate the last resolved value.  Chains are more useful that way
        // in real life applications I have worked with.
        //data = (data !== (void 0) && [data]) || arguments;

        // ====> Compliant code.  Must not call handler with this. And if handler does not return
        // anything, the chain will then resolve the promise with no value...
        data = (handler && [handler(arguments[0])]) || arguments;
        _self.resolution( action, data );
      }
      catch( ex ) {
        _self.promise.reject(ex);
      }
    };
  };

  // Routine to resolve a thenable.  Data is in the form of an arguments object (array)
  Resolution.prototype.resolution = function ( action, data ) {
    var input = data[0],
        then = (input && input.then),
        thenable = (then && typeof (then) === "function"),
        resolution;

    // The resolver input must not be the promise tiself
    if ( input === this.promise ) {
      throw new TypeError();
    }

    if ( thenable && thenableTypes[ typeof(input) ] ) {
      try {
        resolution = new Resolution(this.promise);
        then.call(input, resolution.chain(actions.resolve), resolution.chain(actions.reject));
      }
      catch(ex) {
        if ( !resolution.resolved ) {
          this.promise.reject(ex);
        }
      }
    }
    else {
      this.promise[action].apply(this.context, data);
    }
  };


  // Expose enums for the states
  Promise.states = states;
  return Promise;
});

