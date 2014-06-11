# grunt-easy-rpm

> Easily create RPM package to install files/directories

## Prerequisite
This plugin requires Grunt `~0.4.1` and can only run in RedHat varient linux distribution. The `rpmdevtools` and `rpmlint` package needed to be install beforehand.

```shell
[root@localhost ~]$ sudo yum install rpmdevtools rpmlint
```

## Getting Started

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-easy-rpm --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-easy-rpm');
```

## The "easy_rpm" task

### Overview
In your project's Gruntfile, add a section named `easy_rpm` to the data object passed into `grunt.initConfig()`.

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

### Options

#### options.name
Type: `String`
Default value: `'noname'`

A string value that is used to set at the name of your RPM package. It will also be used at the rpm file name

#### options.summary
Type: `String`
Default value: `'No Summary'`

A string value that is used to set as the summary text of your RPM package

#### options.description
Type: `String`
Default value: `'No Description'`

A string value that is used to set as the description of your RPM package

#### options.version
Type: `String`
Default value: `'0.1.0'`

A string value that is used to set as the version of your RPM package. It will also be used at the rpm file name

#### options.release
Type: `String`
Default value: `'1'`

A string value that is used to set as the release of your RPM package. It will also be used at the rpm file name

#### options.license
Type: `String`
Default value: `'MIT'`

A string value that is used to specify the license type of your RPM package

#### options.vendor
Type: `String`
Default value: `'Vendor'`

A string value that is used to set as the Vendor property of your RPM package

#### options.group
Type: `String`
Default value: `'Development/Tools'`

A string value that is used to specify the group of your RPM package

#### options.buildArch
Type: `String`
Default value: `'noarch'`

A string value that is used to set specify the target architecture of your RPM package. . It will also be used at the rpm file name

#### options.dependencies
Type: `Array<String>`
Default value: `[]`

An array of required packages, that should be installed before(e.g. `["nodejs >= 0.10.22"]`). Is mapped to `Requires` property in spec file.

#### options.preInstallScript
Type: `Array<String>`
Default value: `[]`

An array of command to be excecuted `before` the installation. Each element of the array represent each command.

#### options.postInstallScript
Type: `Array<string>`
Default value: `[]`

An array of command to be excecuted `after` the installation. Each element of the array represent each command.

#### options.preUninstallScript
Type: `Array<String>`
Default value: `[]`

An array of command to be excecuted `before` the uninstallation. Each element of the array represent each command.

#### options.postUninstallScript
Type: `Array<String>`
Default value: `[]`

An array of command to be excecuted `after` the uninstallation. Each element of the array represent each command.

#### options.tempDir
Type: `String`
Default value: `'tmp-'+<auto_gen_id>`

A string value that will be use as the temporary path name to store the structure that is required by the `rpmbuild` command.

#### options.keepTemp
Type: `Boolean`
Default value: `false`

A boolean value to tell the script to keep the temp folder after the package is built. Probably can be used for problem investigation.

#### options.rpmDestination
Type: `string`
Default value: `.`

Location where the resulting RPM should be put, `.` by default.

### Usage Examples

#### Basic Usage
In this example, the default options are used for most of the fields. Each file are copied indivitually. The directory structure will be preserved.
**It is important that 'files' group has to resides in a target**. The example below is the target named 'release'

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

#### Using CWD attribute (current working directory)
In this example, Each file are copied individually. The "cwd" attribute is used to pick up the file in the "cwd", the directory structure `under` "cwd" is preserved

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
#### Dynamically generate the file list using wildcard
In this example, the file list will be generated automatically. Files that the path match the wildcard will be included.
The file list is generated using node-glob so please find more info about the wildcard pattern at [node-glob](https://github.com/isaacs/node-glob)

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

#### Setting mode/owner/group of the target files
In this example, the mode/owner/group of each target file can be set using mode/owner/group attribute of each file element

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

#### Setting %doc or %config of the target files
In this example, the %doc or %config flag of each target file can be set

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

