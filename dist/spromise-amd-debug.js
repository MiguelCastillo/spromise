
/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define( 'src/async',[],function() {

  /**
  * Handle exceptions in a setTimeout.
  * @func <function> to be called when timeout finds cycles to execute it
  * @err  <function> to be called when there is an exception thrown.  If
  *  no function is provided then the exception will be rethrown outside
  *  of the setTimeout scope
  */
  function async( ) {
    var args     = Array.prototype.slice.call(arguments),
        func     = args.shift(),
        context  = this,
        error    = function(){};


    function runner() {
      return function() {
        try {
          func.apply(context, args[0]);
        }
        catch( ex ) {
          setTimeout(thrown(ex), 1);
        }
      };
    }

    function thrown(err) {
      return function() {
        error(err);
      };
    }

    function fail(cb) {
      error = cb;
    }

    // Schedule for running...
    setTimeout(runner(), 1);

    return {
      fail: fail
    };
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

  var actions = {
    resolve: "resolve",
    reject: "reject"
  };

  var queues = {
    always: "always",
    resolved: "resolved",
    rejected: "rejected"
  };

  function isFunction( func ) {
    return typeof func === "function";
  }

  function isObject( obj ) {
    return typeof obj === "object";
  }

  function isResolved( state ) {
    return state === states.resolved;
  }

  function isRejected( state ) {
    return state === states.rejected;
  }

  function isPending( state ) {
    return state === states.pending;
  }


  /**
  * Simple Compliant Promise
  */
  function promise( promise1 ) {
    promise1 = promise1 || {}; // Make sure we have a promise1promise1 object
    var _state   = states.pending, // Current state
        _context = this,
        _queues  = {
          always: [],             // Always list of callbacks
          resolved: [],           // Success list of callbacks
          rejected: []            // Failue list of callbacks
        }, _value;                // Resolved/Rejected value.


    /**
    * Then promise interface
    */
    function then( onResolved, onRejected ) {
      // Create a new promise to properly create a promise chain
      var promise2 = promise();
      promise1.done(_thenHandler(promise2, actions.resolve, onResolved));
      promise1.fail(_thenHandler(promise2, actions.reject, onRejected));
      return promise2;
    }

    function done( cb ) {
      if ( !isRejected(_state) ) {
        _queue( queues.resolved, cb );
      }

      return promise1;
    }

    function fail( cb ) {
      if ( !isResolved(_state) ) {
        _queue( queues.rejected, cb );
      }

      return promise1;
    }

    function resolve( ) {
      if ( isPending(_state) ) {
        _context = this;
        _updateState( states.resolved, arguments );
      }

      return promise1;
    }

    function reject( ) {
      if ( isPending(_state) ) {
        _context = this;
        _updateState( states.rejected, arguments );
      }

      return promise1;
    }

    function always( cb ) {
      _queue( queues.always, cb );
      return promise1;
    }

    function state() {
      return _state;
    }


    /**
    * Promise API
    */
    promise1.always = always;
    promise1.done = done;
    promise1.fail = fail;
    promise1.resolve = resolve;
    promise1.reject = reject;
    promise1.then = then;
    promise1.state = state;
    return promise1;


    /**
    * Internal core functionality
    */


    // Queue will figure out if the promise is resolved/rejected and do something
    // with the callback based on that.  It also verifies that there is a callback
    // function
    function _queue ( type, cb ) {
      // If the promise is already resolved/rejected, we call the callback right away
      if ( isPending(_state) ) {
        _queues[type].push(cb);
      }
      else {
        async.apply(_context, [cb, _value]).fail(promise1.reject);
      }
    }

    // Tell everyone we are resolved/rejected
    function _notify ( queue ) {
      var i, length;
      for ( i = 0, length = queue.length; i < length; i++ ) {
        queue[i].apply(_context, _value);
      }

      // Empty out the array
      queue.splice(0, queue.length);
    }

    // Sets the state of the promise and call the callbacks as appropriate
    function _updateState ( state, value ) {
      _state = state;
      _value = value;
      async(function() {
        _notify( _queues[state === states.resolved ? queues.resolved : queues.rejected] );
        _notify( _queues[queues.always] );
      }).fail(promise1.reject);
    }

    // Promise.then handler DRYs onresolved and onrejected
    function _thenHandler ( promise2, action, handler ) {
      return function thenHadler( ) {
        try {
          var data;

          if ( handler && isFunction(handler) ) {
            data = handler.apply(this, arguments);
          }

          // Setting the data to arguments when data is undefined isn't compliant.  But I have
          // found that this behavior is much more desired when chaining promises.
          data = (data !== undefined && [data]) || arguments;
          _resolver.call( this, promise2, data, action );
        }
        catch( ex ) {
          promise2.reject(ex);
        }
      };
    }

    // Routine to resolve a thenable.  Data is in the form of an arguments object (array)
    function _resolver ( promise2, data, action ) {
      var input = data[0];

      // The resolver input must not be the promise tiself
      if ( input === promise2 ) {
        throw new TypeError();
      }
      // Is data a thenable?
      else if ( (input !== null && (isFunction(input) || isObject(input))) && isFunction(input.then) ) {
        input.then.call(input, _thenHandler( promise2, actions.resolve ), _thenHandler( promise2, actions.reject ));
      }
      // Resolve/Reject promise
      else {
        promise2[action].apply( this, data );
      }
    }
  }

  // Expose enums for the states
  promise.states = states;
  promise.async  = async;
  return promise;
});

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/when',[
  "src/promise"
], function(promise) {
  

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
        context = this;
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
    setTimeout(processQueue, 1);
    return promise1;
  };


  return when;

});


/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/deferred',[
  "src/promise"
], function(promise) {
  

  function deferred() {
    var promise1 = promise();
    return {
      promise: promise1,
      resolve: promise1.resolve,
      reject: promise1.reject
    };
  }

  return deferred;

});


/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define('src/spromise',[
  "src/promise",
  "src/when",
  "src/deferred"
], function(promise, when, deferred) {
  promise.when = when;
  promise.deferred = deferred;
  return promise;
});

