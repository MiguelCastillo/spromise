/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

define(function(require, exports, module) {
  "use strict";

  var Promise  = require("src/promise");
  Promise.aync = require("src/async");
  Promise.when = require("src/when");
  Promise.all  = require("src/all");
  Promise.race = require("src/race");

  module.exports = Promise;
});
