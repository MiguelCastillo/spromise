/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define([
  "src/promise",
  "src/async",
  "src/when",
  "src/all"
], function(promise, async, when, all) {
  promise.async  = async;
  promise.when = when;
  promise.all = all;
  return promise;
});

