define(["src/promise", "src/when"], function(promise, when) {

  describe("When", function() {

    it("with multiple arguments", function() {

      var promise1 = new promise();

      when(promise1).done(function(result) {
        var _actor = result[0];
        var _categories = result[1];
        var _books = result[2];

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


    it("$.ajax, undefined", function() {

      var promise1 = $.ajax("json/array.json");

      return when(promise1, undefined).done(function(response, _undefined) {
        expect(_undefined).toBeUndefined();

        // Make sure first param is the data
        expect(response[0].length).toBe(2);
        expect(response[0][0].name).toBe("Pablo");
        expect(response[0][1].name).toBe("Vincent");

        // Second param is the state code
        expect(response[1]).toBe("success");

        // Third is the xhr
        expect(response[2].status).toBe(200);
        expect(response[2].then).toBeDefined();
        expect(response[2].readyState).toBe(4);
      });
    });


    it("string", function() {
      return when("string").done(function(response) {
        expect(response).toBe("string");
      });
    });

    it("undefined", function() {
      return when((void 0)).done(function(response) {
        expect(response).toBeUndefined();
      });
    });

    it("Number", function() {
      return when(3.14).done(function(response) {
        expect(response).toBe(3.14);
      });
    });


    it("promise string", function() {
      var promise1 = promise.resolved("string");
      return when(promise1).done(function(response) {
        expect(response).toBe("string");
      });
    });

    it("promise undefined", function() {
      var promise1 = promise.resolved((void 0));
      return when(promise1).done(function(response) {
        expect(response).toBeUndefined();
      });
    });

    it("promise Number", function() {
      var promise1 = promise.resolved(3.14);
      return when(promise1).done(function(response) {
        expect(response).toBe(3.14);
      });
    });

  });

});
