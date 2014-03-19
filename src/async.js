/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define( function() {
  var self = this;

  var nextTick;
  if ( self.setImmediate ) {
    nextTick = self.setImmediate;
  }
  else if ( self.process && typeof self.process.nextTick === "function" ) {
    nextTick = self.process.nextTick;
  }
  else {
    nextTick = function(cb) {
      self.setTimeout(cb, 0);
    };
  }

  return nextTick;
});
