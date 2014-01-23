var promisesAplusTests = require("promises-aplus-tests"),
    scpromise = require("../dist/scpromise-debug");

promisesAplusTests(scpromise, function (err) {
  console.log("=====> Errors:");
  console.log(err);
});
