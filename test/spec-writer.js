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
});
