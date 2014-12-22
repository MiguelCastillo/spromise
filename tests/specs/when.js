define(function(require/*, exports, module*/) {
  var promise = require("src/promise"),
      when    = require("src/when");

  describe("When", function() {

    it("no arguments", function() {
      return when().done(function() {
        expect(arguments.length).to.equal(0);
      });
    });

    it("literal string", function() {
      return when("string").done(function(response) {
        expect(response).to.equal("string");
      });
    });

    it("literal undefined", function() {
      return when((void 0)).done(function(response) {
        expect(response).to.equal(undefined);
      });
    });

    it("Number value", function() {
      return when(3.14).done(function(response) {
        expect(response).to.equal(3.14);
      });
    });


    it("promise string", function() {
      var promise1 = promise.resolve("string");
      return when(promise1).done(function(response) {
        expect(response).to.equal("string");
      });
    });

    it("promise undefined", function() {
      var promise1 = promise.resolve((void 0));
      return when(promise1).done(function(response) {
        expect(response).to.equal(undefined);
      });
    });

    it("promise Number", function() {
      var promise1 = promise.resolve(3.14);
      return when(promise1).done(function(response) {
        expect(response).to.equal(3.14);
      });
    });

    it("two promises, one pending one rejected", function() {
      var deferred1 = promise.defer();
      var deferred2 = promise.reject("reject promise2");
      var result    = promise.defer();

      when(deferred1, deferred2).then(function() {
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
      var result    = promise.defer();

      when(deferred1, 3.14).then(function(result1, result2) {
        expect(result1).to.equal("resolve promise");
        expect(result2).to.equal(3.14);
        result.resolve();
      });

      return result;
    });


    it("with multiple arguments", function() {
      var promise1 = new promise();

      when(promise1).done(function(result) {
        var _actor = result[0];
        var _categories = result[1];
        var _books = result[2];

        expect(_actor).to.be.an('object');
        expect(_actor.firstName).to.equal("Dracula");
        expect(_actor.nickName).to.equal("Vampire");

        expect(_categories).to.be.an('object');
        expect(_categories.scifi).to.equal("Star Trek");
        expect(_categories.drama).to.equal("I am sam");

        expect(_books).to.be.an('array');
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

      var books = [
        "Harri Potter",
        "Lord of The Rings"
      ];

      return promise1.resolve(actor, categories, books);
    });


    it("$.ajax", function() {

      var promise1 = $.ajax("json/array.json");

      return when(promise1).done(function(response) {
        var data = response[0],
            code = response[1],
            xhr  = response[2];

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


    it("$.ajax, undefined", function() {

      var promise1 = $.ajax("json/array.json");

      return when(promise1, undefined).done(function(response, _undefined) {
        expect(_undefined).to.equal(undefined);

        // Make sure first param is the data
        expect(response[0].length).to.equal(2);
        expect(response[0][0].name).to.equal("Pablo");
        expect(response[0][1].name).to.equal("Vincent");

        // Second param is the state code
        expect(response[1]).to.equal("success");

        // Third is the xhr
        expect(response[2].status).to.equal(200);
        expect(response[2].then).to.be.a('function');
        expect(response[2].readyState).to.equal(4);
      });
    });

  });

});
