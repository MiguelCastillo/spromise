define(function(require, exports, module) {
    var spromise = require('spromise');

    exports.pending = function () {
        var deferred = spromise.defer();

        return {
            promise: deferred.promise,
            fulfill: deferred.resolve,
            reject: deferred.reject
        };
    };

    exports.fulfilled = spromise.resolved;
    exports.rejected = spromise.rejected;
});
