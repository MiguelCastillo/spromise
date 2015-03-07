define(function(require/*, exports, module*/) {
  var Promise = require("spromise"),
      Timer   = require("tests/timer");

  // Disable debug traces in unit tests.
  Promise.debug = false;

  describe("Promises Suite", function() {

    describe("When promise is resolved with resolve interface", function() {
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


    describe("When promise is rejected with reject interface", function() {
      var result, promise1;
      beforeEach(function() {
        promise1 = new Promise();
        result = Promise.defer();
      });

      it("then rejection reason is 'bad value'", function() {
        promise1.then(function() {}, function(x) {
          expect(x).to.equal("bad value");
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
          expect(x).to.equal("simple value");
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
          expect(x).to.equal("bad value");
          result.resolve();
        });

        return result;
      });
    });


    describe("When promise resolves and returns itself", function() {
      var result, promise1, promise2;
      beforeEach(function() {
        result   = new Promise();
        promise1 = new Promise();
        promise2 = promise1.then(function() {
          return promise2;
        });
      });

      it("then throws exception that rejects promise", function() {
        // Make sure we fail with the proper exception
        promise2.fail(function(ex) {
          expect(ex instanceof TypeError).to.equal(true);
          result.resolve();
        });

        promise1.resolve("simple value");
        return result;
      });

      it("then promise is rejected with valid reason", function() {
        promise2.fail(function(ex) {
          expect(ex.message).to.equal("Resolution input must not be the promise being resolved");
          result.resolve();
        });

        promise1.resolve("simple value");
        return result;
      });
    });


    describe("When Promise.resolved returns promise", function() {
      var result, promise1;
      beforeEach(function() {
        result = new Promise();
        promise1 = new Promise();
      });

      describe("In a thennable sequence of two promises", function() {
        it("then final value is 'Second success'", function() {
          promise1.then(function(x) {
            expect(x).to.equal("First success");
            return Promise.resolve("Second success");
          })
          .then(function(x) {
            expect(x).to.equal("Second success");
            result.resolve();
          });

          promise1.resolve("First success");
          return result;
        });
      });

      describe("In a thennable sequence of three promises", function() {
        it("then final value is 'Third success'", function() {
          promise1.then(function(x) {
            expect(x).to.equal("First success");
            return Promise.resolve("Second success");
          })
          .then(function(x) {
            expect(x).to.equal("Second success");
            return Promise.resolve("Third success");
          })
          .then(function(x) {
            expect(x).to.equal("Third success");
            result.resolve();
          });

          promise1.resolve("First success");
          return result;
        });
      });


      describe("In a thennable sequence of eight promises", function() {
        it("then final value is 'Eight success'", function() {
          promise1.then(function(x) {
            expect(x).to.equal("First success");
            return Promise.resolve("Second success");
          })
          .then(function(x) {
            expect(x).to.equal("Second success");
            return Promise.resolve("Third success");
          })
          .then(function(x) {
            expect(x).to.equal("Third success");
            return Promise.resolve("Fourth success");
          })
          .then(function(x) {
            expect(x).to.equal("Fourth success");
            return Promise.resolve("Fifth success");
          })
          .then(function(x) {
            expect(x).to.equal("Fifth success");
            return Promise.resolve("Sixth success");
          })
          .then(function(x) {
            expect(x).to.equal("Sixth success");
            return Promise.resolve("Seventh success");
          })
          .then(function(x) {
            expect(x).to.equal("Seventh success");
            return Promise.resolve("Eigth success");
          })
          .then(function(x) {
            expect(x).to.equal("Eigth success");
            result.resolve();
          });

          promise1.resolve("First success");
          return result;
        });
      });
    });


    describe("When running thenable chain", function() {
      var result, promise1;
      beforeEach(function() {
        result = new Promise();
        promise1 = new Promise();
      });

      describe("with sequence of 2 successful promises", function() {
        it("then final value is 'Second success'", function() {
          var promise2 = promise1.then(function(x) {
            expect(x).to.equal("First success");
            return Promise.resolve("Second success");
          });

          promise2.then(function(x) {
            expect(x).to.equal("Second success");
            result.resolve();
          });

          promise1.resolve("First success");
          return result;
        });
      });
    });


    describe("When a promise is resolved with a rejected promise", function() {
      var result, promise;
      beforeEach(function() {
        result = Promise.defer();
        promise = Promise.reject("rejection");
      });

      it("then promise rejection reason is 'rejection'", function() {
        Promise.thenable(promise).then(null, function(x) {
          expect(x).to.equal("rejection");
          result.resolve();
        });

        return result;
      });
    });


    describe("When thenable chain does not return a value", function() {
      var result, promise1;
      beforeEach(function() {
        result = new Promise();
        promise1 = new Promise();
      });

      it("then the last value is 'undefined'", function() {
        promise1.then(function(x) {
          expect(x).to.equal("First success");
          return Promise.resolve("Second success");
        })
        .then(function(x) {
          expect(x).to.equal("Second success");
        })
        .then(function(x) {
          expect(x).to.equal(undefined);
        })
        .then(function (x) {
          expect(x).to.equal(undefined);
          result.resolve();
        });

        promise1.resolve("First success");
        return result;
      });

      it("then the last value is 'Third success", function() {
        promise1.then(function(x) {
          expect(x).to.equal("First success");
          return Promise.resolve("Second success");
        })
        .then(function(x) {
          expect(x).to.equal("Second success");
        })
        .then(function(x) {
          expect(x).to.equal(undefined);
        })
        .then(function (x) {
          expect(x).to.equal(undefined);
          return Promise.resolve("Third success");
        })
        .then(function(x) {
          expect(x).to.equal("Third success");
          result.resolve();
        });

        promise1.resolve("First success");
        return result;
      });
    });


    describe("When an exception is thrown", function () {
      var result, promise1;
      beforeEach(function() {
        result = new Promise();
        promise1 = new Promise();
      });

      it("then the thennable chain fails with exception TypeError", function() {
        promise1.then(function(x) {
          expect(x).to.equal("First success");
          return Promise.resolve("Second success");
        })
        .then(function(x) {
          expect(x).to.equal("Second success");
          throw new TypeError("First exception");
        })
        .then(function(x) {
          expect(x instanceof TypeError).to.equal(true);
        },function(ex) {
          expect(ex instanceof TypeError).to.equal(true);
          result.resolve();
        });

        promise1.resolve("First success");
        return result;
      });

      it("then the thennable chain fails with the appropriate message", function() {
        promise1.then(function(x) {
          expect(x).to.equal("First success");
          return Promise.resolve("Second success");
        })
        .then(function(x) {
          expect(x).to.equal("Second success");
          throw new TypeError("First exception");
        })
        .then(function(x) {
          expect(x instanceof TypeError).to.equal(true);
        })
        .fail(function(ex) {
          expect(ex).to.be.an('undefined');
          result.resolve();
        });

        promise1.resolve("First success");
        return result;
      });

      it("then the thennable chain returns rejected promises and throws exceptions", function() {
        promise1.then(function(x) {
          expect(x).to.equal("First success");
          return Promise.reject("First rejection");
        })
        .then(function() {}, function(x) {
          expect(x).to.equal("First rejection");
          throw new TypeError("First exception");
        })
        .then(function() {},function(ex) {
          expect(ex.message).to.equal("First exception");
          return Promise.reject("Second rejection");
        })
        .then(function() {}, function(x) {
          expect(x).to.equal("Second rejection");
          throw new TypeError("Second exception");
        })
        .then(null, function(x) {
          expect(x.message).to.equal("Second exception");
          result.resolve();
        });

        promise1.resolve("First success");
        return result;
      });
    });


    describe("When a promise resolution is delayed with the promise.delay interface", function() {
      var result, promise1;
      beforeEach(function() {
        result = new Promise();
        promise1 = new Promise();
      });

      describe("and the promise is resolved in 1 seconds", function() {
        it("then the promise waits 1 seconds before executing", function() {
          var timer = new Timer();

          promise1.delay(1000).then(function(message, extradata) {
            expect(Math.floor(timer.elapsed())).to.equal(1);
            expect(arguments.length).to.equal(2);
            expect(message).to.equal("Waited 1 seconds");
            expect(extradata).to.equal("extra data");
            result.resolve();
          });

          promise1.resolve("Waited 1 seconds", "extra data");
          return result;
        });
      });

      describe("and the promise is rejected", function() {
        it("then the promise does not wait before executing", function() {
          var timer = new Timer();

          promise1.delay(1000).then(null, function(message, extradata) {
            expect(Math.floor(timer.elapsed())).to.equal(0);
            expect(arguments.length).to.equal(2);
            expect(message).to.equal("Waited 1 seconds");
            expect(extradata).to.equal("extra data");
            result.resolve();
          });

          promise1.reject("Waited 1 seconds", "extra data");
          return result;
        });
      });

    });



    it("Resolve with multiple object arguments", function() {
      var promise1 = new Promise();

      promise1.done(function(_actor, _categories, _books) {
        expect(_actor).to.be.an('object');
        expect(_actor.firstName).to.equal("Dracula");
        expect(_actor.nickName).to.equal("Vampire");

        expect(_categories).to.be.an('object');
        expect(_categories.scifi).to.equal("Star Trek");
        expect(_categories.drama).to.equal("I am sam");

        expect(_books).to.be.an('array');
        expect(_books instanceof Array).to.equal(true);
        expect(_books[0]).to.equal("Harri Potter");
        expect(_books[1]).to.equal("Lord of The Rings");
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


    it("Simple $.ajax", function() {
      // Chain the ajax request and the promise
      return Promise.thenable($.ajax("json/array.json")).done(function(data, code, xhr) {
        // Make sure first param is the data
        expect(data.length).to.equal(2);
        expect(data[0].name).to.equal("Pablo");
        expect(data[1].name).to.equal("Vincent");

        // Second param is the state code
        expect(code).to.equal("success");

        // Third is the xhr
        expect(xhr.status).to.equal(200);
        expect(xhr.then).to.be.a('function');
        expect(xhr.readyState).to.equal(4);
      });
    });


  });

});
