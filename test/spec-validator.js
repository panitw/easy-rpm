/* jshint mocha:true */

var assert = require('assert'),
    rpmspec = require('../tasks/lib/spec'),
    specValidator = require('../tasks/lib/spec-validator');

function validSpec() {
  var spec = new rpmspec();

  spec.tags.name = 'ValidName';
  spec.tags.version = '1.2.3';
  spec.tags.release = '1';

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

describe('sanity check', function() {
  it('base test spec is valid with no warnings or errors', function() {
    assertResultValid(specValidator(validSpec()));
  });
});

describe('validating spec property', function() {
  var spec, result;

  beforeEach(function() {
    spec = validSpec();
    result = undefined;
  });

  describe('name', function() {
    it('should produce an error when not set', function() {
      spec.tags.name = '';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });

    it('should produce a warning when it contains whitespace', function() {
      spec.tags.name = 'Whitespace Name';
      result = specValidator(spec);
      assertResult(result, true, 1, 0);
    });
  });

  describe('version', function() {
    it('should produce an error when not set', function() {
      spec.tags.version = '';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });

    it('should produce an error when it contains a dash', function() {
      spec.tags.version = '1.0-a';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });

    it('should produce a warning when non-alphanumeric (plus periods)',
        function() {
      spec.tags.version = 'v1(2)';
      result = specValidator(spec);
      assertResult(result, true, 1, 0);
    });
  });

  describe('release', function() {
    it('should produce an error when not set', function() {
      spec.tags.release = '';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });

    it('should produce an error when it contains a dash', function() {
      spec.tags.release = '1-0';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });

    it('should produce a warning when non-integral', function() {
      spec.tags.release = 'a';
      result = specValidator(spec);
      assertResult(result, true, 1, 0);
    });
  });

  describe('summary', function() {
    it('should produce an error when it contains a newline', function() {
      spec.tags.summary = 'line one\nline two';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('license', function() {
    it('should produce an error when it contains a newline', function() {
      spec.tags.license = 'GPL\nMIT';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('epoch', function() {
    it('should produce an error when non-integral', function() {
      spec.tags.epoch = 'abc';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });

    it('should produce an error when signed', function() {
      spec.tags.epoch = -3;
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('distribution', function() {
    it('should produce an error when it contains a newline', function() {
      spec.tags.distribution = 'doors\n95';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('vendor', function() {
    it('should produce an error when it contains a newline', function() {
      spec.tags.vendor = 'fooware\nltd.';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('url', function() {
    it('should produce a warning when not a valid url', function() {
      spec.tags.url = 'http:/google.com';
      result = specValidator(spec);
      assertResult(result, true, 1, 0);
    });
  });

  describe('group', function() {
    it('should produce an error when it contains a newline', function() {
      spec.tags.group = 'fooware\nltd.';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('packager', function() {
    it('should produce an error when it contains a newline', function() {
      spec.tags.packager = 'Fred\nFoonly';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('autoReq', function() {
    it('should produce an error when not a boolean', function() {
      spec.tags.autoReq = 'no';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('autoProv', function() {
    it('should produce an error when not a boolean', function() {
      spec.tags.autoProv = 'no';
      result = specValidator(spec);
      assertResult(result, false, 0, 1);
    });
  });

  describe('multiple tags', function() {
    it('should produce multiple errors and warnings', function() {
      spec.tags.name = 'Whitespace Name';
      spec.tags.version = '$';
      spec.tags.release = '';
      spec.tags.distribution = 'doors\n95';
      result = specValidator(spec);
      assertResult(result, false, 2, 2);
    });
  });

  describe('architecture tags', function() {
    it('should produce a warning if the same arch is in both exclude and ' +
      'exclusive lists', function() {
      spec.addExcludeArchs('sparc', 'alpha');
      spec.addExclusiveArchs('x86', 'alpha');
      result = specValidator(spec);
      assertResult(result, true, 1, 0);
    });

    it('should produce no warnings if there is no arch in both exclude and ' +
      'exclusive lists', function() {
      spec.addExcludeArchs('sparc', 'powerpc');
      spec.addExclusiveArchs('x86', 'alpha');
      result = specValidator(spec);
      assertResultValid(result);
    });
  });

  describe('os tags', function() {
    it('should produce a warning if the same OS is in both exclude and ' +
      'exclusive lists', function() {
      spec.addExcludeOS('linux', 'irix');
      spec.addExclusiveOS('irix', 'solaris');
      result = specValidator(spec);
      assertResult(result, true, 1, 0);
    });

    it('should produce no warnings if there is no OS in both exclude and ' +
      'exclusive lists', function() {
      spec.addExcludeOS('linux', 'irix');
      spec.addExclusiveOS('bsd', 'solaris');
      result = specValidator(spec);
      assertResultValid(result);
    });
  });
});
