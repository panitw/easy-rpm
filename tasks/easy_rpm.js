/*
 * grunt-easy-rpm
 * https://github.com/panitw/easy-rpm
 *
 * Copyright (c) 2013 Panit Wechasil
 * Licensed under the MIT license.
 */

'use strict';

var shortid = require("shortid"),
  path = require("path");

function writeSpecFile(grunt, files, options) {

    var pkgName = options.name + "-" + options.version + "-" + options.buildArch,
      specFilepath = path.join(options.tempDir, "SPECS", pkgName + ".spec"),
      b = [],
      i = 0;
    
    b.push("%define   _topdir " + path.resolve(options.tempDir));
    b.push("");
    b.push("Name: "+options.name);
    b.push("Version: "+options.version);
    b.push("Release: "+options.release);
    b.push("Group: "+options.group);
    b.push("Summary: "+options.summary);
    b.push("Group: "+options.group);
    b.push("License: "+options.license);
    b.push("BuildArch: "+options.buildArch);
    if (typeof options.autoReqProv !== "undefined") {
        b.push("AutoReqProv: "+options.autoReqProv);
    }

    if (options.dependencies.length > 0) {
      b.push("Requires: " + options.dependencies.join(","));
    }

    b.push("");
    b.push("%description");
    b.push(options.description);
    b.push("");
    b.push("%files");
    for (i=0;i<files.length;i++) {
       b.push(files[i]);
    }
    b.push("");
    b.push("%pre");
    for (i=0; i<options.preInstallScript.length; i++) {
      b.push(options.preInstallScript[i]);
    }
    b.push("");
    b.push("%post");
    for (i=0; i<options.postInstallScript.length; i++) {
      b.push(options.postInstallScript[i]);
    }
    b.push("");
    b.push("%preun");
    for (i=0; i<options.preUninstallScript.length; i++) {
      b.push(options.preUninstallScript[i]);
    }
    b.push("");
    b.push("%postun");
    for (i=0; i<options.postUninstallScript.length; i++) {
      b.push(options.postUninstallScript[i]);
    }

    var specFileContent = b.join("\n");
    grunt.file.write(specFilepath, specFileContent);

    return specFilepath;
}


module.exports = function(grunt) {

  grunt.registerMultiTask("easy_rpm", "Easily create RPM package to install files/directories", function() {

    var pkg = grunt.file.readJSON('package.json'),
        defaults = {
          name: "noname",
          summary: "No Summary",
          description: "No Description",
          version: "0.1.0",
          release: "1",
          license: "MIT",
          vendor: "Vendor",
          group: "Development/Tools",
          buildArch: "noarch",
          dependencies: [],
          preInstallScript: [],
          postInstallScript: [],
          preUninstallScript: [],
          postUninstallScript: [],
          tempDir: "tmp-"+shortid.generate(),
          rpmDestination: ".",
          keepTemp: false,
          quoteFilePaths: true
        },
        // Apply options and defaults in the following order of precedence:
        //    gruntInit > package > defaults
        // Where options on the left take precedence over those on the right.
        options = this.options(grunt.util._.defaults(pkg, defaults)),
        tmpDir = path.resolve(options.tempDir),
        buildRoot = tmpDir + "/BUILDROOT/",
        rpmStructure = ["BUILD","BUILDROOT","RPMS","SOURCES","SPECS","SRPMS"],
        done = this.async();

    //If the tmpDir exists (probably from previous build), delete it first
    if (grunt.file.exists(tmpDir)) {
      grunt.log.writeln("Deleting old tmp dir");
      grunt.file.delete(tmpDir);
    }

    //Create RPM build folder structure
    grunt.log.writeln("Creating RPM folder structure at "+tmpDir);
    for (var i=0;i<rpmStructure.length;i++) {
      grunt.file.mkdir(tmpDir+"/"+rpmStructure[i]);
    }

    //Files to exclude
    var filesToExclude = [];
    if (this.data.excludeFiles) {
      filesToExclude = grunt.file.expand(this.data.excludeFiles).map(function (fileName) {
        return path.normalize(fileName);
      });
    }

    //Copy source to the BUILDROOT folder
    grunt.log.writeln("Copying files to tmp directory");
    var fileBasket = [];
    this.files.forEach(function(file) {

      //All file entry should have both "src" and "dest"
      if (!file.src || !file.dest) {
        grunt.log.error("All file entries must have both 'src' and 'dest' property");
        done(false);
      }

      file.src.filter(function(srcPath) {
        var actualSrcPath = srcPath;

        //check whether to ignore this file        
        if (filesToExclude.indexOf(actualSrcPath) >= 0) {
          return false;
        }

        //If the CWD option is specified, look for each file from CWD path
        if (file.cwd) {
          actualSrcPath = path.join(file.cwd, srcPath);
        }

        var copyTargetPath = path.join(buildRoot, file.dest, srcPath);
        var actualTargetPath = path.join(file.dest, srcPath);

        //Copy file to the BUILDROOT directory and store the actual target path
        //for generating the SPEC file
        if (!grunt.file.isDir(actualSrcPath)) {
          grunt.verbose.writeln("Copying: " + actualSrcPath);
          grunt.file.copy(actualSrcPath, copyTargetPath);

          //Generate actualTargetPath and save to filebasket for later use
          var actualTargetPath = path.join(file.dest, srcPath);
          if (options.quoteFilePaths) {
            actualTargetPath = "\"" + actualTargetPath + "\"";
          }

          if (file.config) {
            fileBasket.push("%config " + actualTargetPath);
          } else if (file.doc) {
            fileBasket.push("%doc " + actualTargetPath);
          } else {
            fileBasket.push(actualTargetPath);
          }

          //If "mode" property is defined, then add the post install script to change
          //the mode of the file
          if (file.mode) {
            options.postInstallScript.push("chmod "+file.mode+" "+actualTargetPath);
          }

          //If "owner" property is defined, then add the post install script to change
          //the owner of the file
          if (file.owner) {
            options.postInstallScript.push("chown "+file.owner+" "+actualTargetPath);
          }

          //If "group" property is defined, then add the post install script to change
          //the group of the file
          if (file.group) {
            options.postInstallScript.push("chgrp "+file.group+" "+actualTargetPath);
          }
        }
        else {
           // save to filebasket for later use
           grunt.verbose.writeln("Creating directory: " + actualSrcPath);
           grunt.file.mkdir(copyTargetPath);
           fileBasket.push('%dir \"' + actualTargetPath + '\"');
        }
      });
    });

    //Generate SPEC file
    grunt.log.writeln("Generating RPM spec file");
    var specFilepath = writeSpecFile(grunt, fileBasket, options);

    //Build RPM
    grunt.log.writeln("Building RPM package");

    //spawn rpmbuilt tool
    var buildCmd = "rpmbuild";
    var buildArgs = [
      "-bb",
      "--buildroot",
      buildRoot,
      specFilepath
    ];

    grunt.log.writeln("Execute: "+buildCmd+" "+buildArgs.join(" "));

    grunt.util.spawn({
      cmd: buildCmd,
      args: buildArgs,
    }, function(error, result, code) {
      if (!error) {
        //Copy the build output to the current directory
        var outputFilename = options.name+"-"+options.version+"-"+options.release+"."+options.buildArch+".rpm";
        var outputFilepath = path.join(tmpDir, "RPMS", options.buildArch, outputFilename);
        var rpmDestination = path.resolve(options.rpmDestination);
        grunt.log.writeln("Copy output RPM package to: " + rpmDestination);
        grunt.file.copy(outputFilepath, path.join(rpmDestination, outputFilename));
      }

      //Execute the postPackageCreate callback
      if (options.postPackageCreate){
        var rpmFilename = options.name + "-" + options.version + "-" + options.release + "." + options.buildArch + ".rpm";
        var rpmPath = path.join(tmpDir, "RPMS", options.buildArch);

        if (typeof options.postPackageCreate === "string"){
          if (grunt.file.isDir(options.postPackageCreate)){
            var destinationFile = path.join(options.postPackageCreate, rpmFilename);
            grunt.file.copy(path.join(rpmFilename,rpmFilename) , destinationFile);
            grunt.log.writeln("Copied output RPM package to: " + destinationFile);
          }
          else {
            grunt.fail.warn('Destination path is not a directory');
          }
        }
        else if (typeof options.postPackageCreate === "function"){
          options.postPackageCreate(rpmPath, rpmFilename);
        }
      }      

      //Delete temp folder
      if (!options.keepTemp) {
        grunt.log.writeln("Deleting tmp folder "+tmpDir);
        grunt.file.delete(tmpDir);
      }

      if (error) {
        grunt.log.error(result);
        grunt.warn("Failed while building RPM", code);
      }

      done();
    });
  });
};
