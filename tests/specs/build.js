define(["dist/spromise-debug"], function(Promise) {

  describe("Build suite test promise", function() {
    var result, promise1;
    beforeEach(function() {
      promise1 = new Promise();
      result = Promise.defer();
    });

    it("then resolution value is 'simple value'", function() {
      promise1.then(function(x) {
        expect(x).to.equal("simple value");
        result.resolve();
      });

      promise1.resolve("simple value");
      return result;
    });

    it("then the promise is resolved after a small delay", function () {
      promise1.then(function (x) {
        expect(x).to.equal("First success");
        result.resolve();
      });

      setTimeout(function () {
        promise1.resolve("First success");
      }, 50);

      return result;
    });
  });

});
