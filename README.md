spromise [![Build Status](https://travis-ci.org/MiguelCastillo/spromise.png?branch=master)](https://travis-ci.org/MiguelCastillo/spromise)
=========

spromise (Small Promise), is an implementation of the promise <a href="https://promisesaplus.com/">A+ spec</a>.  It is designed to be lightweight, performant, and per spec, interoperable with other promise implementations such as jQuery's <a href="http://api.jquery.com/category/deferred-object/">deferred</a>.


## API

### Static methods

#### spromise as a constructor
Creates a promise instance.  It can take in a function as its single optional parameter, which is called when the promise is created.  The callback function receives two parameters, a function to fulfill the promise and a function to reject the promise.

Resolve a promise
``` javascript
// Resolve
spromise(function(resolve, reject){
  resolve("Yes, we are resolving this");
})
.done(function(value) {
  // Will print "Yes, we are resolving this"
  console.log(value);
});
```

Reject a promise
``` javascript
// Reject
spromise(function(resolve, reject){
  reject("booo");
})
.fail(function(value) {
  // Will print "booo"
  console.log(value);
});
```

#### spromise.defer
Creates and returns a new promise to be resolved in the future.

- returns a new promise

``` javascript
var spromise = require("spromise");

// Create a deferred promise
var promise = spromise.defer();

promise.done(function(data) {
  console.log(data);
});

promise.resolve("Deferred");
```

#### spromise.resolve
Returns a promise instance.  If the input is an instance of spromise, then that's returned as is. If the input is a thenable object or function, a new promise is returned with the current/future value of the thenable. And if the value is anything else, then a new promise that is already fulfilled with the value(s) is returned.

- returns a promise

``` javascript
var spromise = require("spromise");
var promise = spromise.resolve("Resolved promise");

promise.done(function(data) {
  console.log(data);
});
```

#### spromise.reject
Returns a new promise that is rejected with the reason passed in. The reason can be any data type.

- returns a new rejected promise


``` javascript
var spromise = require("spromise");
var promise = spromise.reject("Rejected promise");

promise.fail(function(data) {
  console.log(data);
});
```

#### when
creates and returns a promise. <code>when</code> takes in N arguments that control when the <code>when</code> promise is resolved.  Passing in promises as arguments will cause <code>when</code> to wait for all the input promises to resolve.  If one fails, everything fails.  None promise objects can also be passed in, in which case they are immediately resolved.  <code>when</code> is very useful when synchronizing a group of asynchronous and synchronous operations.

<p>Synchronizing multiple $.ajax request</p>
``` javascript
spromise.when($.ajax("json/array.json"), $.ajax("json/object.json")).done(function($array, $object) {
  // Will print the XHR objects $array and $object
  console.log($array, $object);
});
```

#### all
similar to `when` except that the input parameters are in the form of a single array.

<p>Synchronizing multiple $.ajax request</p>
``` javascript
spromise.all([$.ajax("json/array.json"), $.ajax("json/object.json")]).done(function($array, $object) {
  // Will print the XHR objects $array and $object
  console.log($array, $object);
});
```

### Instance methods

#### then
method to register callbacks to be called when the promise is fulfilled or rejected.  The first parameter is the callback to be called when the promise is fulfilled, and the second parameter is the callback to be called when the promise is rejected.

This method is generally used for creating chains of promises.  If the fulfilled or rejected callbacks return anything, then that value is returned to the subsequent promise in a thenable chain.  See examples in the Examples section.

- returns a new promise

``` javascript
var spromise = require("spromise");

// Fulfilled promise
var promise = spromise.resolve("Fulfilled promise");

// Register callbacks
promise.then(fulfilled, rejected);

function fulfilled(data) {
  console.log(err);
}

function rejected(err) {
  // Does not get called because the promise was fulfilled.
}
```

``` javascript
var spromise = require("spromise");

// Reject promise
var promise = spromise.reject("Rejected promise");

// Register callbacks
promise.then(fulfilled, rejected);

function fulfilled(data) {
  // Does not get called because the promise was rejected.
}

function rejected(err) {
  console.log(err);
}
```

#### done
method takes a callback as its only parameter that gets called when the promise is fulfilled. If the promise is fulfilled with a value(s), that will get passed in as parameters to the callback.

- returns promise (itself)

``` javascript
var spromise = require("spromise");
var promise = spromise.resolve("Resolved promise", "extra value");

promise.done(function(data1, data2) {
  console.log(data1, data2);
});
```

#### fail and catch
method takes a callback as its only parameter that gets called when the promise is rejected. If the promise is rejected with a reason(s), that will then get passed in as parameters to the callback.

- Note: fail and catch are exactly the same methods, and they both exist to provide alternatives for folks used to one vs the other.

- returns promise (itself)

``` javascript
var spromise = require("spromise");
var promise = spromise.reject("Reason...");

promise.fail(function(reason) {
  console.log(reason);
});

promise.catch(function(reason) {
  console.log(reason);
});
```

#### always
method to register a callback that gets called when the promise is either fulfilled or rejected.

``` javascript
var spromise = require("spromise");
var promise = spromise.resolve("Fulfilled promise");

promise.always(function(data) {
  console.log(data);
});
```

``` javascript
var spromise = require("spromise");
var promise = spromise.reject("Reason...");

promise.always(function(reason) {
  console.log(reason);
});
```

#### resolve
method to fulfill the promise. This will cause all registered callbacks (current as well as future ones) to be called with the resolved value.

``` javascript
var spromise = require("spromise");

// Create a deferred promise
var promise = spromise.defer();

promise.done(function(data) {
  console.log(data);
});

promise.resolve("Deferred");
```

#### reject
method to reject the promise. This will cause all registered callbacks (current as well as future ones) to be called with the reason for rejecting the promise.

``` javascript
var spromise = require("spromise");

// Create a deferred promise
var promise = spromise.defer();

promise.fail(function(data) {
  console.log(data);
});

promise.reject("Deferred");
```

#### state
method to get the current state of the promise.  It can either be pending, fulfilled, or rejected.  Please use <code>spromise.states</code> for a more meaningful translation of the value returned.  E.g. <code>if (promise1.state() === spromise.states.pending) {}</code>.


### Instance Properties

#### promise
property that contains methods to read the value and status of the promise.  This is useful if you want to create a promise and return the read only version of it.  The methods in this object are `then`, `always`, `done`, `catch`, `fail`, `notify`, `state`.


``` javascript
var spromise = require("spromise");

// Create a deferred promise
var promise = spromise.defer();

// Print out the promise property
console.log(promise.promise);
```


### Install

#### bower

```
$ bower install spromise
```

#### npm

```
$ npm install spromise
```

### Downloads

Genral purpose (Browser, Node):
* <a href="dist/spromise.js">dist/spromise.js</a> - minified
* <a href="dist/spromise-debug.js">dist/spromise-debug.js</a>

For inline inclusion in your AMD code:
* <a href="dist/spromise-lib.js">dist/spromise-lib.js</a> - minified
* <a href="dist/spromise-lib-debug.js">dist/spromise-lib-debug.js</a>

### Build

Run the following command in the terminal:

```
$ npm install
```

### Tests

#### Unit tests

Run the following commands in the terminal:

```
$ npm install
$ grunt test
```

#### Compliance unit tests:

Run the following commands in the terminal:
```
$ npm install
$ npm test
```

### Compliance notes

With the exception of 2.2.5, which states that onFullfilled/onRejected must not be called with "this", all tests for compliance pass.<br>
The reason spromise was left non compliant for this particular item is to faithfully handle "context" configured in jQuery ajax requests.

##### Test results:

<pre>
  868 passing (14s)
  4 failing

  1) 2.2.5 `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value). strict mode fulfilled:
     Error: timeout of 200ms exceeded
      at null.<anonymous> (/Users/mcastillo/Projects/promises-tests/node_modules/mocha/lib/runnable.js:165:14)
      at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)

  2) 2.2.5 `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value). strict mode rejected:
     Error: timeout of 200ms exceeded
      at null.<anonymous> (/Users/mcastillo/Projects/promises-tests/node_modules/mocha/lib/runnable.js:165:14)
      at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)

  3) 2.2.5 `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value). sloppy mode fulfilled:
     Error: timeout of 200ms exceeded
      at null.<anonymous> (/Users/mcastillo/Projects/promises-tests/node_modules/mocha/lib/runnable.js:165:14)
      at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)

  4) 2.2.5 `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value). sloppy mode rejected:
     Error: timeout of 200ms exceeded
      at null.<anonymous> (/Users/mcastillo/Projects/promises-tests/node_modules/mocha/lib/runnable.js:165:14)
      at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)
</pre>
