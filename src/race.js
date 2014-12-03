/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

define(["src/promise"], function(Promise) {
  "use strict";

  function Race(iterable) {
    if (!iterable) {
      return Promise.resolve();
    }

    return new Promise(function(resolve, reject) {
      var i, length, _done = false;
      for (i = 0, length = iterable.length; i < length; i++) {
        iterable[i].then(_resolve, _reject);
      }

      function _resolve() {
        if (!_done) {
          _done = true;
          resolve.apply(this, arguments);
        }
      }

      function _reject() {
        if (!_done) {
          _done = true;
          reject.apply(this, arguments);
        }
      }
    });
  }

  return Race;
});
