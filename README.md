spromise [![Build Status](https://travis-ci.org/MiguelCastillo/spromise.png?branch=master)](https://travis-ci.org/MiguelCastillo/spromise)
=========

Small Promise, is a lightweight promise library with some opinions on promise a+ spec.


API
========

1. then - interface that takes in as a first parameter an onResolved callback and as a second parameter an onRejected callback.  Great for chaining promises and controlling the flow of execution in a chain of promises.
2. done - takes an onResolved callback that gets called when the promise is successfully resolved. If the promise is resolved with data, that will then be passed in as parameters to onResolved.
3. fail - takes an onRejected callback that gets called when the promise is rejected. If the promise was rejected with a reason(s), that will then be passed in as parameters to onRejected.
4. always - takes a callback that is always called, either when the promise is rejected or resolved.
5. resolve - interface to resolve the promise. This will trigger all currently registered onResolved callbacks and any future ones to be called.  Any data passed into the resolve interface will then be passed into each callback as parameters.
6. reject - interface to reject the promise. As resolve, this will trigger all currently registered onRejected callbacks and any future ones to be called.  Any reason(s) passed into the reject interface will then be passed into each callback as paramters.
7. state - interface to get the current state of the promise.  It can either be pending, resolved, or rejected.  Please use spromise.states to access enum types to get a more meaningful read on the integer that states() returns.
8. when - which creates and returns a promise. when also takes in N arguments, which control when the promise returned is resolved.  Passing in promises as arguments will cause when to wait for all the input promises to resolve.  If one fails, everything fails.  None promise objects can also be passed in, in which case they are immediately available as resolved.  When is very useful when needing to synchronize a group of asynchronouse and synchronous operations.
