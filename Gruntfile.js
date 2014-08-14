module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    rig: {
      compile: {
        options: {
          banner: '/* Compiled : <%= grunt.template.today("yyyy-mm-dd HH:MM") %> */\n'
        },
        files: {
          'build/tcomb.js': [
            'src/tcomb.js'
          ]
        }
      }
    },
    jshint: {
      all: [
        'Gruntfile.js',
        'build/tcomb.js',
        'src/*.js',
        'test/*.js'
      ]
    },
    mochaTest: {
      all: {
        src: ['test/**/*.js']
      }
    },
    uglify: {
      all: {
        options: {
          beautify: false,
          sourceMap: 'build/tcomb.min.map.js'
        },
        files: {
          'build/tcomb.min.js': ['build/tcomb.js']
        }
      }
    },
    watch: {
      options: {
        interrupt: true,
        debounceDelay: 250
      },
      files: [
        'src/*',
        'test/*'
      ],
      tasks: [
        'rig',
        'jshint',
        'test'
      ]
    }
  });

  grunt.loadNpmTasks('grunt-rigger');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['rig', 'jshint', 'test', 'uglify']);
  grunt.registerTask('build', ['rig', 'uglify']);
};