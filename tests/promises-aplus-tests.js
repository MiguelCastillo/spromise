var promisesAplusTests = require("promises-aplus-tests"),
    spromise = require("../dist/spromise-debug");

promisesAplusTests(spromise, function (err) {
  console.log("=====> Errors:");
  console.log(err);
});
