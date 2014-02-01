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

  var actions = {
    "resolve": "resolve",
    "reject": "reject"
  };

  var queues = {
    "always": 0
  };


  /**
  * Small Promise
  */
  function Promise( promise ) {
    // Make sure we have a promise1promise1 object
    promise = promise || {};
    var _stateManager = new StateManager(promise);

    /**
    * callback registration (then, done, fail, always) must be synchrounous so that
    * the callbacks can be registered in the order they come in.
    */

    function then( onResolved, onRejected ) {
      return _stateManager.link(onResolved, onRejected);
    }

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

    function resolve( ) {
      _stateManager.transition( states.resolved, this, arguments );
      return promise;
    }

    function reject( ) {
      _stateManager.transition( states.rejected, this, arguments );
      return promise;
    }

    function state() {
      return _stateManager._state;
    }


    /**
    * Promise API
    */
    promise.always  = always;
    promise.done    = done;
    promise.fail    = fail;
    promise.resolve = resolve;
    promise.reject  = reject;
    promise.then    = then;
    promise.state   = state;
    return promise;
  }


  /**
  * StateManager is the state manager for a promise
  */
  function StateManager(promise) {
    this._state   = states.pending;  // Initial state
    this._promise = promise;         // Keep track of promise
    this._value   = (void 0);        // Resolved/Rejected value.
    this._queue   = [];              // Callback queue
  }

  // Queue will figure out if the promise is resolved/rejected and do something
  // with the callback based on that.
  StateManager.prototype.queue = function ( state, cb ) {
    // Queue it up if we are still pending over here
    if ( this._state === states.pending ) {
      this._queue.push({type: state, cb: cb});
    }
    // If the promise is already resolved/rejected
    else if (this._state === state) {
      async.call(this._context, cb, this._value);
    }
  };

  // Tell everyone we are resolved/rejected
  StateManager.prototype.notify = function ( queueType ) {
    var queue = this._queue.slice(0),
        i, length, item;

    // Delete queue to clean up memory when we are done processing the queue
    delete this._queue;

    for ( i = 0, length = queue.length; i < length; i++ ) {
      item = queue[i];
      if ( item.type === queueType || item.type === queues.always ) {
        item.cb.apply(this._context, this._value);
      }
    }
  };

  // Sets the state of the promise and call the callbacks as appropriate
  StateManager.prototype.transition = function ( state, context, value ) {
    if ( this._state === states.pending ) {
      this._state   = state;
      this._context = context;
      this._value   = value;
      async.call(this, this.notify, [state]).fail(this._promise.reject);
    }
  };

  // Links together the resolution of promise1 to promise2
  StateManager.prototype.link = function(onResolved, onRejected) {
    var promise2 = new Promise(),
        resolution = new Resolution(promise2);
    this.queue(states.resolved, resolution.chain(actions.resolve, typeof (onResolved) === "function" ? onResolved : onRejected));
    this.queue(states.rejected, resolution.chain(actions.resolve, typeof (onRejected) === "function" ? onRejected : onResolved));
    return promise2;
  };


  /**
  * Thenable resolution
  */
  function Resolution(promise) {
    this.promise = promise;
  }

  // Promise.chain DRYs onresolved and onrejected operations
  Resolution.prototype.chain = function ( action, handler ) {
    var _self = this;
    return function chain( ) {
      var data;
      try {
        if ( handler ) {
          data = handler.apply(this, arguments);
        }

        data = (data !== (void 0) && [data]) || arguments;
        _self.resolution( action, data );
      }
      catch( ex ) {
        _self.promise.reject(ex);
      }
    };
  };

  // Routine to resolve a thenable.  Data is in the form of an arguments object (array)
  Resolution.prototype.resolution = function ( action, data ) {
    var input = data[0], then = (input && input.then), inputType = typeof input;

    // The resolver input must not be the promise tiself
    if ( input === this.promise ) {
      throw new TypeError();
    }
    // Is data a thenable?
    else if ((input !== null && (inputType === "function" || inputType === "object")) && typeof then === "function") {
      then.call(input, this.chain( actions.resolve ), this.chain( actions.reject ));
    }
    // Resolve/Reject promise
    else {
      this.promise[action].apply( this, data );
    }
  };


  // Expose enums for the states
  Promise.states = states;
  return Promise;
});
