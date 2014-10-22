/*
 * grunt-easy-rpm
 * https://github.com/panitw/easy-rpm
 *
 * Copyright (c) 2013 Panit Wechasil
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: ['pkg'],
                commit: true,
                commitMessage: 'Release %VERSION%',
                commitFiles: ['package.json'],
                createTag: true,
                tagName: '%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
            }
        },

        jsbeautifier: {
            options: {
                js: {
                    braceStyle: 'collapse',
                    breakChainedMethods: false,
                    e4x: false,
                    evalCode: false,
                    indentChar: ' ',
                    indentLevel: 0,
                    indentSize: 4,
                    indentWithTabs: false,
                    jslintHappy: false,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    spaceBeforeConditional: true,
                    spaceInParen: false,
                    unescapeStrings: false,
                    wrapLineLength: 0
                }
            },
            files: [
                '**/*.js',
                '!node_modules/**/*'
            ]
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'tasks/**/*.js',
                'test/**/*.js'
            ]
        },

        mochaTest: {
          test: {
            options: {
              reporter: 'dot',
              clearRequireCache: true
            },
            src: ['test/**/*.js']
          }
        },

        watch: {
          js: {
            options: {
              spawn: false
            },
            files: '**/*.js',
            tasks: ['mochaTest']
          }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-mocha-test');

    // Handle watch events and setup the mochaTest task options accordingly.
    var defaultTestSrc = grunt.config('mochaTest.test.src');
    grunt.event.on('watch', function(action, filepath) {
      grunt.config('mochaTest.test.src', defaultTestSrc);
      if (filepath.match('test/')) {
        grunt.config('mochaTest.test.src', filepath);
      }
    });

    // Aliases
    grunt.registerTask('format', ['jsbeautifier']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'mochaTest']);

};
