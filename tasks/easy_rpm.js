/*
 * grunt-easy-rpm
 * https://github.com/panitw/easy-rpm
 *
 * Copyright (c) 2013 Panit Wechasil
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs'),
    path = require('path'),
    shortid = require('shortid'),
    chalk = require('chalk'),
    _ = require('lodash'),
    SpecFile = require('./lib/spec'),
    specValidator = require('./lib/spec-validator'),
    specWriter = require('./lib/spec-writer');

// Loads the package definition (if it exists) and picks specific properties
// to expose.  These properties are later merged into the options object as
// default values.
function loadPackageProperties(grunt) {
    var packageFile = 'package.json';

    if (grunt.file.exists(packageFile)) {
        return _.pick(grunt.file.readJSON(packageFile), [
            'name',
            'version',
            'description'
        ]);
    }

    return {};
}

// Sets the `prop` property on options to the concatenation of that property
// from both options and data, if both exist.  Otherwise, if either exist
// exclusively, that array will be set to the options.  When neither exist,
// nothing is done to the options object.
function concatOptionDataArrays(options, data, prop) {
    if (!_.has(options, prop) && !_.has(data, prop)) {
        return;
    }

    var combined = [];
    if (_.isArray(options[prop])) {
        combined = combined.concat(options[prop]);
    }
    if (_.isArray(data[prop])) {
        combined = combined.concat(data[prop]);
    }
    options[prop] = combined;
}

function preserveCopy(grunt, srcpath, destpath, options) {
    grunt.file.copy(srcpath, destpath, options);
    try {
        fs.chmodSync(destpath, fs.statSync(srcpath).mode);
    } catch (e) {
        throw grunt.util.error('Error setting permissions of "' +
            destpath + '" file.', e);
    }
}

function _checkNotifyPackageInherit(grunt, pkg, options, propName) {
    if (_.has(pkg, propName) && !_.has(options, propName)) {
        grunt.log.writelns(chalk.gray('[Notice] Property inheritance from ' +
            'package.json: "' + propName +
            '" will be inherited by the ' +
            'options with value "' + pkg[propName] + '".'));
    }
}

function _defaultOptionNotice(grunt, propName, defaultVal) {
    grunt.log.writelns(chalk.gray('[Notice] Default property set: ' +
        '`' + propName + '` will be set by default to "' +
        defaultVal + '".'));
}

// Applies properties from the options object to the spec object.  This is
// done explicitly to mitigate pollution from the options object and allow for
// notification of default assignments.
function applySpecSettings(grunt, options, spec) {
    spec.tags.name = options.name || spec.tags.name;

    if (!_.has(options, 'version')) {
        _defaultOptionNotice(grunt, 'version', '0.0.0');
    }
    spec.tags.version = options.version || '0.0.0';

    if (!_.has(options, 'release')) {
        _defaultOptionNotice(grunt, 'release', '1');
    }
    spec.tags.release = options.release || '1';

    if (!_.has(options, 'buildArch')) {
        _defaultOptionNotice(grunt, 'buildArch', 'noarch');
    }
    spec.tags.buildArch = options.buildArch || 'noarch';

    if (!_.has(options, 'description')) {
        _defaultOptionNotice(grunt, 'description', 'No Description');
    }
    spec.tags.description = options.description || 'No Description';

    if (!_.has(options, 'summary')) {
        _defaultOptionNotice(grunt, 'summary', 'No Summary');
    }
    spec.tags.summary = options.summary || 'No Summary';

    if (!_.has(options, 'license')) {
        _defaultOptionNotice(grunt, 'license', 'MIT');
    }
    spec.tags.license = options.license || 'MIT';

    spec.tags.epoch = options.epoch || spec.tags.epoch;
    spec.tags.distribution = options.distribution || spec.tags.distribution;

    if (!_.has(options, 'vendor')) {
        _defaultOptionNotice(grunt, 'vendor', 'Vendor');
    }
    spec.tags.vendor = options.vendor || 'Vendor';

    spec.tags.url = options.url || spec.tags.url;

    if (!_.has(options, 'group')) {
        _defaultOptionNotice(grunt, 'group', 'Development/Tools');
    }
    spec.tags.group = options.group || 'Development/Tools';

    spec.tags.packager = options.packager || spec.tags.packager;

    if (_.has(options, 'defines')) {
        spec.addDefines.apply(spec, options.defines);
    }

    // To maintain backwards compatability with the older API, the arrays
    // `dependencies` and `requires` are synonymous.
    if (_.has(options, 'dependencies')) {
        // TODO deprecate post 1.5.0
        grunt.log.writelns(chalk.gray('[Notice] Deprecation warning: ' +
            'the use of "dependencies" is deprecated in favour of ' +
            'the RPM "requires" and "conflicts" tags.'));
        spec.addRequirements.apply(spec, options.dependencies);
    }
    if (_.has(options, 'requires')) {
        spec.addRequirements.apply(spec, options.requires);
    }
    if (_.has(options, 'buildRequires')) {
        spec.addBuildRequirements.apply(spec, options.buildRequires);
    }
    if (_.has(options, 'provides')) {
        spec.addProvides.apply(spec, options.provides);
    }

    if (options.autoReq === false) {
        spec.tags.autoReq = options.autoReq;
    }
    if (options.autoProv === false) {
        spec.tags.autoProv = options.autoProv;
    }

    if (options.hasOwnProperty('excludeArchs')) {
        spec.addExcludeArchs.apply(spec, options.excludeArchs);
    }
    if (options.hasOwnProperty('exclusiveArchs')) {
        spec.addExclusiveArchs.apply(spec, options.exclusiveArchs);
    }

    if (options.hasOwnProperty('excludeOS')) {
        spec.addExcludeOS.apply(spec, options.excludeOS);
    }
    if (options.hasOwnProperty('exclusiveOS')) {
        spec.addExclusiveOS.apply(spec, options.exclusiveOS);
    }

    spec.tags.prefix = options.prefix || spec.tags.prefix;
    spec.tags.buildRoot = options.buildRoot || spec.tags.buildRoot;

    if (options.hasOwnProperty('sources')) {
        spec.addSources.apply(spec, options.sources);
    }
    if (options.hasOwnProperty('noSources')) {
        spec.addNoSources.apply(spec, options.noSources);
    }

    if (options.hasOwnProperty('patches')) {
        spec.addPatches.apply(spec, options.patches);
    }
    if (options.hasOwnProperty('noPatches')) {
        spec.addNoPatches.apply(spec, options.noPatches);
    }

    // Add scripts from options.
    if (options.hasOwnProperty('prepScript')) {
        spec.addPrepScripts.apply(spec, options.prepScript);
    }
    if (options.hasOwnProperty('buildScript')) {
        spec.addBuildScripts.apply(spec, options.buildScript);
    }
    if (options.hasOwnProperty('checkScript')) {
        spec.addCheckScripts.apply(spec, options.checkScript);
    }
    if (options.hasOwnProperty('cleanScript')) {
        spec.addCleanScripts.apply(spec, options.cleanScript);
    }

    if (options.hasOwnProperty('installScript')) {
        spec.addInstallScripts.apply(spec, options.installScript);
    }
    if (options.hasOwnProperty('preInstallScript')) {
        spec.addPreInstallScripts.apply(spec, options.preInstallScript);
    }
    if (options.hasOwnProperty('postInstallScript')) {
        spec.addPostInstallScripts.apply(spec, options.postInstallScript);
    }
    if (options.hasOwnProperty('preUninstallScript')) {
        spec.addPreUninstallScripts.apply(spec, options.preUninstallScript);
    }
    if (options.hasOwnProperty('postUninstallScript')) {
        spec.addPostUninstallScripts.apply(spec, options.postUninstallScript);
    }

    if (options.hasOwnProperty('verifyScript')) {
        spec.addVerifyScripts.apply(spec, options.verifyScript);
    }

    // Add the default file attributes from options.
    if (options.hasOwnProperty('defaultAttributes')) {
        spec.setDefaultAttributes(options.defaultAttributes);
    }

    // Add the changelogs.
    if (options.hasOwnProperty('changelog')) {
        var changelog;
        if (_.isFunction(options.changelog)) {
            changelog = options.changelog();
        } else if (_.isArray(options.changelog)) {
            changelog = options.changelog;
        }
        spec.addChangelogs.apply(spec, changelog);
    }
}

module.exports = function(grunt) {
    grunt.registerMultiTask('easy_rpm', 'Easily create RPM packages.', function() {
        var pkg = loadPackageProperties(grunt),
            defaults = {
                tempDir: "tmp-" + shortid.generate(),
                rpmDestination: ".",
                keepTemp: false,
                quoteFilePaths: true
            },
            rpmStructure = [
                "BUILD", "BUILDROOT", "RPMS", "SOURCES", "SPECS", "SRPMS"
            ],
            spec = new SpecFile(),
            done = this.async(),
            options, tmpDir, buildRoot, i;


        // Check the loaded package properties and issue notices if they are
        // not already specified in the options - they will be inherited by
        // the options object in that case.
        _checkNotifyPackageInherit(grunt, pkg, this.options(), 'name');
        _checkNotifyPackageInherit(grunt, pkg, this.options(), 'version');
        _checkNotifyPackageInherit(grunt, pkg, this.options(), 'description');

        // Apply options and defaults in the following order of precedence:
        //    gruntInit > package > defaults
        // Options on the left take precedence over those on the right.
        options = this.options(_.defaults(pkg, defaults));

        // Allow defines to be set in both the options and target configs.
        concatOptionDataArrays(options, this.data, 'defines');

        // Setup paths for storing the RPM directory structure and source
        // file destination (BUILDROOT).
        tmpDir = path.resolve(options.tempDir);
        buildRoot = path.resolve(tmpDir + "/BUILDROOT/");

        // Assign the options to the spec file object.
        applySpecSettings(grunt, options, spec);

        // If the tmpDir exists (probably from previous build), delete it
        // first.
        if (grunt.file.exists(tmpDir)) {
            grunt.log.writeln(chalk.blue('Deleting old temporary directory.'));
            grunt.file.delete(tmpDir);
        }

        // Create RPM build directory structure.
        grunt.log.writelns(
            chalk.blue('Creating RPM directory structure at: ') + tmpDir);
        for (i = 0; i < rpmStructure.length; i++) {
            grunt.file.mkdir(tmpDir + '/' + rpmStructure[i]);
        }

        // Expand the files to exclude.
        var filesToExclude = [];
        if (this.data.excludeFiles) {
            filesToExclude = grunt.file.expand(this.data.excludeFiles)
                .map(function(fileName) {
                    return path.normalize(fileName);
                });
        }

        // Copy sources to the BUILDROOT directory (dest).
        grunt.log.writeln(
            chalk.blue('Copying files into RPM directory structure.'));
        this.files.forEach(function(file) {
            // All files must specify both 'src' and 'dest'.
            if (!file.hasOwnProperty('src') || !file.hasOwnProperty('dest')) {
                grunt.log.error('All file entries must have both \'src\' ' +
                    'and \'dest\' property.');
                done(false);
            }

            file.src.filter(function(srcPath) {
                var actualSrcPath = srcPath,
                    copyTargetPath,
                    fileSpec;

                // Check whether to ignore this file.
                if (filesToExclude.indexOf(actualSrcPath) >= 0) {
                    return false;
                }

                // If the CWD option is specified, look for each file from
                // CWD path.
                if (file.cwd) {
                    actualSrcPath = path.join(file.cwd, srcPath);
                }

                copyTargetPath = path.join(buildRoot, file.dest, srcPath);
                fileSpec = {
                    path: path.join(file.dest, srcPath),
                    doc: file.doc || false,
                    config: file.config || false,
                    noreplace: file.noreplace || false,
                    dir: file.dir || false,
                    mode: file.mode || null,
                    user: file.user || file.owner || null,
                    group: file.group || null
                };

                // If this is a file, copy it to the BUILDROOT directory.
                // If it is a directory, mark it as a %dir before adding it
                // to the spec.
                if (!grunt.file.isDir(actualSrcPath)) {
                    grunt.verbose.writeln("Copying: " + actualSrcPath);
                    preserveCopy(grunt, actualSrcPath, copyTargetPath);
                } else {
                    grunt.verbose.writeln("Creating: " + actualSrcPath);
                    grunt.file.mkdir(copyTargetPath);
                    fileSpec.dir = true;
                }

                // Add the file or directory to the spec.
                spec.addFiles(fileSpec);
            });
        });

        // Validate the state of the spec file.  If there are errors, exit
        // the task unsuccessfully.  Print all warnings and errors.
        grunt.log.writeln(chalk.blue('Validating spec.'));
        var validationResults = specValidator(spec);
        if (validationResults.warnings.length > 0) {
            for (i = 0; i < validationResults.warnings.length; i++) {
                grunt.log.writeln(chalk.yellow('Warning: ' +
                    validationResults.warnings[i]));
            }
        }
        if (validationResults.errors.length > 0) {
            for (i = 0; i < validationResults.errors.length; i++) {
                grunt.log.writeln(chalk.red('Error: ' +
                    validationResults.errors[i]));
            }
        }
        if (validationResults.valid === false) {
            done(false);
            return;
        }

        // Generate and write out the spec file.
        var pkgName = spec.tags.name +
            '-' + spec.tags.version +
            '-' + spec.tags.release +
            '.' + spec.tags.buildArch,
            specFilepath = path.join(options.tempDir, "SPECS",
                pkgName + ".spec");

        grunt.log.writeln(chalk.blue('Generating RPM spec file.'));
        specWriter(spec, function(out, err) {
            grunt.file.write(specFilepath, out);
        });

        // Build the RPM package.
        grunt.log.writeln(chalk.blue('Building the RPM package.'));

        // Spawn rpmbuild tool.
        var buildCmd = 'rpmbuild';

        var buildArgs = [
            '-bb',

            // In order to build out the RPM into our specified directory, we
            // must append a --define directive to rpmbuild that indicates where
            // the top level of the build is.
            '--define',
            '_topdir ' + tmpDir,
            '-vv',
            '--buildroot',
            buildRoot,
            specFilepath
        ];

        grunt.util.spawn({
            cmd: buildCmd,
            args: buildArgs
        }, function(error, result, code) {
            if (error || code) {
                grunt.log.writeln(chalk.red(buildCmd + ' failed, errors:'));
                grunt.log.writeln(chalk.red(String(result)));
                done(false);
                return;
            }

            // Copy the build output to the current directory.
            var outputFilename = spec.tags.name +
                '-' + spec.tags.version +
                '-' + spec.tags.release +
                '.' + spec.tags.buildArch + '.rpm',
                outputFilepath = path.join(tmpDir, 'RPMS',
                    spec.tags.buildArch, outputFilename),
                rpmDestination = path.resolve(options.rpmDestination);

            grunt.log.writelns(chalk.blue('Copying RPM package to: ') +
                rpmDestination);
            grunt.file.copy(outputFilepath, path.join(rpmDestination,
                outputFilename));

            // Execute the postPackageCreate callback.
            if (options.hasOwnProperty('postPackageCreate')) {
                var rpmPath = path.join(tmpDir, 'RPMS', spec.tags.buildArch);

                if (_.isString(options.postPackageCreate)) {
                    // TODO Deprecate post 1.5.0
                    grunt.log.writeln(chalk.gray(
                        'Deprecation warning: use the rpmDestination ' +
                        'option instead of supplying a string to ' +
                        'postPackageCreate.'
                    ));

                    if (grunt.file.isDir(options.postPackageCreate)) {
                        var destinationFile = path.join(
                            options.postPackageCreate,
                            outputFilename);
                        // FIXME Why is the rpm filename being joined to itself?
                        grunt.file.copy(
                            path.join(outputFilename, outputFilename),
                            destinationFile);
                        grunt.log.writelns(
                            'Copied output RPM package to: ' + destinationFile);
                    } else {
                        grunt.fail.warn('Destination path is not a directory');
                    }
                } else if (_.isFunction(options.postPackageCreate)) {
                    options.postPackageCreate(rpmPath, outputFilename);
                }
            }

            // Delete temporary directory.
            if (!options.keepTemp) {
                grunt.log.writelns(chalk.blue(
                    'Deleting RPM directory structure at: ') + tmpDir);
                grunt.file.delete(tmpDir);
            }

            done();
        });
    });
};
