var define, require;
(function() {
  var root = this;
  var modules = {};

  /**
   * Load the module by calling its factory with the appropriate dependencies, if at all possible
   */
  function load(mod) {
    if (typeof(mod.factory) === "function") {
      return require(mod.deps, mod.factory);
    }
    return mod.factory;
  }

  /**
   * Resolve dependencies
   */
  function resolve(deps, _module) {
    var i, length, dep, mod, result = [];

    for (i = 0, length = deps.length; i < length; i++) {
      dep = deps[i];
      mod = modules[dep] || _module[dep];

      if (!mod) {
        throw new TypeError("Module " + dep + " has not yet been loaded");
      }

      if (modules[dep]) {
        if (!mod.hasOwnProperty("code")) {
          mod.code = load(mod);
        }
        result[i] = mod.code;
      }
      else {
        result[i] = mod;
      }
    }

    return result;
  }

  /**
   * Interface to get a dependency and resolve any unresolved dependencies.
   */
  require = function require(deps, factory) {
    var name, result, _module = {}, _exports = {};
    _module.require = require;
    _module.exports = _exports;
    _module.module  = {exports: _exports};

    if (typeof(deps) === "string") {
      name = deps;
      deps = [deps];
    }

    // Resolve all dependencies
    if (deps.length) {
      deps = resolve(deps.slice(0), _module);
    }

    if (typeof(factory) !== "function") {
      return name ? modules[name].code : factory;
    }

    result = factory.apply(root, deps);
    return result === (void 0) ? _module.module.exports : result;
  };

  /**
   * Interface to register a module.  Only names defines can be used.
   */
  define = function define(name, deps, factory) {
    modules[name] = {
      name: name,
      deps: deps,
      factory: factory
    };
  };

}).call(this);
