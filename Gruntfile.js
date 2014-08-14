module.exports = function (grunt) {

  var banner = [
    '//     <%= pkg.name %> <%= pkg.version %>',
    '//     <%= pkg.homepage %>',
    '//     (c) 2014 <%= pkg.author %>',
    '//     <%= pkg.name %> may be freely distributed under the MIT license.'
  ].join('\n');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    rig: {
      compile: {
        options: {
          banner: banner + '\n\n'
        },
        files: {
          'build/tcomb.js': [
            'src/tcomb.js'
          ]
        }
      }
    },
    jshint: {
      options: {
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        'build/tcomb.js'
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
  grunt.registerTask('default', ['rig', 'jshint', 'test', 'watch']);
  grunt.registerTask('build', ['rig', 'jshint', 'uglify']);
};