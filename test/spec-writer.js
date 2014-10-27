/* jshint mocha:true */

var assert = require('assert'),
    fs = require('fs'),
    rpmspec = require('../tasks/lib/spec'),
    specWriter = require('../tasks/lib/spec-writer');

function assertExpectedFile(result, expectFile, assertion) {
  var expected = fs.readFileSync(
      'test/spec_writer_expected/' + expectFile + '.spec', {encoding: 'utf8'});
  // Note that the comparisson here ignores leading and trailing whitespace on
  // the entirety of the strings.  It seems that rpmbuilder does not care about
  // this.
  assertion(result.trim(), expected.trim(),
      'result should match expected in ' + expectFile);
}

function assertEqualsExpectedFile(result, expectFile) {
  assertExpectedFile(result, expectFile, assert.strictEqual);
}

function assertNotEqualsExpectedFile(result, expectFile) {
  assertExpectedFile(result, expectFile, assert.notStrictEqual);
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
      specWriter(spec, function(out, err) {
        result = out;
        resultErr = err;
      });

      assert.strictEqual(resultErr, null, 'result error should be null');
      assertEqualsExpectedFile(result, 'expect_01');
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

      specWriter(spec, function(out, err) {
        result = out;
        resultErr = err;
      });

      assert.strictEqual(resultErr, null, 'result error should be null');
      assertEqualsExpectedFile(result, 'expect_05');
    });
  });

  describe('auto tags', function() {
    describe('when autoReq is true and autoProv is true', function() {
      it('should not produce any Auto* tags', function() {
        spec.tags.autoProv = true;
        spec.tags.autoReq = true;

        specWriter(spec, function(out, err) {
          result = out;
          resultErr = err;
        });

        assert.strictEqual(resultErr, null, 'result error should be null');
        assertEqualsExpectedFile(result, 'expect_01');
      });
    });

    describe('when autoReq is false and autoProv is true', function() {
      it('should only produce the AutoReq tag', function() {
        spec.tags.autoProv = true;
        spec.tags.autoReq = false;

        specWriter(spec, function(out, err) {
          result = out;
          resultErr = err;
        });

        assert.strictEqual(resultErr, null, 'result error should be null');
        assertEqualsExpectedFile(result, 'expect_06');
      });
    });

    describe('when autoReq is true and autoProv is false', function() {
      it('should only produce the AutoProv tag', function() {
        spec.tags.autoProv = false;
        spec.tags.autoReq = true;

        specWriter(spec, function(out, err) {
          result = out;
          resultErr = err;
        });

        assert.strictEqual(resultErr, null, 'result error should be null');
        assertEqualsExpectedFile(result, 'expect_07');
      });
    });

    describe('when autoReq is false and autoProv is false', function() {
      it('should only produce the AutoReqProv tag', function() {
        spec.tags.autoProv = false;
        spec.tags.autoReq = false;

        specWriter(spec, function(out, err) {
          result = out;
          resultErr = err;
        });

        assert.strictEqual(resultErr, null, 'result error should be null');
        assertEqualsExpectedFile(result, 'expect_04');
      });
    });
  });

  describe('given a description', function() {
    describe('with the minimum tags', function() {
      it('should produce the correct spec string', function() {
        spec.tags.description = 'Description line one.\n' +
                                'Description line two.\n\n' +
                                'Description line four.';

        specWriter(spec, function(out, err) {
          result = out;
          resultErr = err;
        });

        assert.strictEqual(resultErr, null, 'result error should be null');
        assertEqualsExpectedFile(result, 'expect_02');
      });
    });

    describe('with additional tags', function() {
      it('should place the description after all single-line tags', function() {
        spec.tags.license = 'MIT';
        spec.tags.vendor = 'easyrpm';
        spec.tags.description = 'Description line one.\n' +
                                'Description line two.\n\n' +
                                'Description line four.';

        specWriter(spec, function(out, err) {
          result = out;
          resultErr = err;
        });

        assert.strictEqual(resultErr, null, 'result error should be null');
        assertEqualsExpectedFile(result, 'expect_03');
      });
    });
  });
});
