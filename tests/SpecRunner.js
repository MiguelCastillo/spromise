define([
  "jquery",
  "chai"
], function($, chai) {

  window.$      = $;
  window.chai   = chai;
  window.expect = chai.expect;
  window.assert = chai.assert;

  mocha.setup("bdd");

  require([
    "tests/specs/all",
    "tests/specs/async",
    "tests/specs/promise",
    "tests/specs/when",
    "tests/specs/build"
  ], mocha.run);
});
