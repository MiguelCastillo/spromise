/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define( function() {
  var _self = this;

  var nextTick;
  if ( _self.setImmediate ) {
    nextTick = _self.setImmediate;
  }
  else if ( _self.process && typeof _self.process.nextTick === "function" ) {
    nextTick = _self.process.nextTick;
  }
  else {
    nextTick = function(cb) {
      _self.setTimeout(cb, 0);
    };
  }

  return nextTick;
});
