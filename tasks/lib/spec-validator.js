var validator = require('validator'),
    urlvalidator = require('valid-url');

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

function validateURL(value, result) {
  if (validator.isLength(value, 1) &&
      urlvalidator.isWebUri(value) === undefined) {
    result.warnings.push('URL appears to be invalid.');
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

function validateAutoReq(value, result) {
  if (typeof(value) !== 'boolean') {
    result.errors.push('AutoReq must be specified as a boolean.');
  }
}

function validateAutoProv(value, result) {
  if (typeof(value) !== 'boolean') {
    result.errors.push('AutoProv must be specified as a boolean.');
  }
}

function existsAnIntersection(a, b) {
  var i, j, check;
  for (i = 0; i < a.length; i++) {
    check = a[i];
    for (j = 0; j < b.length; j++) {
      if (check === b[j]) {
        return true;
      }
    }
  }

  return false;
}

function validateArchs(exclude, exclusive, result) {
  if (existsAnIntersection(exclude, exclusive)) {
    result.warnings.push('One or more architectures exist in both the ' +
        'exclude and exclusive lists.');
  }
}

function validateOS(exclude, exclusive, result) {
  if (existsAnIntersection(exclude, exclusive)) {
    result.warnings.push('One or more OSes exist in both the exclude and ' +
        'exclusive lists.');
  }
}

function validatePrefix(value, result) {
  if (validator.contains(value, '\n')) {
    result.errors.push('Prefix tag cannot contain linebreaks.');
  }
}

function validateBuildRoot(value, result) {
  if (validator.contains(value, '\n')) {
    result.errors.push('BuildRoot tag cannot contain linebreaks.');
  }
}

function validateSources(sources, result) {
  for (var i = 0; i < sources.length; i++) {
    if (urlvalidator.isWebUri(sources[i]) === undefined) {
      result.warnings.push('Sources should be valid URLs.');
      return;
    }
  }
}

function _validateNoGeneric(list, indices, result, messages) {
  var i, index, indexInt, hasError = false, hasWarning = false;
  for (i = 0; i < indices.length; i++) {
    // No need for duplicate errors and/or warnings.
    if (hasError && hasWarning) {
      return;
    }

    index = indices[i];
    if (!validator.isInt(index)) {
      result.errors.push(messages.nonIntegralError);
      hasError = true;
    } else {
      indexInt = validator.toInt(index);
      if (indexInt > (list.length-1) || indexInt < 0) {
        result.warnings.push(messages.outOfRangeWarning);
        hasWarning = true;
      }
    }
  }
}

function validateNoSource(sources, nosources, result) {
  _validateNoGeneric(sources, nosources, result, {
    nonIntegralError: 'NoSource values must be integral.',
    outOfRangeWarning: 'NoSource indices should match to the list of Sources ' +
                       'with a zero-based index.'
  });
}

function validateNoPatch(patches, nopatches, result) {
  _validateNoGeneric(patches, nopatches, result, {
    nonIntegralError: 'NoPatch values must be integral.',
    outOfRangeWarning: 'NoPatch indices should match to the list of Patches ' +
                       'with a zero-based index.'
  });
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
  validateURL(spec.tags.url, result);
  validateGroup(spec.tags.group, result);
  validatePackager(spec.tags.packager, result);
  validateAutoReq(spec.tags.autoReq, result);
  validateAutoProv(spec.tags.autoProv, result);
  validateArchs(spec.tags.excludeArchs, spec.tags.exclusiveArchs, result);
  validateOS(spec.tags.excludeOS, spec.tags.exclusiveOS, result);
  validatePrefix(spec.tags.prefix, result);
  validateBuildRoot(spec.tags.buildRoot, result);
  validateSources(spec.tags.sources, result);
  validateNoSource(spec.tags.sources, spec.tags.noSources, result);
  validateNoPatch(spec.tags.patches, spec.tags.noPatches, result);

  // Set the valid property on the result for simple checking.
  result.valid = result.errors.length === 0;

  return result;
};
