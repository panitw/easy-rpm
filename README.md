# grunt-easy-rpm
A [Grunt](http://gruntjs.com/) task to easily create [RPM](http://www.rpm.org/)
packages.

[![NPM](https://nodei.co/npm/grunt-easy-rpm.png?compact=true)](https://nodei.co/npm/grunt-easy-rpm/)

If you are interested in participating in the project, consult the Contributing
section below.

## Prerequisites
This plugin requires Grunt `~0.4.5` and, at minimum, the `rpmdevtools`.
The RPM tools can be installed on most unix-like systems, including Mac OSX.

### Linux
```shell
sudo yum install rpmdevtools
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
grunt.loadNpmTasks("grunt-easy-rpm");
```

## rpmlint
You can lint your generated RPMs and SPEC files with `rpmlint` to ensure you
meet the requirements for your target distribution(s).  It is worth noting
that, while `rpmlint` will warn you of problems in your RPM or SPEC file, these
do not necessarily mean that they are not usable.  For those who are not about
to distribute their packages via the official package repositories, many of the
warnings `rmplint` produces will be irrelevant (for example, Fedora requires a
changelog in the SPEC file as part of their guidelines but RPMs without a
changelog in the SPEC should install just fine).
[`rpmlint` project page](http://rpmlint.sourceforge.net/)

# The "easy_rpm" task

## Overview
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
    }
  }
})
```

If you are including [Node.js Addons](https://nodejs.org/api/addons.html),
rpmbuild will add several require statements that you probably don't need.
Consider setting [autoReq and autoProv](#autoreq-autoprov) to false.

## Usage Examples
### Basic Usage
In this example, the default options are used for most of the fields. Each file
is copied individually with the directory structure being preserved.

Note that the `files` group(s) **must** reside in targets, not the `options`
definition.  In the example below, the target name is 'release'.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      // These are the bare-minimum values required to create a properly named
      // RPM package.  The plugin does contain defaults for these if you omit
      // them, and will notify you when this occurs.
      name: "mypackage",
      version: "1.0.0",
      release: 1,
      buildArch: "x86_64"
    },
    release: {
      // Sets up the target source files as:
      // /target/dir/output/file1.js
      // /target/dir/output/file2.js
      // /target/dir/output/file3.js
      files: [
        {src: "output/file1.js", dest: "/target/dir"},
        {src: "output/file2.js", dest: "/target/dir"},
        {src: "output/file3.js", dest: "/target/dir"}
      ]
    }
  }
})
```

### Using CWD (current working directory)
The `cwd` attribute is used to define the working directory for an individual
or set of files.  When this attribute is set, `src` entries are relative to the
`cwd` path . This task uses the [Grunt implementation of file expansion](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically)
which may be of use as additional information.

Given the directory structure:
```
local/
  text/
    a.txt
    b.txt
  image/
    c.png
    d.png
```

And the configuration:
```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: 1,
      buildArch: "x86_64"
    },
    release: {
      files: [
        {src: '*.txt', dest: '/opt/text', cwd: 'local/text'},
        {src: 'image/*.png', dest: '/opt'}
      ]
    }
  }
})
```

Results in the following RPM structure:
```
/opt/
  text/
    a.txt
    b.txt
  image/
    c.png
    d.png
```

### Using Wildcards
File lists can also be generated using wildcards whose syntax is defined by
[node-glob](https://github.com/isaacs/node-glob).  Note that this can also be
paired with the above-mentioned `cwd` attribute.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: 1,
      buildArch: "x86_64"
    },
    release: {
      files: [
        {src: "output/**", dest: "/target/dir"}
      ]
    }
  }
})
```

### Excluding Files
Files can be excluded from packaging by adding them to the `excludeFiles` list.
The node-glob wildcard syntax can be used to specify exclusions as well.  Note
that the paths to exclude apply to the source file paths.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: 1,
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
    }
  }
})
```

### Setting File Mode, User (Owner), and Group, %attr
Each target file can have it's `mode`, `user`, and `group` set by specifying
these values in the file elements.  Note that, per the RPM SPEC file
specifications, values for `mode` must be numeric.  Additionally, `user` and
`group` cannot be UIDs (numeric) but must be names (alphanumeric).

Note that, for backwards compatibility, setting `owner` is equivalent to
setting the `user` property.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: 1,
      buildArch: "x86_64"
    },
    release: {
      files: [
        {src: "output/file1.js", dest: "/target/dir", mode: "755"},
        {src: "output/file2.js", dest: "/target/dir", mode: "700", user: "mysql"},
        {src: "output/file3.js", dest: "/target/dir", user: "admin", group: "admin"},
        {src: "output2/**", dest: "/target/dir", mode: "644"}
      ]
    }
  }
})
```

### Setting Default Attributes, %defattr
You can set the default attributes for all files and directories in the package
by defining the `defaultAttributes` property in the options.  This property
should be an object which takes any or all of the following properties:
`mode`, `user`, `group`, `dirMode`.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: 1,
      buildArch: "x86_64",
      defaultAttributes: {
        mode: 644,
        user: 'mysql',
        group: 'mysql',
        dirMode: 644
      }
    },
    release: {
      files: [
        {src: "output/file1.js", dest: "/target/dir"},
        {src: "output/file2.js", dest: "/target/dir"}
      ]
    }
  }
})
```

### Setting %doc, %config, %config(noreplace), and %dir
Target files can be marked as documentation or configuration files by setting
`doc`, `config`, `noreplace`, and `dir` to `true` as needed. `noreplace` supersedes `config`. For more detailed information
on how these directives operate, consult the RPM manual.

```js
grunt.initConfig({
  easy_rpm: {
    options: {
      name: "mypackage",
      version: "1.0.0",
      release: 1,
      buildArch: "x86_64"
    },
    release: {
      files: [
        {doc: true, cwd:"output", src: "README", dest: "/target/dir"},
        {config: true, cwd: "output", src: "mypackage.conf", dest: "/etc/mypackage", owner: "admin", group: "admin"}
      ]
    }
  }
})
```

## SPEC Validations
This task performs some minor validations on the options provided that result
in SPEC file generation.  These validations are meant to be distribution
agnostic; they will only give warnings for possibly problematic settings or
deviations from the baseline RPM specification.  Errors are issued for options
that will definitely cause problems when building or using the RPM.  It should
be noted that the task will fail if any errors occur during validation.

## Options
There are many options available since RPM has many configurable aspects.
Three properties from the `package.json` (if it exists) are inherited by the
options if they do not specify them.  These are: `name`, `version`, and
`description`.  If these are not specified in the options, the task will notify
you of the inheritance when run.

For backwards compatibility, some properties are provided with default values
if they are not specified in the options.  When these defaults are used, the
task will notify you of them when run.

### name
`String` (default: `'noname'`)

Used to set at the name tag in your RPM package and also used in the
construction of the RPM file name.


### version
`String` (default: `'0.0.0'`)

Used to set the version tag in your RPM package and also used in the
construction of the RPM file name.

### release
`String` | `Number` (default: `1`)

Used to set the release tag in your RPM package and also used in the
construction of the RPM file name.

### buildArch
`String` (default: `'noarch'`)

A string value that is used to set specify the target architecture of your RPM
package. This value is also used in the construction of the RPM file name.

### summary
`String` (default: `'No Summary'`)

Used to set the summary tag in your RPM package.

### description
`String` (default: `'No Description'`)

Used to set the description directive section in your RPM package.

### license
`String` (default: `'MIT'`)

Used to specify the license tag in your RPM package.

### vendor
`String` (default: `'Vendor'`)

Used to set the vendor tag in your RPM package.

### group
`String` (default: `'Development/Tools'`)

Used to specify the group tag in your RPM package.

### prefix
`String`

This will specify the relocatable root of the package so that it may be
relocated by the user at install time.  The manual entry for the
[prefix tag](http://www.rpm.org/max-rpm/s1-rpm-reloc-prefix-tag.html) explains
the use case quite well.

### url
`String`

A URL to the project homepage or documentation of the project. Defined in the
[spec-file specification](http://www.rpm.org/wiki/PackagerDocs/Spec#URL:andPackager:Tags).

### changelog
`Array` | `Function`

An array of changelog lines or a function called to create an array of lines
containing the changelog. This will add the changelog directive block to the
spec-file.

_NOTE:_ You will still have to adhere to the changelog syntax to use this
properly for more information read the
[Fedora packaging guidelines on Changelogs](http://fedoraproject.org/wiki/Packaging:Guidelines#Changelogs).

### defines
`Array<String>`

An array of arbitrary `%define` statements to be added to the RPM SPEC file.
Note that this property can be set on both the `options` and target
configurations.  When set on `options`, the define values will be added to all
targets.

Setting the option as so:
```js
{
  defines: [
    '_binary_filedigest_algorithm 1',
    '_binary_payload w9.gzdio'
  ]
}
```

Will add the following to the SPEC file:
```
%define _binary_filedigest_algorithm 1
%define _binary_payload w9.gzdio
```

### requires
`Array<String|Object>`

An array of packages that this package depends on (e.g.
`["nodejs >= 0.10.22", "libpng"]`). Can also include an object
to map dependencies for scriptlets, e.g.
`["nodejs >= 0.10.22", {"post": ["%{systemd_post_requires}"]}]`

### buildRequires
`Array<String>`

An array of packages that this package depends on to build (e.g.
`["systemd <= 222", "libpng-devel"]`).

### provides
`Array<String>`

An array of virtual packages that this package provides.

### conflicts
`Array<String>`

An array of packages that this package conflicts with (e.g.
`["cobol", "sparta > 300"]`).

### dependencies (deprecated)
`Array<String>`

An array of packages that this package depends on (e.g. `["nodejs >= 0.10.22"]`).
**Note that this is deprecated in favour of `requires`.** This is mapped to the
`Requires` property in spec file.

### autoReq, autoProv
`Boolean` (default: `true`)

These tags control automatic dependency processing while the package is being
built.  Their default state of `true` is not a decision by this project but
represents the default action taken by RPM.  When both `autoReq` and `autoProv`
are set to `false`, the `AutoReqProv` tag will instead be used with a value of
`no` in the SPEC file.

### excludeArchs
`Array<String>`

An array specifying which architectures to prevent the RPM from building on
(e.g. `["sparc"]`).

### exclusiveArchs
`Array<String>`

An array specifying _only_ the architectures the RPM should build on
(e.g. `["x86_64"]`).

### excludeOS
`Array<String>`

An array specifying which operating systems to prevent the RPM from building on
(e.g. `["sparc"]`).

### exclusiveOS
`Array<String>`

An array specifying _only_ the operating systems the RPM should build on
(e.g. `["x86_64"]`).

### buildRoot
`String`

Used to define an alternate build root.  Use this one with caution and
[consult the manual](http://www.rpm.org/max-rpm-snapshot/ch-rpm-anywhere.html).
You will likely need to make use of the `cleanScript` option when specifying
this property.

### sources
`Array<String>`

Used to specify the locations the source code is provided by the developer(s).
(Read more about this tag)[http://www.rpm.org/max-rpm-snapshot/s1-rpm-inside-tags.html].

### noSources
`Array<String>`

Used to direct RPM to omit one or more source files from the source package.
(Read more about this tag)[http://www.rpm.org/max-rpm-snapshot/s1-rpm-inside-tags.html].

### patches
`Array<String>`

The patch tag is used to identify which patches are associated with the
software being packaged. The patch files are kept in RPM's SOURCES directory,
so only the name of the patch file should be specified.

### noPatches
`Array<String>`

Just like the nosource tag, the nopatch tag is used to direct RPM to omit
something from the source package. In the case of nosource, that "something"
was one or more sources. For the nopatch tag, the "something" is one or more
patches.

### prepScript
`Array<String>`

The first script that RPM executes during a build.  Each element in the array
provided will be a line in the `%prep` directive block of the SPEC file.
[There are also some useful macros that can be used here](http://www.rpm.org/max-rpm-snapshot/s1-rpm-inside-macros.html).

### buildScript
`Array<String>`

The build script is run after the prep script.  Generally it is used for things
like running `make`.

### installScript
`Array<String>`

The install script is run after the build script and is used for running the
commands that perform installation related tasks.

### checkScript
`Array<String>`

The check script is run after the build script and is used for running the
commands that perform installation checking tasks (test suites, etc.)

### cleanScript
`Array<String>`

The clean script is used to clean up the build directory tree.  RPM usually
does this automatically but this is especially useful for packages that
specify a `buildRoot`.

### preInstallScript
`Array<String>`

An array of commands to be executed before the installation. Each element in
the array represents a command.

### postInstallScript
`Array<String>`

An array of commands to be executed after the installation. Each element in
the array represents a command.

### preUninstallScript
`Array<String>`

An array of commands to be executed before uninstallation. Each element in
the array represents a command.

### postUninstallScript
`Array<String>`

An array of commands to be executed after uninstallation. Each element in
the array represents a command.

### verifyScript
`Array<String>`

This script is executed whenever the installed package is verified by RPMs
verification command.  Effectively, it should be used to verify the the
correct installation of the package.  Note that RPM already verifies the
existence of the package's files along with their file attributes.  Thus, the
contents of this script should focus on other aspects of the installation.

### postPackageCreate
`String` (deprecated) | `function(rpmPath, rpmFilename)`

When a string, sets where to copy the rpm after it has been created.
**Note that this is deprecated in favour of the `rpmDestination` property.**

When given a function, the function is executed when the package has been
created and provided with two arguments: the path and filename of the newly
created package.

### rpmDestination
`String` (default: `'.'`)

Location where the resulting RPM should be placed.

### tempDir
`String` (default: `'tmp-<auto_gen_id>'`)

Sets the temporary path name that stores the structure that required by the
`rpmbuild` command.  Note that this is used for the setup and building of the
package and does not affect the RPM itself.

### keepTemp
`Boolean` (default: `false`)

When `true`, will keep the temporary directory used to build the RPM after the
it is built. This is useful for problem investigation.

## Contributing
For those interested in contributing to the project, there are a few simple
guidelines to follow.

If you've found a bug or feel the project could use a new feature:
  1.  Submit an [issue on github](https://github.com/panitw/easy-rpm/issues)
  2.  Participate in the discussion on it

If you want to contribute code to the project:
  1. Ensure there is an issue filed for the bug or feature (see above)
  2. Fork the project and branch off the `develop` branch
  3. On your bug/feature branch, write the code that addresses the issue (see
     below for style guidelines and process)
  4. Periodically pull from the `develop` branch on this repository
  5. When you feel it is complete, submit a pull request targeting the
     `develop` branch on this repository
  6. Participate in the code review

Code style and process:
  * To keep the style uniform, use [EditorConfig](http://editorconfig.org/) and
    the grunt task `jsbeautifier`
  * Write clear, concise comments and commit messages
  * Squash commits that iterate work on a similar set of changes
