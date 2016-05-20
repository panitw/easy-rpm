/* jshint mocha:true */

var assert = require('assert'),
    fs = require('fs'),
    rpmspec = require('../tasks/lib/spec'),
    specWriter = require('../tasks/lib/spec-writer');

function assertExpectedFile(result, expectFile, assertion) {
    var expected = fs.readFileSync(
        'test/spec_writer_expected/' + expectFile + '.spec', {
            encoding: 'utf8'
        });
    // Note that the comparisson here ignores leading and trailing whitespace on
    // the entirety of the strings.  It seems that rpmbuilder does not care
    // about this.
    assertion(result.trim(), expected.trim(),
        'result should match expected in ' + expectFile);
}

function assertEqualsExpectedFile(result, expectFile) {
    assertExpectedFile(result, expectFile, assert.strictEqual);
}

function assertNotEqualsExpectedFile(result, expectFile) {
    assertExpectedFile(result, expectFile, assert.notStrictEqual);
}

function writeAndAssertEqualsExpectedFile(spec, expectFile) {
    var result, resultErr;

    specWriter(spec, function(out, err) {
        result = out;
        resultErr = err;
    });

    assert.strictEqual(resultErr, null, 'result error should be null');
    assertEqualsExpectedFile(result, expectFile);
}

function specWithMinimumTags() {
    var spec = new rpmspec();
    spec.tags.name = 'easyrpm';
    spec.tags.version = '0.0.1';
    spec.tags.release = 21;
    spec.tags.buildArch = 'noarch';
    return spec;
}

describe('spec writer', function() {
    var spec, result, resultErr;

    beforeEach(function() {
        spec = specWithMinimumTags();
        result = undefined;
        resultErr = undefined;
    });

    describe('given the minimum tags', function() {
        it('should produce the correct spec', function() {
            writeAndAssertEqualsExpectedFile(spec, 'expect_01');
        });
    });

    describe('given define directives', function() {
        it('should produce the appropriate statements', function() {
            spec.addDefines('_topdir /abc', '_rpmdir /xyz');
            writeAndAssertEqualsExpectedFile(spec, 'expect_35');
        });
    });

    // Note that this test basically ensures that tags with no specific output
    // needs are written as expected.
    describe('given all (most) tags', function() {
        it('should produce the correct spec', function() {
            spec.tags.summary = 'Easily create RPM packages.';
            spec.tags.license = 'MIT';
            spec.tags.epoch = 23;
            spec.tags.distribution = 'grunt';
            spec.tags.icon = 'easyrpm.png';
            spec.tags.vendor = 'EasyRPM Inc.';
            spec.tags.url = 'http://www.google.com/';
            spec.tags.group = 'Applications/Productivity';
            spec.tags.packager = 'Dr. Foo <foo@tardis.com>';
            spec.tags.autoReq = false;
            spec.tags.autoProv = false;
            spec.addRequirements('quux > 1.6.9', 'k9 <= 2.0');
            spec.addBuildRequirements('bar <= 1.2.3');
            spec.tags.requires.push({'foo': ['bar = 1.2.3']});
            spec.addProvides('virtualeasyrpm = 0.0.1');
            spec.addConflicts('quux = 1.6.9', 'baz < 1.2');
            spec.addExcludeArchs('sparc', 'alpha');
            spec.addExclusiveArchs('x86', 'powerpc');
            spec.addExcludeOS('linux', 'irix');
            spec.addExclusiveOS('bsd', 'solaris');
            spec.tags.prefix = '/opt/easyrpm';
            spec.tags.buildRoot = '/tmp/easyrpm';
            writeAndAssertEqualsExpectedFile(spec, 'expect_05');
        });
    });

    describe('auto tags', function() {
        describe('when autoReq is true and autoProv is true', function() {
            it('should not produce any Auto* tags', function() {
                spec.tags.autoProv = true;
                spec.tags.autoReq = true;
                writeAndAssertEqualsExpectedFile(spec, 'expect_01');
            });
        });

        describe('when autoReq is false and autoProv is true', function() {
            it('should only produce the AutoReq tag', function() {
                spec.tags.autoProv = true;
                spec.tags.autoReq = false;
                writeAndAssertEqualsExpectedFile(spec, 'expect_06');
            });
        });

        describe('when autoReq is true and autoProv is false', function() {
            it('should only produce the AutoProv tag', function() {
                spec.tags.autoProv = false;
                spec.tags.autoReq = true;
                writeAndAssertEqualsExpectedFile(spec, 'expect_07');
            });
        });

        describe('when autoReq is false and autoProv is false', function() {
            it('should only produce the AutoReqProv tag', function() {
                spec.tags.autoProv = false;
                spec.tags.autoReq = false;
                writeAndAssertEqualsExpectedFile(spec, 'expect_04');
            });
        });
    });

    describe('given a description', function() {
        describe('with the minimum tags', function() {
            it('should produce the correct spec string', function() {
                spec.tags.description = 'Description line one.\n' +
                    'Description line two.\n\n' +
                    'Description line four.';
                writeAndAssertEqualsExpectedFile(spec, 'expect_02');
            });
        });

        describe('with additional tags', function() {
            it('should place the description after all single-line tags',
                function() {
                    spec.tags.license = 'MIT';
                    spec.tags.vendor = 'easyrpm';
                    spec.tags.description = 'Description line one.\n' +
                        'Description line two.\n\n' +
                        'Description line four.';
                    writeAndAssertEqualsExpectedFile(spec, 'expect_03');
                });
        });
    });

    describe('sources', function() {
        describe('with a single source defined', function() {
            it('should use an un-numbered source tag', function() {
                spec.addSources('ftp://x.example.com/pkg.tar.gz');
                writeAndAssertEqualsExpectedFile(spec, 'expect_08');
            });
        });

        describe('with multiple sources defined', function() {
            it('should use numbered source tags', function() {
                spec.addSources('source_A.tar.gz', 'source_B.tar.gz',
                    'source_C.tar.gz');
                writeAndAssertEqualsExpectedFile(spec, 'expect_09');
            });
        });
    });

    describe('nosources', function() {
        it('should produce a NoSources tag when non-empty', function() {
            spec.addSources('source_A.tar.gz', 'source_B.tar.gz',
                'source_C.tar.gz');
            spec.addNoSources(0, 2);
            writeAndAssertEqualsExpectedFile(spec, 'expect_10');
        });
    });

    describe('patches', function() {
        describe('with a single patch defined', function() {
            it('should use an un-numbered patch tag', function() {
                spec.addPatches('update-1.0.patch');
                writeAndAssertEqualsExpectedFile(spec, 'expect_11');
            });
        });

        describe('with multiple patches defined', function() {
            it('should use numbered patch tags', function() {
                spec.addPatches('update-1.0.patch', 'update-1.1.patch',
                    'update-1.4.patch');
                writeAndAssertEqualsExpectedFile(spec, 'expect_12');
            });
        });
    });

    describe('nopatches', function() {
        it('should produce a NoPatches tag when non-empty', function() {
            spec.addPatches('update-1.0.patch', 'update-1.1.patch',
                'update-1.4.patch');
            spec.addNoPatches(0, 2);
            writeAndAssertEqualsExpectedFile(spec, 'expect_13');
        });
    });

    describe('prep scripts', function() {
        it('should produce the %prep section when non-empty', function() {
            spec.addPrepScripts('ls -la', 'mkdir preppin');
            writeAndAssertEqualsExpectedFile(spec, 'expect_14');
        });
    });

    describe('build scripts', function() {
        it('should produce the %build section when non-empty', function() {
            spec.addBuildScripts('make', 'grep foo');
            writeAndAssertEqualsExpectedFile(spec, 'expect_15');
        });
    });

    describe('install scripts', function() {
        it('should produce the %build section when non-empty', function() {
            spec.addInstallScripts('make install', 'banner woo');
            writeAndAssertEqualsExpectedFile(spec, 'expect_16');
        });
    });

    describe('check scripts', function() {
        it('should produce the %check section when non-empty', function() {
            spec.addCheckScripts('make check', 'make test');
            writeAndAssertEqualsExpectedFile(spec, 'expect_17');
        });
    });

    describe('clean scripts', function() {
        it('should produce the %clean section when non-empty', function() {
            spec.addCleanScripts('make clean', 'rm -rf /');
            writeAndAssertEqualsExpectedFile(spec, 'expect_18');
        });
    });

    describe('preinstall scripts', function() {
        it('should produce the %pre section when non-empty', function() {
            spec.addPreInstallScripts('find xyz', 'banner pre');
            writeAndAssertEqualsExpectedFile(spec, 'expect_19');
        });
    });

    describe('postinstall scripts', function() {
        it('should produce the %post section when non-empty', function() {
            spec.addPostInstallScripts('find abc', 'banner post');
            writeAndAssertEqualsExpectedFile(spec, 'expect_20');
        });
    });

    describe('preuninstall scripts', function() {
        it('should produce the %preun section when non-empty', function() {
            spec.addPreUninstallScripts('find 123', 'banner preun');
            writeAndAssertEqualsExpectedFile(spec, 'expect_21');
        });
    });

    describe('postuninstall scripts', function() {
        it('should produce the %postun section when non-empty', function() {
            spec.addPostUninstallScripts('find qrt', 'banner postun');
            writeAndAssertEqualsExpectedFile(spec, 'expect_22');
        });
    });

    describe('verify scripts', function() {
        it('should produce the %verifyscript section when non-empty',
            function() {
                spec.addVerifyScripts('grep foo', 'echo "bar" >&2');
                writeAndAssertEqualsExpectedFile(spec, 'expect_23');
            });
    });

    describe('all scripts', function() {
        it('should produce the sections in order and as expected', function() {
            spec.addPrepScripts('echo "prep"');
            spec.addBuildScripts('echo "build"');
            spec.addInstallScripts('echo "install"');
            spec.addCheckScripts('echo "check"');
            spec.addCleanScripts('echo "clean"');
            spec.addPreInstallScripts('echo "pre"');
            spec.addPostInstallScripts('echo "post"');
            spec.addPreUninstallScripts('echo "preun"');
            spec.addPostUninstallScripts('echo "postun"');
            spec.addVerifyScripts('echo "verifyscript"');
            writeAndAssertEqualsExpectedFile(spec, 'expect_24');
        });
    });

    describe('files', function() {
        it('should produce the %files section when non-empty', function() {
            spec.addFiles({
                path: '/opt/easyrpm/README'
            });
            writeAndAssertEqualsExpectedFile(spec, 'expect_25');
        });

        describe('when marked as documentation', function() {
            it('should produce the %doc directive', function() {
                spec.addFiles({
                    path: '/opt/easyrpm/README',
                    doc: true
                }, {
                    path: '/opt/easyrpm/foo.c'
                }, {
                    path: '/opt/easyrpm/INSTALL',
                    doc: true
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_26');
            });
        });

        describe('when marked as a configuration file', function() {
            it('should produce the %config directive', function() {
                spec.addFiles({
                    path: '/opt/easyrpm/package.json',
                    config: true
                }, {
                    path: '/opt/easyrpm/foo.c'
                }, {
                    path: '/opt/easyrpm/more.conf',
                    config: true
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_27');
            });
        });

        describe('when marked as a noreplace file', function() {
            it('should produce the %config(noreplace) directive', function() {
                spec.addFiles({
                    path: '/opt/easyrpm/package.json',
                    config: true
                }, {
                    path: '/opt/easyrpm/foo.c'
                }, {
                    path: '/opt/easyrpm/more.conf',
                    noreplace: true
                },
                {
                    path: '/opt/easyrpm/third.json',
                    config: true,
                    noreplace: true
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_38');
            });
        });

        describe('when marked as a ghost', function() {
            it('should produce the %ghost directive', function() {
                spec.addFiles({
                    path: '/opt/easyrpm/package.json',
                    ghost: true
                }, {
                    path: '/opt/easyrpm/foo.c'
                }, {
                    path: '/opt/easyrpm/more.conf',
                    ghost: true
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_28');
            });
        });

        describe('when marked as a directory', function() {
            it('should produce the %dir directive', function() {
                spec.addFiles({
                    path: '/opt/easyrpm/',
                    dir: true
                }, {
                    path: '/opt/easyrpm2/foo.c'
                }, {
                    path: '/opt/easyrpm2/stuff',
                    dir: true
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_33');
            });
        });

        describe('when only a mode is specified', function() {
            it('should produce an appropriate %attr directive', function() {
                spec.addFiles({
                    path: '/opt/easyrpm/package.json',
                    mode: 755
                }, {
                    path: '/opt/easyrpm/foo.c'
                }, {
                    path: '/opt/easyrpm/more.conf',
                    mode: 644
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_29');
            });
        });

        describe('when only a user is specified', function() {
            it('should produce an appropriate %attr directive', function() {
                spec.addFiles({
                    path: '/opt/easyrpm/package.json',
                    user: 'foobar'
                }, {
                    path: '/opt/easyrpm/foo.c'
                }, {
                    path: '/opt/easyrpm/more.conf',
                    user: 'bazquux'
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_30');
            });
        });

        describe('when only a group is specified', function() {
            it('should produce an appropriate %attr directive', function() {
                spec.addFiles({
                    path: '/opt/easyrpm/package.json',
                    group: 'baseballfury'
                }, {
                    path: '/opt/easyrpm/foo.c'
                }, {
                    path: '/opt/easyrpm/more.conf',
                    group: 'theorphans'
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_31');
            });
        });

        describe('when attribute combinations are specified', function() {
            it('should produce an appropriate %attr directive', function() {
                spec.addFiles({
                    path: '/fileA',
                    mode: 666,
                    group: 'baseballfury'
                }, {
                    path: '/fileB',
                    mode: 662,
                    user: 'bazbaz'
                }, {
                    path: '/fileC',
                    user: 'jimmy',
                    group: 'theorphans'
                }, {
                    path: '/fileD',
                    mode: 777,
                    user: 'u',
                    group: 'g'
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_32');
            });
        });

        describe('when default attributes are specified', function() {
            it('should produce the %defattr directive', function() {
                spec.addFiles({
                    path: '/fileA'
                });
                spec.setDefaultAttributes({
                    mode: 644,
                    user: 'user',
                    group: 'group',
                    dirMode: 755
                });
                writeAndAssertEqualsExpectedFile(spec, 'expect_34');
            });
        });

        describe('when changelog entries are specified', function() {
            it('should produce the %changelog section', function() {
                spec.addChangelogs(
                    '* Fri Oct 31 2014 Dr. Foo <foo@bar.com>',
                    '- Redesign flux capacitor.');
                writeAndAssertEqualsExpectedFile(spec, 'expect_36');
            });
        });


        describe('provides tag', function() {
            it('should only produce the Provides tag', function() {
                spec.addProvides('virtualeasyrpm = 0.0.1');
                writeAndAssertEqualsExpectedFile(spec, 'expect_37');
            });
        });
    });
});
