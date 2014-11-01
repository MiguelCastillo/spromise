define(["src/promise"], function(Promise) {

  describe("Promises Suite", function() {

    describe("When promise is resolved with resolve interface", function() {
      var result, promise1;
      beforeEach(function() {
        promise1 = new Promise();
        result = Promise.defer();
      });

      it("then resolution value is 'simple value'", function() {
        promise1.then(function(x) {
          expect(x).toBe("simple value");
          result.resolve();
        });

        promise1.resolve("simple value");
        return result;
      });
    });


    describe("When promise is rejected with reject interface", function() {
      var result, promise1;
      beforeEach(function() {
        promise1 = new Promise();
        result = Promise.defer();
      });

      it("then rejection reason is 'bad value'", function() {
        promise1.then(function() {}, function(x) {
          expect(x).toBe("bad value");
          result.resolve();
        });

        promise1.reject("bad value");
        return result;
      });
    });

    
    describe("When a promise is resolved with the resolver function", function() {
      var result;
      beforeEach(function() {
        result = Promise.defer();
      });

      it("then resolution value is 'simple value'", function() {
        Promise(function(resolve) {
          resolve("simple value");
        })
        .then(function(x) {
          expect(x).toBe("simple value");
          result.resolve();
        });

        return result;
      });
    });


    describe("When a promise is rejected with the resolver function", function() {
      var result;
      beforeEach(function() {
        result = Promise.defer();
      });

      it("then rejection reason is 'bad value'", function() {
        Promise(function(resolve, reject) {
          reject("bad value");
        })
        .then(function() {}, function(x) {
          expect(x).toBe("bad value");
          result.resolve();
        });

        return result;
      });
    });


    it("Promise object return itself in a then call", function() {
      var promise1 = new Promise();

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
      var promise1 = Promise();

      var promise2 = promise1.then(function(x) {
        expect(x).toBe("Thenable returning thenable simple value");
        return Promise.resolved("first chain");
      });

      promise2.then(function(x) {
        expect(x).toBe("first chain");
      });

      promise1.resolve("Thenable returning thenable simple value");
      return promise2;
    });


    it("Thenable returning thenable", function() {
      var promise1 = Promise();

      var promise2 = promise1.then(function(x) {
        expect(x).toBe("Thenable returning thenable simple value");
        return Promise.resolved("first chain");
      });

      var promise3 = promise2.then(function(x) {
        expect(x).toBe("first chain");
        return Promise.resolved("second chain");
      });

      promise3.then(function(x) {
        expect(x).toBe("second chain");
      })
      .done(function (x) {
        expect(x).toBeUndefined();
        // returning a promise only affects then and not done
        return Promise.resolved("third chain");
      })
      .done(function (x) {
        expect(x).toBeUndefined();
      });

      promise1.resolve("Thenable returning thenable simple value");
      return promise3;
    });


    it("Long promise thenable chain", function() {
      var promise1 = new Promise();

      promise1.then(function(x) {
        expect(x).toBe("simple value");
        return Promise.resolved("tests1");
      })
      .then(function(x) {
        expect(x).toBe("tests1");
        return Promise.resolved("tests2");
      })
      .then(function(x) {
        expect(x).toBe("tests2");
        return Promise.resolved("tests3");
      })
      .then(function(x) {
        expect(x).toBe("tests3");
        return Promise.resolved("tests5");
      })
      .then(function(x) {
        expect(x).toBe("tests5");
      });

      return promise1.resolve("simple value");
    });


    it("Resolve with multiple object arguments", function() {

      var promise1 = new Promise();

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
      var dummy = { dummy: "dummy" };
      var promise1 = Promise();
      var promise2 = Promise();
      var isFulfilled = false;

      promise2.then(function onFulfilled() {
        expect(isFulfilled).toBe(true);
        promise1.resolve();
      });

      setTimeout(function () {
        promise2.resolve(dummy);
        isFulfilled = true;
      }, 50);

      return promise1;
    });


    it("then with a throw", function () {
      var promise1 = Promise(),
          promise3 = Promise();

      var promise2 = promise1.then(function(x) {
        return Promise.resolved("resolve promise2");
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
      var promise1 = Promise(),
          promise3 = Promise();

      var promise2 = promise1.then(function(x) {
        return Promise.rejected("resolve promise2");
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


    it("Simple $.ajax", function() {
      // Chain the ajax request and the promise
      return Promise.thenable($.ajax("json/array.json")).done(function(data, code, xhr) {
        // Make sure first param is the data
        expect(data.length).toBe(2);
        expect(data[0].name).toBe("Pablo");
        expect(data[1].name).toBe("Vincent");

        // Second param is the state code
        expect(code).toBe("success");

        // Third is the xhr
        expect(xhr.status).toBe(200);
        expect(xhr.then).toBeDefined();
        expect(xhr.readyState).toBe(4);
      });
    });


    it("factory resolve", function() {
      return Promise(function(resolve, reject) {
        resolve("Resolved");
      })
      .done(function(value) {
        expect(value).toBe("Resolved");
      });
    });


    it("factory reject", function() {
      var failed = false;
      return Promise(function(resolve, reject) {
        reject("Rejected");
      })
      .fail(function(value) {
        expect(value).toBe("Rejected");
        failed = true;
      })
      .then(function(value) {
      },
      function(value) {
        expect(value).toBe("Rejected");

        if (failed) {
          return Promise.resolved();
        }
      });
    });


    describe("When a promise is resolved with a rejected promise", function() {
      var result, promise;
      beforeEach(function() {
        result = Promise.defer();
        promise = Promise.rejected("rejection");
      });

      it("then promise rejection reason is 'rejection'", function() {
        Promise.thenable(promise).then(result.resolve, result.resolve);

        return result.then(function(val) {
          expect(val).toBe("rejection");
        });
      });

    });

  });

});
