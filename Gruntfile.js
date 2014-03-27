//
// http://24ways.org/2013/grunt-is-not-weird-and-hard/
//
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    requirejs: {
      compile: {
        options: {
          "paths": {
          },
          name: "lib/js/almond",
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
          name: "lib/js/almond",
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
  grunt.registerTask("default", ["requirejs"]);
  grunt.registerTask("travis", ["requirejs"]);
};
