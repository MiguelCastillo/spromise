/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define([
  "src/when"
], function(when) {
  "use strict";

  function All(values) {
    function resolved() {
      return Array.prototype.slice.call(arguments);
    }

    function rejected(reason) {
      return reason;
    }

    return when.apply(this, values).then(resolved, rejected);
  }

  return All;
});

