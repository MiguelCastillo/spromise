
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
  function async( ) {
    var args     = arguments,
        func     = arguments[0],
        index    = 1,
        now      = true,
        context  = this,
        instance = {},
        _success, _failure;

    // You can pass in the very first parameter if you want to schedule
    // the task to run right away or whenever run is called
    if ( typeof func === "boolean" ) {
      now = func;
      func = arguments[1];
      index = 2;
    }

    // Readjust args
    args = arguments[index];

    instance.fail = function fail(cb) {
      _failure = cb;
      return instance;
    };

    instance.success = function success(cb) {
      _success = cb;
      return instance;
    };

    instance.run = function run(fn) {
      exec(runner(fn || func));
      return instance;
    };

    function runner(fn) {
      return function() {
        try {
          var data = fn.apply(context, args);
          if ( _success ) {
            _success(data);
          }
        }
        catch( ex ) {
          if ( _failure ) {
            _failure(ex);
          }
        }
      };
    }

    // Return instance
    return now ? instance.run() : instance;
  }

  return async;
});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/promise',["src/async"], function(async) {
  

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

    // Setup a way to verify an spromise object
    then.constructor = Promise;


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
  Resolution.prototype.chain = function ( action, handler ) {
    var _self = this;
    return function chain( ) {
      // Prevent calling chain multiple times
      if ( !(_self.resolved++) ) {
        try {
          _self.context = this;
          _self.resolve( action, !handler ? arguments : [handler.apply(this, arguments)] );
        }
        catch( ex ) {
          _self.promise.reject(ex);
        }
      }
    };
  };

  // Routine to resolve a thenable.  Data is in the form of an arguments object (array)
  Resolution.prototype.resolve = function ( action, data ) {
    var input = data[0],
        then = (input && input.then),
        thenable = (then && typeof(then) === "function"),
        resolution, thenableType;

    // The resolver input must not be the promise tiself
    if ( input === this.promise ) {
      throw new TypeError();
    }

    if (thenable && then.constructor === Promise) {
      resolution = new Resolution(this.promise);
      input.done(resolution.chain(actions.resolve)).fail(resolution.chain(actions.reject));
    }
    else {
      thenableType = (thenable && typeof(input));
      if (thenableType === "function" || thenableType === "object") {
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
], function(promise, async) {
  

  /**
  * Interface to allow multiple promises to be synchronized
  */
  function when( ) {
    // The input is the queue of items that need to be resolved.
    var queue    = Array.prototype.slice.call(arguments),
        promise1 = promise(),
        context  = this,
        i, item, remaining, queueLength;

    if ( !queue.length ) {
      return promise1.resolve(null);
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
        promise1.resolve.apply(context, queueLength === 1 ? queue[0] : queue);
      }
    }

    // Wrap the resolution to keep track of the proper index in the closure
    function resolve( index ) {
      return function() {
        // We will replace the item in the queue with result to make
        // it easy to send all the data into the resolve interface.
        queue[index] = arguments;
        checkPending();
      };
    }

    function reject() {
      promise1.reject.apply(this, arguments);
    }

    function processQueue() {
      try {
        queueLength = remaining = queue.length;
        for ( i = 0; i < queueLength; i++ ) {
          item = queue[i];

          if ( item && typeof item.then === "function" ) {
            item.then(resolve(i), reject);
          }
          else {
            queue[i] = item;
            checkPending();
          }
        }
      }
      catch( ex ) {
        reject(ex);
      }
    }

    // Process the promises and callbacks
    async(processQueue);
    return promise1;
  }

  return when;
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

