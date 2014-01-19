(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // Do AMD support
    define(factory);
  } else {
    // Non AMD loading
    root.rjasmine = factory();
  }
}(this, function () {

