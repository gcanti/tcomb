module.exports = function (grunt) {

  var banner = [
    '//     <%= pkg.name %> <%= pkg.version %>',
    '//     <%= pkg.homepage %>',
    '//     (c) 2014 <%= pkg.author %>',
    '//     <%= pkg.name %> may be freely distributed under the MIT license.'
  ].join('\n');

  grunt.initConfig({
    
    pkg: grunt.file.readJSON('package.json'),
    
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'index.js'
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
          'build/tcomb.min.js': ['index.js']
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
        'default'
      ]
    },

    emu: {
      'README.md': 'index.js'
    }

  });

  // plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // tasks
  grunt.registerMultiTask('emu', function () {
    var emu = require('emu'),
      fs = require('fs'),
      source = fs.readFileSync(this.data, 'utf8');

    fs.writeFileSync(this.target, emu.getComments(source));
  });
  grunt.registerTask('doc', ['emu']);
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['test', 'watch']);
  grunt.registerTask('build', ['jshint', 'test', 'uglify', 'emu']);
};