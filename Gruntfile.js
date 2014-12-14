//
// http://24ways.org/2013/grunt-is-not-weird-and-hard/
//
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
    }
  });


  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-mocha");

  grunt.registerTask("default", ["requirejs"]);
  grunt.registerTask("build", ["requirejs"]);
  grunt.registerTask("test", ["connect:test", "mocha:test"]);
  grunt.registerTask("server", ["connect:keepalive"]);
};
