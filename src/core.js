/**
 * scpromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define([
  "scpromise/promise",
  "scpromise/when",
  "scpromise/deferred"
], function(promise, when, deferred) {
  promise.when = when;
  promise.deferred = deferred;
  return promise;
});

