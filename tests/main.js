/*
 * rjasmine Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */


define(["libs/js/rjasmine", "../libs/js/jquery-1.10.1"], function(rjasmine) {

  // Configure requirejs globably to make scpromise src available
  // in all unit tests
  requirejs.config({
    paths: {
      "scpromise": "../src"
    }
  });


  var _rjasmine = new rjasmine({
    reporters: {
      html_reporter: true,
      console_reporter: true
    }
  });

  // Make the api available globally...
  rjasmine.extend(this, _rjasmine._api);
  this.rjasmine = rjasmine;

  // rjasmine needs to wait for reporters to be loaded...
  _rjasmine.ready(function() {
    require([
      "specs/promise"
    ], _rjasmine.execute);
  });
});

