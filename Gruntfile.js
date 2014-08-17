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
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
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
        'default'
      ]
    },

    emu: {
      'README.md': 'build/tcomb.js'
    }

  });

  // plugins
  grunt.loadNpmTasks('grunt-rigger');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // tasks
  grunt.registerMultiTask('emu', function () {
    var emu = require('emu'),
      fs = require('fs'),
      source = fs.readFileSync(this.data, 'utf8');

    fs.writeFileSync(this.target, emu.getComments(source));
  });
  grunt.registerTask('doc', ['rig', 'emu']);
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['rig', 'test', 'watch']);
  grunt.registerTask('build', ['rig', 'jshint', 'test', 'uglify', 'emu']);
};