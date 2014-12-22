//
// http://24ways.org/2013/grunt-is-not-weird-and-hard/
//

/* jshint node:true */
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    connect: {
      test: {
        options: {
          port: 8052,
          hostname: 'localhost'
        }
      },
      keepalive: {
        options: {
          port: 8050,
          host: "*",
          keepalive: true
        }
      }

    },
    mocha: {
      test: {
        options: {
          log: true,
          logErrors: true,
          reporter: "Spec",
          run: false,
          timeout: 10000,
          urls: ["http://localhost:8052/tests/SpecRunner.html"]
        }
      }
    },
    requirejs: {
      compile: {
        options: {
          "paths": {
          },
          name: "src/samdy",
          include: ["src/spromise"],
          out: "dist/spromise-debug.js",
          optimize: "none",
          preserveLicenseComments: true,
          skipModuleInsertion: false,
          wrap: {
            startFile: ["buildinfo/license.frag", "buildinfo/module-start.frag"],
            endFile: "buildinfo/module-end.frag"
          }
        }
      },
      minify: {
        options: {
          "paths": {
          },
          name: "src/samdy",
          include: ["src/spromise"],
          out: "dist/spromise.js",
          optimize: "uglify",
          preserveLicenseComments: true,
          skipModuleInsertion: false,
          wrap: {
            startFile: ["buildinfo/license.frag", "buildinfo/module-start.frag"],
            endFile: "buildinfo/module-end.frag"
          }
        }
      },
      lib: {
        options: {
          "paths": {
          },
          include: ["src/spromise"],
          out: "dist/spromise-lib-debug.js",
          optimize: "none",
          preserveLicenseComments: true,
          skipModuleInsertion: false,
          wrap: {
            startFile: ["buildinfo/license.frag"],
          }
        }
      },
      libmin: {
        options: {
          "paths": {
          },
          include: ["src/spromise"],
          out: "dist/spromise-lib.js",
          optimize: "uglify",
          preserveLicenseComments: true,
          skipModuleInsertion: false,
          wrap: {
            startFile: ["buildinfo/license.frag"]
          }
        }
      }
    },
    jshint: {
      all: [
        "Gruntfile.js",
        "src/**/*.js",
        "tests/**/*.js"
      ],
      options: {
        reporter: require("jshint-stylish"),
        jshintrc: true
      },
    }
  });


  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-mocha");

  grunt.registerTask("default", ["requirejs"]);
  grunt.registerTask("build", ["requirejs"]);
  grunt.registerTask("test", ["connect:test", "mocha:test"]);
  grunt.registerTask("lint", ["jshint"]);
  grunt.registerTask("server", ["connect:keepalive"]);
};
