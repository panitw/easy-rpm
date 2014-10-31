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
                files: [
                    '**/*.js',
                    'test/**/*.spec'
                ],
                tasks: ['mochaTest']
            }
        },

        // An example use of the plugin.
        easy_rpm: {
            options: {
                summary: 'Easily build RPM packages.',
                description: 'A Grunt plugin for easily configuring and ' +
                    'building RPM packages.',
                group: 'Development/Tools',
                release: 1,
                license: 'MIT',
                vendor: null,
                defaultAttributes: {
                    mode: 644
                }
            },
            release: {
                // Again, these are just examples, this package is not meant for
                // actual distribution as an RPM!
                files: [{
                    cwd: 'tasks',
                    src: '*.js',
                    dest: '/opt/easyrpm',
                    owner: 'raddude'
                }, {
                    cwd: 'tasks',
                    src: 'lib/*.js',
                    dest: '/opt/easyrpm',
                    group: 'coolrunnings'
                }]
            }
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-mocha-test');

    // Handle watch events and setup the mochaTest task options accordingly.
    var defaultTestSrc = grunt.config('mochaTest.test.src');
    grunt.event.on('watch', function(action, filepath) {
        grunt.config('mochaTest.test.src', defaultTestSrc);
        if (filepath.match('test/*.js')) {
            grunt.config('mochaTest.test.src', filepath);
        }
    });

    // Aliases
    grunt.registerTask('format', ['jsbeautifier']);
    grunt.registerTask('test', ['mochaTest']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);

};
