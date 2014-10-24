/* jshint mocha:true */

var assert = require('assert'),
    fs = require('fs'),
    rpmspec = require('../tasks/lib/spec'),
    specWriter = require('../tasks/lib/spec-writer');

function assertExpectedFile(result, expectFile, assertion) {
  var expected = fs.readFileSync(
      'test/spec-writer-expected/' + expectFile + '.txt', {encoding: 'utf8'});
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

  describe('given all tags', function() {
    it('should produce the correct spec', function() {
      spec.tags.summary = 'Easily create RPM packages.';
      spec.tags.copyright = 'MIT';
      spec.tags.distribution = 'grunt';
      spec.tags.icon = 'easyrpm.png';
      spec.tags.vendor = 'EasyRPM Inc.';
      spec.tags.group = 'Applications/Productivity';
      spec.tags.packager = 'Dr. Foo <foo@tardis.com>';
      spec.tags.autoReqProv = false;
      spec.addRequirements('quux > 1.6.9', 'k9 <= 2.0');
      spec.addConflicts('quux = 1.6.9', 'baz < 1.2');

      specWriter(spec, function(out, err) {
        result = out;
        resultErr = err;
      });

      assert.strictEqual(resultErr, null, 'result error should be null');
      assertEqualsExpectedFile(result, 'expect_05');
    });
  });

  describe('tag AutoReqProv', function() {
    it('should produce a tag iif set to false', function() {
        spec.tags.autoReqProv = false;

        specWriter(spec, function(out, err) {
          result = out;
          resultErr = err;
        });

        assert.strictEqual(resultErr, null, 'result error should be null');
        assertEqualsExpectedFile(result, 'expect_04');
    });

    it('should not produce a tag when not set to false', function() {
      spec.tags.autoReqProv = true;

      specWriter(spec, function(out, err) {
        result = out;
        resultErr = err;
      });

      assert.strictEqual(resultErr, null, 'result error should be null');
      assertNotEqualsExpectedFile(result, 'expect_04');
      assertEqualsExpectedFile(result, 'expect_01');
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
        spec.tags.copyright = 'MIT';
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
