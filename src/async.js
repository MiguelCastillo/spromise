/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define( function() {
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
