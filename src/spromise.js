/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define([
  "src/promise",
  "src/async",
  "src/when"
], function(promise, async, when) {
  promise.when = when;
  promise.async  = async;
  return promise;
});

