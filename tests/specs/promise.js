define(["scpromise/promise"], function(promise) {

  describe("Promises", function() {
    var dummy = { dummy: "dummy" };

    it("Simple thenable", function() {

      var promise1 = new promise();

      promise1.then(function(x) {
        expect(x).toBe("simple value");
      });

      return promise1.resolve("simple value");
    });


    it("Promise object return itself in a then call", function() {
      var promise1 = new promise();

      var promise2 = promise1.then(function(x) {
        expect(x).toBe("simple value");
        return promise2;
      })
      .fail(function(ex) {
        expect(ex).toBeDefined();
      })
      .done(function() {
        expect(this).toBe("never called");
      });

      return promise1.resolve("simple value");
    });


    it("Simple thenable chain", function() {
      var promise1 = promise();

      var promise2 = promise1.then(function(x) {
        expect(x).toBe("Thenable returning thenable simple value");
        return promise().resolve("first chain");
      });

      promise2.then(function(x) {
        expect(x).toBe("first chain");
      });

      promise1.resolve("Thenable returning thenable simple value");
      return promise2;
    });


    it("Thenable returning thenable", function() {
      var promise1 = promise();
      var promise6 = promise();

      var promise2 = promise1.then(function(x) {
        expect(x).toBe("Thenable returning thenable simple value");
        return promise().resolve("first chain");
      });

      var promise3 = promise2.then(function(x) {
        expect(x).toBe("first chain");
        return promise().resolve("second chain");
      });

      promise3.then(function(x) {
        expect(x).toBe("second chain");
      })
      .done(function (x) {
        expect(x).toBe("second chain");
        // returning a promise only affects then and not done
        return promise().resolve("third chain");
      })
      .done(function (x) {
        expect(x).toBe("second chain");
      });

      promise1.resolve("Thenable returning thenable simple value");
      return promise3;
    });


    it("Long promise thenable chain", function() {
      var promise1 = new promise();

      promise1.then(function(x) {
        expect(x).toBe("simple value");
        return promise().resolve("tests1");
      })
      .then(function(x) {
        expect(x).toBe("tests1");
        return promise().resolve("tests2");
      })
      .then(function(x) {
        expect(x).toBe("tests2");
        return promise().resolve("tests3");
      })
      .then(function(x) {
        expect(x).toBe("tests3");
        return promise().resolve("tests5");
      })
      .then(function(x) {
        expect(x).toBe("tests5");
      });

      return promise1.resolve("simple value");
    });


    it("Resolve with multiple object arguments", function() {

      var promise1 = new promise();

      promise1.done(function(_actor, _categories, _books) {
        expect(_actor).toBeDefined();
        expect(_actor.firstName).toBe("Dracula");
        expect(_actor.nickName).toBe("Vampire");

        expect(_categories).toBeDefined();
        expect(_categories.scifi).toBe("Star Trek");
        expect(_categories.drama).toBe("I am sam");

        expect(_books).toBeDefined();
        expect(_books instanceof Array).toBe(true);
        expect(_books[0]).toBe("Harri Potter");
        expect(_books[1]).toBe("Lord of The Rings");
      });

      var actor = {
        "firstName": "Dracula",
        "nickName": "Vampire"
      };

      var categories = {
        "scifi": "Star Trek",
        "drama": "I am sam"
      };

      var books = ["Harri Potter", "Lord of The Rings"];

      return promise1.resolve(actor, categories, books);
    });


    it("fulfilled after a delay", function () {
      var _promise = promise();
      var d = promise();
      var isFulfilled = false;

      d.then(function onFulfilled() {
        expect(isFulfilled).toBe(true);
        _promise.resolve();
      });

      setTimeout(function () {
        d.resolve(dummy);
        isFulfilled = true;
      }, 50);

      return _promise;
    });


    it("then with a throw", function () {
      var promise1 = promise(),
          promise3 = promise();

      var promise2 = promise1.then(function(x) {
        console.log(x);
        return promise().resolve("resolve promise2");
      })
      .then(function(x) {
        expect(x).toBe("resolve promise2");
        throw "My Bad";
      })
      .then(function(x) {
      },function(ex) {
        expect(ex).toBe("My Bad");
        return promise2.resolve("===> exception handled");
      })
      .then(function(x) {
        expect(x).toBe("===> exception handled");
        promise3.resolve();
      });

      promise1.resolve("tests");
      return promise3;
    });


    it("then with a throw and chained rejects", function () {
      var promise1 = promise(),
          promise3 = promise();

      var promise2 = promise1.then(function(x) {
        console.log(x);
        return promise().reject("resolve promise2");
      })
      .then(function(){}, function(x) {
        expect(x).toBe("resolve promise2");
        throw "My Bad";
      })
      .then(function(x) {
      },function(ex) {
        expect(ex).toBe("My Bad");
        return promise2.reject("===> exception handled");
      })
      .then(function() {}, function(x) {
        expect(x).toBe("===> exception handled");
        promise3.resolve();
      });

      promise1.resolve("tests");
      return promise3;
    });

  });

});
