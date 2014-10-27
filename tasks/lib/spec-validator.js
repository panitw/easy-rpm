var validator = require('validator');

function validateName(value, result) {
  if (!validator.isLength(value, 1)) {
    result.errors.push('Name tag cannot be empty.');
  }
  if (validator.contains(value, ' ')) {
    result.warnings.push('Whitespace found in the name tag; RPM will only ' +
        'use the value up to the first whitespace.');
  }
}

function validateVersion(value, result) {
  if (!validator.isLength(value, 1)) {
    result.errors.push('Version tag cannot be empty.');
  }
  if (validator.contains(value, '-')) {
    result.errors.push('Version tag cannot contain a dash.');
  } else if (validator.matches(value, /[^a-z0-9\.]+/i)) {
    result.warnings.push('It is recommended for version tags to be ' +
        'alphanumeric (including periods).');
  }
}

function validateRelease(value, result) {
  if (!validator.isLength(value, 1)) {
    result.errors.push('Release tag cannot be empty.');
  } else {
    if (validator.contains(value, '-')) {
      result.errors.push('Release tag cannot contain a dash.');
    } else if (!validator.isInt(value)) {
      result.warnings.push('Traditionally, the release tag is an integer.');
    }
  }
}

function validateSummary(value, result) {
  if (validator.contains(value, '\n')) {
    result.errors.push('Summary tag cannot contain linebreaks.');
  }
}

function validateLicense(value, result) {
  if (validator.contains(value, '\n')) {
    result.errors.push('License tag cannot contain linebreaks.');
  }
}

function validateEpoch(value, result) {
  if (validator.isLength(value, 1)) { 
    var int_value = validator.toInt(value);
    if (isNaN(int_value) || int_value < 0) {
      result.errors.push('Epoch tag must be an unsigned integer.');
    }
  }
}

function validateDistribution(value, result) {
  if (validator.contains(value, '\n')) {
    result.errors.push('Distribution tag cannot contain linebreaks.');
  }
}

function validateVendor(value, result) {
  if (validator.contains(value, '\n')) {
    result.errors.push('Vendor tag cannot contain linebreaks.');
  }
}

function validateGroup(value, result) {
  if (validator.contains(value, '\n')) {
    result.errors.push('Group tag cannot contain linebreaks.');
  }
}

function validatePackager(value, result) {
  if (validator.contains(value, '\n')) {
    result.errors.push('Packager tag cannot contain linebreaks.');
  }
}

function validateAutoReqProv(value, result) {
  if (typeof(value) !== 'boolean') {
    result.errors.push('AutoReqProv must be specified as a boolean.');
  }
}

module.exports = function(spec) {
  var result = {
    warnings: [],
    errors: []
  };

  validateName(spec.tags.name, result);
  validateVersion(spec.tags.version, result);
  validateRelease(spec.tags.release, result);
  validateSummary(spec.tags.summary, result);
  validateLicense(spec.tags.license, result);
  validateEpoch(spec.tags.epoch, result);
  validateDistribution(spec.tags.distribution, result);
  validateVendor(spec.tags.vendor, result);
  validateGroup(spec.tags.group, result);
  validatePackager(spec.tags.packager, result);
  validateAutoReqProv(spec.tags.autoReqProv, result);

  // Set the valid property on the result for simple checking.
  result.valid = result.errors.length === 0;

  return result;
};
