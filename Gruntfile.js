//
// http://24ways.org/2013/grunt-is-not-weird-and-hard/
//
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      compile: {
        options: {
          "paths": {
          },
          name: "libs/js/almond",
          include: ["src/scpromise"],
          out: 'dist/scpromise-debug.js',
          optimize: 'none',
          preserveLicenseComments: true,
          skipModuleInsertion: false,
          wrap: {
            startFile: ['buildinfo/license.frag', 'buildinfo/module-start.frag'],
            endFile: 'buildinfo/module-end.frag'
          }
        }
      },
      minify: {
        options: {
          "paths": {
          },
          name: "libs/js/almond",
          include: ["src/scpromise"],
          out: 'dist/scpromise.js',
          optimize: 'uglify',
          preserveLicenseComments: true,
          skipModuleInsertion: false,
          wrap: {
            startFile: ['buildinfo/license.frag', 'buildinfo/module-start.frag'],
            endFile: 'buildinfo/module-end.frag'
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.registerTask('default', ['requirejs']);
};
