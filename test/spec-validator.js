/* jshint mocha:true */

var assert = require('assert'),
    rpmspec = require('../tasks/lib/spec'),
    specValidator = require('../tasks/lib/spec-validator');

function validSpec() {
    var spec = new rpmspec();

    spec.tags.name = 'ValidName';
    spec.tags.version = '1.2.3';
    spec.tags.release = '1';
    spec.tags.buildArch = 'noarch';

    return spec;
}

function assertResult(result, expectValid, expectWarnings, expectErrors) {
    assert.strictEqual(result.valid, expectValid,
        'result should be ' + (expectValid ? 'valid' : 'invalid'));
    assert.strictEqual(result.warnings.length, expectWarnings,
        'result warning count should be ' + expectWarnings);
    assert.strictEqual(result.errors.length, expectErrors,
        'result errors count should be ' + expectErrors);
}

function assertResultValid(result) {
    assertResult(result, true, 0, 0);
}

function validateAndAssertResult(spec, expectValid, expectWarns, expectErrors) {
    assertResult(specValidator(spec), expectValid, expectWarns, expectErrors);
}

describe('sanity check', function() {
    it('base test spec is valid with no warnings or errors', function() {
        assertResultValid(specValidator(validSpec()));
    });
});

describe('validating spec', function() {
    var spec, result;

    beforeEach(function() {
        spec = validSpec();
        result = undefined;
    });

    describe('name', function() {
        it('should produce an error when not set', function() {
            spec.tags.name = '';
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce a warning when it contains whitespace', function() {
            spec.tags.name = 'Whitespace Name';
            validateAndAssertResult(spec, true, 1, 0);
        });
    });

    describe('version', function() {
        it('should produce an error when not set', function() {
            spec.tags.version = '';
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error when it contains a dash', function() {
            spec.tags.version = '1.0-a';
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce a warning when non-alphanumeric (plus periods)',
            function() {
                spec.tags.version = 'v1(2)';
                validateAndAssertResult(spec, true, 1, 0);
            });
    });

    describe('release', function() {
        it('should produce an error when not set', function() {
            spec.tags.release = '';
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error when it contains a dash', function() {
            spec.tags.release = '1-0';
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce a warning when non-integral', function() {
            spec.tags.release = 'a';
            validateAndAssertResult(spec, true, 1, 0);
        });
    });

    describe('buildArch', function() {
        it('should produce an error when not set', function() {
            spec.tags.buildArch = '';
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error when it contains a newline', function() {
            spec.tags.buildArch = 'no\narch';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('summary', function() {
        it('should produce an error when it contains a newline', function() {
            spec.tags.summary = 'line one\nline two';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('license', function() {
        it('should produce an error when it contains a newline', function() {
            spec.tags.license = 'GPL\nMIT';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('epoch', function() {
        it('should produce an error when non-integral', function() {
            spec.tags.epoch = 'abc';
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error when signed', function() {
            spec.tags.epoch = -3;
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('distribution', function() {
        it('should produce an error when it contains a newline', function() {
            spec.tags.distribution = 'doors\n95';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('vendor', function() {
        it('should produce an error when it contains a newline', function() {
            spec.tags.vendor = 'fooware\nltd.';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('url', function() {
        it('should produce a warning when not a valid url', function() {
            spec.tags.url = 'http:/google.com';
            validateAndAssertResult(spec, true, 1, 0);
        });
    });

    describe('group', function() {
        it('should produce an error when it contains a newline', function() {
            spec.tags.group = 'fooware\nltd.';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('packager', function() {
        it('should produce an error when it contains a newline', function() {
            spec.tags.packager = 'Fred\nFoonly';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('autoReq', function() {
        it('should produce an error when not a boolean', function() {
            spec.tags.autoReq = 'no';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('autoProv', function() {
        it('should produce an error when not a boolean', function() {
            spec.tags.autoProv = 'no';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('multiple tags', function() {
        it('should produce multiple errors and warnings', function() {
            spec.tags.name = 'Whitespace Name';
            spec.tags.version = '$';
            spec.tags.release = '';
            spec.tags.distribution = 'doors\n95';
            validateAndAssertResult(spec, false, 2, 2);
        });
    });

    describe('architecture tags', function() {
        it('should produce a warning if the same arch is in both exclude ' +
            'and exclusive lists',
            function() {
                spec.addExcludeArchs('sparc', 'alpha');
                spec.addExclusiveArchs('x86', 'alpha');
                validateAndAssertResult(spec, true, 1, 0);
            });

        it('should produce no warnings if there is no arch in both exclude ' +
            'and exclusive lists',
            function() {
                spec.addExcludeArchs('sparc', 'powerpc');
                spec.addExclusiveArchs('x86', 'alpha');
                result = specValidator(spec);
                assertResultValid(result);
            });
    });

    describe('os tags', function() {
        it('should produce a warning if the same OS is in both exclude and ' +
            'exclusive lists',
            function() {
                spec.addExcludeOS('linux', 'irix');
                spec.addExclusiveOS('irix', 'solaris');
                validateAndAssertResult(spec, true, 1, 0);
            });

        it('should produce no warnings if there is no OS in both exclude and ' +
            'exclusive lists',
            function() {
                spec.addExcludeOS('linux', 'irix');
                spec.addExclusiveOS('bsd', 'solaris');
                result = specValidator(spec);
                assertResultValid(result);
            });
    });

    describe('prefix', function() {
        it('should produce an error when it contains a newline', function() {
            spec.tags.prefix = '/opt/\nfoo/bar';
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('buildRoot', function() {
        it('should produce an error when it contains a newline', function() {
            spec.tags.buildRoot = '/tmp/\nbuild/root';
            validateAndAssertResult(spec, false, 0, 1);
        });

        describe('supplied without any clean scripts', function() {
            it('should produce a warning', function() {
                spec.tags.buildRoot = '/tmp/easyrpm';
                validateAndAssertResult(spec, true, 1, 0);
            });
        });
    });

    describe('source tags', function() {
        it('should produce a warning if any source is not a valid URL',
            function() {
                spec.addSources(
                    'https://github.com/panitw/easy-rpm/archive/1.4.1.tar.gz',
                    'not.a.url',
                    'also%not^a&url');
                validateAndAssertResult(spec, true, 1, 0);
            });
    });

    describe('nosource tag', function() {
        it('should produce an error if non-numeric', function() {
            spec.addSources('http://www.google.com/', 'http://github.com');
            spec.addNoSources('0', 'alpha');
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce a warning if any index does not exist', function() {
            spec.addSources('http://www.google.com/', 'http://github.com');
            spec.addNoSources(0, 2);
            validateAndAssertResult(spec, true, 1, 0);
        });
    });

    describe('nopatch tag', function() {
        it('should produce an error if non-numeric', function() {
            spec.addPatches('update-1.0.patch', 'update-1.1.patch');
            spec.addNoPatches('0', 'alpha');
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce a warning if any index does not exist', function() {
            spec.addPatches('update-1.0.patch', 'update-1.1.patch');
            spec.addNoPatches(0, 2);
            validateAndAssertResult(spec, true, 1, 0);
        });
    });

    describe('file properties', function() {
        it('should produce an error if file paths are empty', function() {
            spec.addFiles({
                path: ''
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error if file paths have newlines', function() {
            spec.addFiles({
                path: 'here\nthere'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error if file mode is non-integral', function() {
            spec.addFiles({
                path: '/pathy',
                mode: 'abc'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce a warning if file mode is non-standard', function() {
            spec.addFiles({
                path: '/pathy',
                mode: 844
            });
            validateAndAssertResult(spec, true, 1, 0);
        });

        it('should produce an error if the user is numeric', function() {
            spec.addFiles({
                path: '/fileA',
                user: '1001'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error if the group is numeric', function() {
            spec.addFiles({
                path: '/fileA',
                group: '1001'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });
    });

    describe('default attributes', function() {
        it('should produce an error if file mode is non-integral', function() {
            spec.setDefaultAttributes({
                mode: 'abc'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error if dir mode is non-integral', function() {
            spec.setDefaultAttributes({
                dirMode: 'abc'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce a warning if file mode is non-standard', function() {
            spec.setDefaultAttributes({
                mode: '081'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce a warning if dir mode is non-standard', function() {
            spec.setDefaultAttributes({
                dirMode: '081'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error if the user is numeric', function() {
            spec.setDefaultAttributes({
                user: '1001'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });

        it('should produce an error if the group is numeric', function() {
            spec.setDefaultAttributes({
                group: '1001'
            });
            validateAndAssertResult(spec, false, 0, 1);
        });
    });
});
