/**
 * scpromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 *
 * Simple Compliant Promise
 * https://github.com/MiguelCastillo/scpromise
 */


define([
  "scpromise/extender",
  "scpromise/async"
], function(extender, async) {
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

  function isFunction(func) {
    return typeof func === "function";
  }

  function isObject( obj ) {
    return typeof obj === "object";
  }


  /**
  * Simple Compliant Promise
  */
  function scpromise( target ) {
    target = target || {}; // Make sure we have a target object
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
      var promise = scpromise();
      target.done(_thenHandler( promise, actions.resolve, onResolved ));
      target.fail(_thenHandler( promise, actions.reject, onRejected ));
      return promise;
    }

    function done( cb ) {
      if ( !isRejected() ) {
        _queue( queues.resolved, cb );
      }

      return target;
    }

    function fail( cb ) {
      if ( !isResolved() ) {
        _queue( queues.rejected, cb );
      }

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
    function _queue ( type, cb ) {
      if ( !isFunction( cb ) ) {
        throw "Callback must be a valid function";
      }

      // If the promise is already resolved/rejected, we call the callback right away
      if ( isPending() ) {
        _queues[type].push(cb);
      }
      else if((queues.resolved === type && isResolved()) ||
              (queues.rejected === type && isRejected())) {
        /// 1. Below is what's compliant
        //async(function() {cb(_value[0]);}, target.reject)();
        /// 2. Below is what I found more useful
        async(function() {cb.apply(_context, _value);}).fail(target.reject);
      }
    }

    // Tell everyone we are resolved/rejected
    function _notify ( queue ) {
      var i, length;
      for ( i = 0, length = queue.length; i < length; i++ ) {
        /// 1. Below is what's compliant
        //queue[i](_value[0]);
        /// 2. Below is what I found more useful
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
      }).fail(target.reject);
    }

    // Promise.then handler DRYs onresolved and onrejected
    function _thenHandler ( promise, action, handler ) {
      return function( ) {
        try {
          var data = (isFunction(handler) && handler.apply(this, arguments));
          /// 1. Below is what's compliant...
          //data = typeof data === "undefined" ? arguments : [data];
          /// 2. Below is what I found more useful
          data = (data && [data]) || arguments;
          async(_resolver, [promise, data, action]).fail(promise.reject);
        }
        catch( ex ) {
          promise.reject(ex);
        }
      };
    }

    // Routine to resolve a thenable
    function _resolver ( promise, data, action ) {
      var _data = data[0], _then = _data && _data.then;

      // Make sure we handle the promise object being the same as the
      // returned value of the handler.
      if ( _data === promise ) {
        throw new TypeError();
      }
      // Handle thenable chains.
      else if ( isFunction(_then) && (isFunction(_data) || isObject(_data)) ) {
        _then.call(_data, _thenHandler( promise, actions.resolve ), _thenHandler( promise, actions.reject ));
      }
      // Resolve/Reject promise
      else {
        promise[action].apply( this, data );
      }
    }
  }

  // Expose enums for the states
  scpromise.states = states;
  return scpromise;
});
