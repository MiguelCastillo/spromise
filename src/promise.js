/**
 * scpromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 *
 * Simple Compliant Promise
 * https://github.com/MiguelCastillo/scpromise
 */


define([
  "scpromise/extender"
], function(extender) {
  "use strict";

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


  function scpromise( target ) {
    target = target || {}; // Make sure we have a target object
    var _state   = states.pending, // Current state
        _context = this,
        _queues  = {
          always: [],             // Always list of callbacks
          resolved: [],           // Success list of callbacks
          rejected: []            // Failue list of callbacks
        }, _value;                // Resolved/Rejected value.


    // Then promise interface
    function then( onFulfilled, onRejected ) {
      // Create a new promise to properly create a promise chain
      var promise = scpromise();

      setTimeout(function() {
        try {
          // Handle done callback
          target.done(function() {
            _resolver.call( this, promise, actions.resolve, onFulfilled, arguments );
          });

          target.fail(function() {
            _resolver.call( this, promise, actions.reject, onRejected, arguments );
          });
        }
        catch( ex ) {
          promise.reject(ex);
        }
      }, 1);

      return promise;
    }


    function done( cb ) {
      if ( isRejected() ) {
        return target;
      }

      _queue( queues.resolved, cb );
      return target;
    }


    function fail( cb ) {
      if ( isResolved() ) {
        return target;
      }

      _queue( queues.rejected, cb );
      return target;
    }


    function resolve( ) {
      if ( !isPending() ) {
        return target;
      }

      _context = this;
      _updateState( states.resolved, arguments );
      return target;
    }


    function reject( ) {
      if ( !isPending() ) {
        return target;
      }

      _context = this;
      _updateState( states.rejected, arguments );
      return target;
    }


    function always( cb ) {
      _queue( queues.always, cb );
      return target;
    }


    function state() {
      return _state;
    }


    function isResolved() {
      return _state === states.resolved;
    }


    function isRejected() {
      return _state === states.rejected;
    }


    function isPending() {
      return _state === states.pending;
    }


    /**
    * Promise API
    */
    return extender.mixin(target, {
      always: always,
      done: done,
      fail: fail,
      resolve: resolve,
      reject: reject,
      then: then,
      state: state
    });


    /**
    * Internal core functionality
    */

    // Queue will figure out if the promise is resolved/rejected and do something
    // with the callback based on that.  It also verifies that there is a callback
    // function
    function _queue( type, cb ) {
      if ( typeof cb !== "function" ) {
        throw "Callback must be a valid function";
      }

      // If the promise is already resolved/rejected, we call the callback right away
      if ( isPending() ) {
        _queues[type].push(cb);
      }
      else if((queues.resolved === type && isResolved()) ||
              (queues.rejected === type && isRejected())) {
        cb.apply(_context, _value);
      }
    }


    // Tell everyone and tell them we are resolved/rejected
    function _notify( queue ) {
      var i, length;
      for ( i = 0, length = queue.length; i < length; i++ ) {
        queue[i].apply(_context, _value);
      }

      // Empty out the array
      queue.splice(0, queue.length);
    }


    // Sets the state of the promise and call the callbacks as appropriate
    function _updateState( state, value ) {
      _state = state;
      _value = value;
      setTimeout(function() {
        _notify( _queues[state === states.resolved ? queues.resolved : queues.rejected] );
        _notify( _queues[queues.always] );
      }, 1);
    }


    // Routine to resolve a thenable
    function _resolver( promise, action, handler, data ) {
      var result  = (typeof handler === "function" && handler.apply( this, data )) || (data && data[0]);
      var then    = result && result.then;

      // Make sure we handle the promise object being the same as the
      // returned value of the handler.
      if ( result === promise ) {
        throw new TypeError();
      }
      // Handle thenable chains.
      else if ( typeof then === "function" ) {
        then.call(result, function resolvePromise () {
          _resolver( promise, actions.resolve, null, arguments );
        }, function rejectPromise () {
          _resolver( promise, actions.reject, null, arguments );
        });
      }
      // Handle direct callbacks
      else {
        promise[action].apply( this, (result && [result]) );
      }
    }

  }


  // Expose enums for the states
  scpromise.states = states;


  return scpromise;
});
