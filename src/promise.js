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
  function StateManager(promise, options) {
    this.promise  = promise;
    this.state    = options.state;
    this.value    = options.value;
    this.context  = options.context;
  }

  // Queue will figure out if the promise is resolved/rejected and do something
  // with the callback based on that.
  StateManager.prototype.queue = function ( state, cb ) {
    // Queue it up if we are still pending over here
    if ( !this.state ) {
      (this.deferred || (this.deferred = [])).push({type: state, cb: cb});
    }
    // If the promise is already resolved/rejected
    else if (this.state === state) {
      async.call(this.context, cb, this.value);
    }
  };

  // Tell everyone we are resolved/rejected
  StateManager.prototype.notify = function ( queueType ) {
    var deferred = this.deferred,
        context  = this.context,
        value    = this.value,
        arunner  = async.apply(context, [false, (void 0), value]),
        i, length, item;

    for ( i = 0, length = deferred.length; i < length; i++ ) {
      item = deferred[i];
      if ( item.type === queueType || item.type === queues.always ) {
        arunner.run(item.cb);
      }
    }

    // Clean up memory when we are done processing the queue
    this.deferred = null;
  };

  // Sets the state of the promise and call the callbacks as appropriate
  StateManager.prototype.transition = function ( state, context, value ) {
    if ( !this.state ) {
      this.state   = state;
      this.context = context;
      this.value   = value;
      if ( this.deferred ) {
        this.notify( state );
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
      this.queue(states.rejected, resolution.chain(actions.resolve, onRejected || onResolved));
    }

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
    var input = data[0], then = (input && input.then), inputType = typeof(input);

    // The resolver input must not be the promise tiself
    if ( input === this.promise ) {
      throw new TypeError();
    }

    // Is data a thenable?
    if ((inputType === "function" || (inputType === "object" && input !== null)) && typeof(then) === "function") {
      then.call(input, this.chain(actions.resolve), this.chain(actions.reject));
    }
    // Resolve/Reject promise
    else {
      this.promise[action].apply(this, data);
    }
  };


  // Expose enums for the states
  Promise.states = states;
  return Promise;
});
