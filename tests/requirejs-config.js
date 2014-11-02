requirejs.config({
  "baseUrl": "../",
  "paths": {
    "mocha": "lib/mocha/mocha",
    "chai": "lib/chai/chai",
    "jquery": "lib/jquery/dist/jquery.min"
  },
  "shim": {
    "mocha": {
      "exports": "mocha"
    }
  },
  "urlArgs": 'bust=' + (new Date()).getTime()
});
