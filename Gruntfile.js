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
          keepalive: true,
          livereload: true,
          open: 'http://localhost:8050/tests/SpecRunner.html'
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

    browserify: {
      'build': {
        files: {
          'dist/spromise.js': ['src/spromise.js']
        },
        options: {
          browserifyOptions: {
            'detectGlobals': false,
            'standalone': 'spromise'
          }
        }
      }
    },

    uglify: {
      'build': {
        options: {
          sourceMap: true
        },
        files: {
          'dist/spromise.min.js': ['dist/spromise.js']
        }
      }
    },

    jshint: {
      all: {
        options: {
          jshintrc: true,
          reporter: require('jshint-stylish')
        },
        src: ['src/**/*.js', 'test/**/*.js', '*.js']
      }
    },

    watch: {
      tests: {
        files: ['tests/**/*', 'src/**/*.js'],
        options: {
          livereload: true
        },
      }
    },

    concurrent: {
      test: {
        tasks: ['connect:keepalive', 'watch:tests'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });


  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-concurrent");
  grunt.loadNpmTasks("grunt-mocha");

  grunt.registerTask("default", ["build"]);
  grunt.registerTask("build", ["jshint", "browserify:build", "uglify:build"]);
  grunt.registerTask("test", ["connect:test", "mocha:test"]);
  grunt.registerTask("serve", ["connect:keepalive"]);
  grunt.registerTask("dev", ["concurrent:test"]);
};
