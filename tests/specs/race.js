define(function(require/*, exports, module*/) {
  var Race    = require("src/race"),
      Promise = require("src/promise");

  describe("Race Suite", function() {

    describe("When Race has no promises", function() {
      it("then promise resolves right away and no value", function() {
        return Race().done(function(result) {
          expect(result).to.equal(undefined);
        });
      });
    });


    describe("When Race has one promise", function() {
      it("then race is resolved when promise resolved with 'Immediate resolution'", function() {
        return Race([Promise.resolve("Immediate resolution")]).done(function(result) {
          expect(result).to.equal("Immediate resolution");
        });
      });

      it("then race is resolved when promise resolved with 'Immediate rejection'", function() {
        return Promise(function(resolve) {
          Race([Promise.reject("Immediate rejection")]).fail(function(reason) {
            expect(reason).to.equal("Immediate rejection");
            resolve();
          });
        });
      });
    });


    describe("When Race has two promises", function() {
      describe("race is resolved when promise is resolved with 'Promise resolved'", function() {
        var p1, p2;
        beforeEach(function() {
          p1 = Promise.delay(10, "Promise resolved in 100 ms");
          p2 = Promise.resolve("Promise resolved");
        });

        it("then race is resolve with only one parameter", function() {
          return Race([p1, p2]).done(function() {
            expect(Array.prototype.slice.call(arguments).length).to.equal(1);
          });
        });

        it("then race is resolve with 'Promise resolved'", function() {
          return Race([p1, p2]).done(function(result) {
            expect(result).to.equal("Promise resolved");
          });
        });
      });


      describe("race is resolved when promise is rejected with 'Promise rejected'", function() {
        var p1, p2;
        beforeEach(function() {
          p1 = Promise.delay(10, "Promise resolved in 100 ms");
          p2 = Promise.reject("Promise rejected");
        });

        it("then race is resolve with only one parameter", function() {
          return Promise(function(resolve) {
            Race([p1, p2]).fail(function() {
              expect(Array.prototype.slice.call(arguments).length).to.equal(1);
              resolve();
            });
          });
        });

        it("then race is resolve with 'Promise rejected'", function() {
          return Promise(function(resolve) {
            Race([p1, p2]).fail(function(result) {
              expect(result).to.equal("Promise rejected");
              resolve();
            });
          });
        });
      });

    });
  });

});
