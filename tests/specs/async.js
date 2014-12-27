define(function(require/*, exports, module*/) {
  var async   = require("src/async"),
      Promise = require("src/promise");

  describe("async suite:", function() {

    describe("When calling async with no arguments", function() {
      it("then arguments.length is 0", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments.length).to.equal(0);
            resolve();
          }
          async(cb.apply.bind(cb, this));
        });
      });
    });


    describe("When calling async with 1 argument", function() {
      it("then arguments.length is 1", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments.length).to.equal(1);
            resolve();
          }
          async(cb.apply.bind(cb, this, ["hello world"]));
        });
      });

      it("then arguments[0] is 'hello world'", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal("hello world");
            resolve();
          }
          async(cb.apply.bind(cb, this, ["hello world"]));
        });
      });

      it("then arguments[0] is 1", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal(1);
            resolve();
          }
          async(cb.apply.bind(cb, this, [1]));
        });
      });

      it("then arguments[0] is '1'", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal('1');
            resolve();
          }
          async(cb.apply.bind(cb, this, ['1']));
        });
      });
    });


    describe("When calling async with 3 arguments", function() {
      it("then arguments.length is 3", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments.length).to.equal(3);
            resolve();
          }
          async(cb.apply.bind(cb, this, ["hello", "world", "test"]));
        });
      });

      it("then arguments is 'hello world test'", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal("hello");
            expect(arguments[1]).to.equal("world");
            expect(arguments[2]).to.equal("test");
            resolve();
          }
          async(cb.apply.bind(cb, this, ["hello", "world", "test"]));
        });
      });

    });

  });


  describe("async.delay suite:", function() {

    describe("When calling async.delay with no arguments", function() {
      it("then arguments.length is 0", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments.length).to.equal(0);
            resolve();
          }
          async.delay(cb, 0);
        });
      });
    });


    describe("When calling async.delay with 1 argument", function() {
      it("then arguments.length is 1", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments.length).to.equal(1);
            resolve();
          }
          async.delay(cb, 0, ["hello world"]);
        });
      });

      it("then arguments is 'hello world'", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal("hello world");
            resolve();
          }
          async.delay(cb, 0, ["hello world"]);
        });
      });

      it("then arguments is 1", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal(1);
            resolve();
          }
          async.delay(cb, 0, [1]);
        });
      });

      it("then arguments is '1'", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal('1');
            resolve();
          }
          async.delay(cb, 0, ['1']);
        });
      });
    });


    describe("When calling async.delay with 3 arguments", function() {
      it("then arguments.length is 3", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments.length).to.equal(3);
            resolve();
          }
          async.delay(cb, 0, ["hello", "world", "test"]);
        });
      });

      it("then arguments is 'hello world test'", function() {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal("hello");
            expect(arguments[1]).to.equal("world");
            expect(arguments[2]).to.equal("test");
            resolve();
          }
          async.delay(cb, 0, ["hello", "world", "test"]);
        });
      });

    });


    describe("When calling async.delay with apply.bind", function () {
      it("then bound arguments are not changed", function () {
        return new Promise(function(resolve) {
          function cb() {
            expect(arguments[0]).to.equal("hello");
            expect(arguments[1]).to.equal("world");
            expect(arguments[2]).to.equal("test");
            resolve();
          }
          async.delay(cb.apply.bind(cb, this, ["hello", "world", "test"]), 0, ["nope", "nope", "nope"]);
        });
      });
    });
  });

});
