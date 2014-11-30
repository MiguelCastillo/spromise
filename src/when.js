/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define([
  "src/promise",
  "src/all"
], function(Promise, All) {
  "use strict";

  /**
  * Interface to allow multiple promises to be synchronized
  */
  function When() {
    var context = this, args = arguments;
    return new Promise(function(resolve, reject) {
      All.call(context, args).then(function(results) {
        resolve.apply(context, results);
      },
      function(reason) {
        reject.call(context, reason);
      });
    });
  }

  return When;
});

