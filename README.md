# grunt-easy-rpm
A [Grunt](http://gruntjs.com/) task to easily create [RPM](http://www.rpm.org/)
packages.

[![NPM](https://nodei.co/npm/grunt-easy-rpm.png?compact=true)](https://nodei.co/npm/grunt-easy-rpm/)

## Prerequisites
This plugin requires Grunt `~0.4.5` and, at minimum, the `rpmdevtools`.
The RPM tools can be installed on most unix-like systems, including Mac OSX.

### Linux
```shell
sudo yum install rpmdevtools rpmlint
```

### Mac OSX
Installation can be done from source either manually or with
[Homebrew](http://brew.sh).  See [these notes regarding installation with Homebrew](http://timperrett.com/2014/03/23/enabling-rpmbuild-on-mac-osx/).

## Getting Started
If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out
the [Getting Started](http://gruntjs.com/getting-started) guide.  The guide
covers creating a [Gruntfile](http://gruntjs.com/sample-gruntfile), installing
and using plugins. Once you're familiar with the process, install `easy-rpm`:

```shell
npm install grunt-easy-rpm --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile
with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-easy-rpm');
```

## The "easy_rpm" task

### Overview
In your project's Gruntfile, add a section named `easy_rpm` to the data object
passed into `grunt.initConfig()`:

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Usage Examples
#### Basic Usage
In this example, the default options are used for most of the fields. Each file
is copied individually with the directory structure being preserved.

Note that the `files` group(s) **must** reside in targets, not the `options`
definition.  In the example below, the target name is 'release'.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: "1",
      buildArch: "x86_64"
    },
    release: {
      files: [
        {src: "output/file1.js", dest: "/target/dir"}, //Target = /target/dir/output/file1.js
        {src: "output/file2.js", dest: "/target/dir"}, //Target = /target/dir/output/file2.js
        {src: "output/file3.js", dest: "/target/dir"}, //Target = /target/dir/output/file3.js
      ]
    },
  },
})
```

#### Using CWD (current working directory)
The `cwd` attribute is used to define the working directory for an individual
or set of files.  When this attribute is set, the `cwd` is removed from the
resulting target path.  Any directory structure below the `cwd` is preserved.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: "1",
      buildArch: "x86_64"
    },
    release: {
      files: [
        {cwd: "output", src: "output/file1.js", dest: "/target/dir"}, //Target = /target/dir/file1.js
        {cwd: "output", src: "output/sub1/file2.js", dest: "/target/dir"}, //Target = /target/dir/sub1/file2.js
        {cwd: "output", src: "output/sub2/file3.js", dest: "/target/dir"}, //Target = /target/dir/sub2/file3.js
      ]
    },
  },
})
```

#### Using Wildcards
File lists can also be generated using wildcards whose syntax is defined by
[node-glob](https://github.com/isaacs/node-glob).  Note that this can also be
paired with the above-mentioned `cwd` attribute.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: "1",
      buildArch: "x86_64"
    },
    release: {
      files: [
        {src: "output/**", dest: "/target/dir"}, //Target = All files & directory structure under /output folders
      ]
    },
  },
})
```

#### Excluding Files
Files can be excluded from packaging by adding them to the `excludeFiles` list.
The node-glob wildcard syntax can be used to specify exclusions as well.  Note
that the paths to exclude apply to the source file paths.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: "1",
      buildArch: "x86_64"
    },
    release: {
      files: [
        {src: "routes/**/*", dest: "/target/dir"},
        {src: "views/**/*", dest: "/target/dir"}
      ],
      excludeFiles: [
        "**/index.html",
        "routes/fileA.js"
      ]
    },
  },
})
```

#### Setting Target Mode, Owner, and Group
Each target file can have it's mode, owner, and group set by specifying these
values in the file elements.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: "1",
      buildArch: "x86_64"
    },
    release: {
      files: [
        {src: "output/file1.js", dest: "/target/dir", mode: "755"},
        {src: "output/file2.js", dest: "/target/dir", mode: "o+x", owner: "mysql"},
        {src: "output/file3.js", dest: "/target/dir", owner: "admin", group: "admin"},
        {src: "output2/**", dest: "/target/dir", mode: "644"}, //Works with wildcard as well
      ]
    },
  },
})
```

#### Setting %doc and %config
Target files can be marked as documentation or configuration files by setting
`doc` and `config` to `'true'` as needed.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: "1",
      buildArch: "x86_64"
    },
    release: {
      files: [
        {src: "output/file1.js", dest: "/target/dir", mode: "755"},
        {doc:'true', cwd:'output', src: "README", dest: "/target/dir", mode: "o+x", owner: "mysql"},
        {config:'true', cwd:'output', src: "mypackage.conf", dest: "/etc/mypackage", owner: "admin", group: "admin"}
      ]
    },
  },
})
```

### Options
Note that some options inherit their values from your `package.json`.  These
options are marked by 'Inherits from `package.json`'.

#### options.name
Type: `String`
Default value: `'noname'`

A string value that is used to set at the name of your RPM package. This value
is also used in the construction of the RPM file name.

'Inherits from `package.json`'.

#### options.summary
Type: `String`
Default value: `'No Summary'`

A string value that is used to set as the summary text of your RPM package.

#### options.description
Type: `String`
Default value: `'No Description'`

A string value that is used to set as the description of your RPM package.

'Inherits from `package.json`'.

#### options.version
Type: `String`
Default value: `'0.1.0'`

A string value that is used to set as the version of your RPM package. This
value is also used in the construction of the RPM file name.

'Inherits from `package.json`'.

#### options.release
Type: `String`
Default value: `'1'`

A string value that is used to set as the release of your RPM package. This
value is also used in the construction of the RPM file name.

#### options.license
Type: `String`
Default value: `'MIT'`

A string value that is used to specify the license type of your RPM package.

#### options.vendor
Type: `String`
Default value: `'Vendor'`

A string value that is used to set as the Vendor property of your RPM package.

#### options.group
Type: `String`
Default value: `'Development/Tools'`

A string value that is used to specify the group of your RPM package.

#### options.buildArch
Type: `String`
Default value: `'noarch'`

A string value that is used to set specify the target architecture of your RPM
package. This value is also used in the construction of the RPM file name.

#### options.prefix
Type: `String`
Default value: `undefined`

This will specify the relocatable root of the package so that it may be
relocated by the user at install time.  The manual entry for the
[prefix tag](http://www.rpm.org/max-rpm/s1-rpm-reloc-prefix-tag.html) explains
the use case quite well.

#### options.url
Type: `String`
Default Value: `""`

A URL to the project homepage or documentation of the project. Defined in the
[spec-file specification](http://www.rpm.org/wiki/PackagerDocs/Spec#URL:andPackager:Tags).

#### options.changelog
Type: `Array` or `Function`
Default Value: `""`

An array of changelog lines or a function called to create an array of lines containing
the changelog. This will add the `%changelog` to the spec-file.

#### options.dependencies
Type: `Array<String>`
Default value: `[]`

An array of packages that this package depends on (e.g. `["nodejs >= 0.10.22"]`).
This is mapped to the `Requires` property in spec file.

#### options.preInstallScript
Type: `Array<String>`
Default value: `[]`

An array of commands to be executed before the installation. Each element in
the array represents a command.

#### options.postInstallScript
Type: `Array<String>`
Default value: `[]`

An array of commands to be executed after the installation. Each element in
the array represents a command.

#### options.preUninstallScript
Type: `Array<String>`
Default value: `[]`

An array of commands to be executed before uninstallation. Each element in
the array represents a command.

#### options.postUninstallScript
Type: `Array<String>`
Default value: `[]`

An array of commands to be executed after uninstallation. Each element in
the array represents a command.

#### options.tempDir
Type: `String`
Default value: `'tmp-'+<auto_gen_id>`

Sets the temporary path name that stores the structure that required by the
`rpmbuild` command.

#### options.postPackageCreate
Type: `String` | `function(rpmPath, rpmFilename)`
Default value: `null`

When a string, sets where to copy the rpm after it has been created.

When given a function, the function is executed when the package has been
created and provided with two arguments: the path and filename of the newly
created package.

#### options.keepTemp
Type: `Boolean`
Default value: `false`

A boolean value to tell the script to keep the temp folder after the package is built. Probably can be used for problem investigation.

#### options.rpmDestination
Type: `String`
Default value: `.`

Location where the resulting RPM should be placed, `.` by default.

#### options.quoteFilePaths
Type: `Boolean`
Default value: `true`

Toggles quoting the target file paths in the RPM spec.  It is generally best
to keep this setting to true.

