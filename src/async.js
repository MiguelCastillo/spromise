/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define( function() {

  var exec;
  if ( process && typeof process.nextTick === "function" ) {
    exec = process.nextTick;
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
    var args     = Array.prototype.slice.call(arguments),
        func     = args.shift(),
        context  = this,
        instance = {},
        _success, _failure;

    instance.fail = function fail(cb) {
      _failure = cb;
      return instance;
    };

    instance.success = function success(cb) {
      _success = cb;
      return instance;
    };

    function runner() {
      try {
        var data = func.apply(context, args[0]);
        if ( _success ) {
          _success(data);
        }
      }
      catch( ex ) {
        if ( _failure ) {
          _failure(ex);
        }
      }
    }

    // Schedule for running...
    exec(runner);

    // Return instance
    return instance;
  }

  return async;
});
