var promisesAplusTests = require("promises-aplus-tests"),
    spromise = require("../dist/spromise-debug");

// Adapter so that promise tests can run
function deferred() {
  var promise1 = spromise();
  return {
    promise: promise1,
    resolve: promise1.resolve,
    reject: promise1.reject
  };
}

promisesAplusTests({deferred:deferred}, function (err) {
  console.log("=====> Errors:");
  console.log(err);
});
