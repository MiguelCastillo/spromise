define(["src/promise", "src/all"], function(promise, all) {

  describe("All", function() {

    it("no arguments", function() {
      return all([]).then(function(result) {
        expect(result instanceof Array).to.equal(true);
        expect(result.length).to.equal(0);
      });
    });

    it("single promise, resolved", function() {
      var deferred = promise.resolve("resolved promise");

      return all([deferred]).then(function(result) {
        expect(result.length).to.equal(1);
        expect(result[0]).to.equal("resolved promise");
      });
    });

    it("two promises, both resolved", function() {
      var deferred1 = promise.resolve("resolved promise1");
      var deferred2 = promise.resolve("resolved promise2");

      return all([deferred1, deferred2]).then(function(result) {
        expect(result.length).to.equal(2);
        expect(result[0]).to.equal("resolved promise1");
        expect(result[1]).to.equal("resolved promise2");
      });
    });

    it("two promises, one unresolved one rejected", function() {
      var deferred1 = promise.defer();
      var deferred2 = promise.reject("reject promise2");
      var result    = promise.defer();

      all([deferred1, deferred2]).then(function(reason) {
        expect("Failure was expected").to.equal(true);
        result.resolve();
      }, function(reason) {
        expect(reason).to.equal("reject promise2");
        result.resolve();
      });

      return result;
    });

    it("two promises, one resolved one Number", function() {
      var deferred1 = promise.resolve("resolve promise");

      return all([deferred1, 3.14]).then(function(result) {
        expect(result[0]).to.equal("resolve promise");
        expect(result[1]).to.equal(3.14);
      });
    });

  });

});
