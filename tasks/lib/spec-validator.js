var validator = require('validator'),
    urlvalidator = require('valid-url'),
    _ = require('lodash');

function validateName(value, result) {
    if (!validator.isLength(value, 1)) {
        result.errors.push('Name tag cannot be empty.');
    }
    if (validator.contains(value, ' ')) {
        result.warnings.push('Whitespace found in the name tag; RPM will ' +
            'only use the value up to the first whitespace.');
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
            result.warnings.push(
                'Traditionally, the release tag is an integer.');
        }
    }
}

function validateBuildArch(value, result) {
    if (!validator.isLength(value, 1)) {
        result.errors.push('BuildArch tag cannot be empty.');
    } else if (validator.contains(value, '\n')) {
        result.errors.push('BuildArch cannot contain linebreaks.');
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
    if (!_.isBoolean(value)) {
        result.errors.push('AutoReq must be specified as a boolean.');
    }
}

function validateAutoProv(value, result) {
    if (!_.isBoolean(value)) {
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

function validateBuildRoot(value, cleanScripts, result) {
    if (validator.contains(value, '\n')) {
        result.errors.push('BuildRoot tag cannot contain linebreaks.');
    } else if (validator.isLength(value, 1) && cleanScripts.length === 0) {
        result.warnings.push('A BuildRoot is specified without any %clean ' +
            'scripts.  It may be neccessary to do manual cleaning when ' +
            'specifying a BuildRoot.');
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
    var i, index, indexInt, hasError = false,
        hasWarning = false;
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
            if (indexInt > (list.length - 1) || indexInt < 0) {
                result.warnings.push(messages.outOfRangeWarning);
                hasWarning = true;
            }
        }
    }
}

function validateNoSource(sources, nosources, result) {
    _validateNoGeneric(sources, nosources, result, {
        nonIntegralError: 'NoSource values must be integral.',
        outOfRangeWarning: 'NoSource indices should match to the list of ' +
            'Sources with a zero-based index.'
    });
}

function validateNoPatch(patches, nopatches, result) {
    _validateNoGeneric(patches, nopatches, result, {
        nonIntegralError: 'NoPatch values must be integral.',
        outOfRangeWarning: 'NoPatch indices should match to the list of ' +
            'Patches with a zero-based index.'
    });
}

function validateMode(mode, errors, warnings) {
    var modeMatch;

    if (!validator.isInt(mode)) {
        errors.nonIntegerMode = true;
    } else {
        modeMatch = validator.toString(mode).match(/^[0-7]{3}$/);
        // In node REPL modeMatch would be undefined but null when run
        // otherwise.
        if (modeMatch === null || modeMatch === undefined) {
            warnings.nonStandardMode = true;
        }
    }
}

function validateFiles(files, result) {
    var errors = {
            emptyPath: false,
            newlinePath: false,
            nonIntegerMode: false,
            numericUser: false,
            numericGroup: false
        },
        warnings = {
            nonStandardMode: false
        },
        i, file;

    for (i = 0; i < files.length; i++) {
        file = files[i];

        // Check path.
        if (!validator.isLength(file.path, 1)) {
            errors.emptyPath = true;
        } else if (validator.contains(file.path, '\n')) {
            errors.newlinePath = true;
        }

        // Check mode.
        if (validator.isLength(file.mode, 1)) {
            validateMode(file.mode, errors, warnings);
        }

        if (validator.isLength(file.user, 1) && validator.isInt(file.user)) {
            errors.numericUser = true;
        }

        if (validator.isLength(file.group, 1) && validator.isInt(file.group)) {
            errors.numericGroup = true;
        }
    }

    if (errors.emptyPath) {
        result.errors.push('One or more files contain an empty path.');
    }
    if (errors.newlinePath) {
        result.errors.push('One or more files contain a new line in the path.');
    }
    if (errors.nonIntegerMode) {
        result.errors.push('One or more file modes are non-integral.');
    }
    if (errors.numericUser) {
        result.errors.push('One or more files specify a numeric user id.');
    }
    if (errors.numericGroup) {
        result.errors.push('One or more files specify a numeric group id.');
    }
    if (warnings.nonStandardMode) {
        result.warnings.push('One or more file modes appear incorrect.');
    }
}

function validateDefaultAttributes(attrs, result) {
    var errors = {
            nonIntegerMode: false
        },
        warnings = {
            nonStandardMode: false
        };

    if (attrs === null) {
        return;
    }

    if (validator.isLength(attrs.mode, 1)) {
        validateMode(attrs.mode, errors, warnings);
        if (errors.nonIntegerMode) {
            result.errors.push('Default file mode must be integral.');
        }
        if (warnings.nonStandardMode) {
            result.warnings.push('Default file mode appears incorrect.');
        }
        errors.nonIntegerMode = warnings.nonStandardMode = false;
    }

    if (validator.isLength(attrs.dirMode, 1)) {
        validateMode(attrs.dirMode, errors, warnings);
        if (errors.nonIntegerMode) {
            result.errors.push('Default directory mode must be integral.');
        }
        if (warnings.nonStandardMode) {
            result.warnings.push('Default directory mode appears incorrect.');
        }
    }

    if (validator.isLength(attrs.user, 1) && validator.isInt(attrs.user)) {
        result.errors.push('Default user must not be numeric.');
    }

    if (validator.isLength(attrs.group, 1) && validator.isInt(attrs.group)) {
        result.errors.push('Default group must not be numeric.');
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
    validateBuildArch(spec.tags.buildArch, result);
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
    validateBuildRoot(spec.tags.buildRoot, spec.scripts.clean, result);
    validateSources(spec.tags.sources, result);
    validateNoSource(spec.tags.sources, spec.tags.noSources, result);
    validateNoPatch(spec.tags.patches, spec.tags.noPatches, result);
    validateFiles(spec.files.list, result);
    validateDefaultAttributes(spec.files.defaultAttributes, result);

    // Set the valid property on the result for simple checking.
    result.valid = (result.errors.length === 0);

    return result;
};
