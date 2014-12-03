/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define([
  "src/promise",
  "src/async",
  "src/when",
  "src/all",
  "src/race"
], function(Promise, Async, When, All, Race) {
  Promise.async = Async;
  Promise.when  = When;
  Promise.all   = All;
  Promise.race  = Race;
  return Promise;
});
