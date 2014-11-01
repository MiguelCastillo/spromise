/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define(function() {
  var _self = this;
  var nextTick;

  /**
   * Find the prefered method for queue callbacks in the event loop
   */
  if (_self.setImmediate) {
    nextTick = _self.setImmediate;
  }
  else if (_self.process && typeof(_self.process.nextTick) === "function") {
    nextTick = _self.process.nextTick;
  }
  else {
    nextTick = function(cb) {
      _self.setTimeout(cb, 0);
    };
  }

  function Async(cb) {
    nextTick(cb);
  }

  Async.delay = function() {
    var callback = arguments[0];
    var timeout  = arguments[1];
    var args     = arguments[2] || [];
    _self.setTimeout(callback.apply.bind(callback, this, args), timeout);
  };

  return Async;
});
