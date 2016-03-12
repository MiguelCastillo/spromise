/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

(function() {
  "use strict";

  var Promise   = require("./promise");
  Promise.async = require("./async");
  Promise.when  = require("./when");
  Promise.all   = require("./all");
  Promise.race  = require("./race");

  Promise.polyfill = function(force) {
    if (typeof(window) !== "undefined" && (!window.hasOwnProperty("Promise") || force !== false)) {
      window.Promise = Promise;
    }

    if (typeof(global) !== "undefined" && (!global.hasOwnProperty("Promise") || force !== false)) {
      global.Promise = Promise;
    }
  };

  Promise.polyfill(false);
  module.exports = Promise;
}());
