var _ = require('lodash');

var LineBuffer = function() {
    this.lines = [];
    this.ensureEmpty = false;
};

LineBuffer.prototype.add = function(line) {
    // If the ensure empty line flag is set and the line currently being added
    // is itself non-empty, push a newline beforehand.
    if (line !== '' && this.ensureEmpty) {
        this.newline();
    }

    this.lines.push(line);

    return this;
};

LineBuffer.prototype.newline = function() {
    this.lines.push('');

    // Clear the ensure empty line flag; we have one now.
    if (this.ensureEmpty) {
        this.ensureEmpty = false;
    }

    return this;
};

LineBuffer.prototype.ensureEmptyLine = function() {
    this.ensureEmpty = true;
    return this;
};

LineBuffer.prototype.string = function() {
    return this.lines.join('\n');
};

function bufferTagIfExists(buffer, spec, tag, label) {
    if (_.has(spec.tags, tag)) {
        var value = spec.tags[tag];
        if (value !== null) {
            if ((_.isString(value) && value.length > 0) || _.isNumber(value)) {
                buffer.add(label + ': ' + value);
            }
        }
    }
}

function bufferDirectiveBlock(buffer, arr, keyword, hideIfEmpty) {
    var i;

    if (hideIfEmpty && arr.length === 0) {
        return;
    }

    buffer.add(keyword);
    for (i = 0; i < arr.length; i++) {
        buffer.add(arr[i]);
    }
}

function bufferFiles(buffer, files) {
    var directives, defAttrs, attrs, file, i;

    buffer.ensureEmptyLine();

    if (files.list.length > 0) {
        buffer.add('%files');

        // Add the default attributes directive if present.
        if (files.defaultAttributes !== null) {
            defAttrs = '%defattr(';
            defAttrs += (files.defaultAttributes.mode || '-') + ', ';
            defAttrs += (files.defaultAttributes.user || '-') + ', ';
            defAttrs += (files.defaultAttributes.group || '-') + ', ';
            defAttrs += (files.defaultAttributes.dirMode || '-') + ')';
            buffer.add(defAttrs);
        }

        for (i = 0; i < files.list.length; i++) {
            directives = [];
            file = files.list[i];

            if (file.doc === true) {
                directives.push('%doc');
            }

            if (file.noreplace === true) {
                directives.push('%config(noreplace)');
            } else if (file.config === true) {
                directives.push('%config');
            }

            if (file.ghost === true) {
                directives.push('%ghost');
            }

            if (file.dir === true) {
                directives.push('%dir');
            }

            if ((_.has(file, 'mode') && file.mode !== null) ||
                (_.has(file, 'user') && file.user !== null) ||
                (_.has(file, 'group') && file.group !== null)) {
                attrs = '%attr(';
                attrs += (file.mode || '-') + ', ';
                attrs += (file.user || '-') + ', ';
                attrs += (file.group || '-') + ')';
                directives.push(attrs);
            }

            directives.push('"' + file.path + '"');

            buffer.add(directives.join(' '));
        }
    }
}

module.exports = function(spec, callback) {
    var buffer = new LineBuffer(),
        i;

    // Defines.
    if (spec.tags.defines.length > 0) {
        for (i = 0; i < spec.tags.defines.length; i++) {
            buffer.add('%define ' + spec.tags.defines[i]);
        }
        buffer.ensureEmptyLine();
    }

    // Tags.
    buffer
        .add('Name: ' + spec.tags.name)
        .add('Version: ' + spec.tags.version)
        .add('Release: ' + spec.tags.release)
        .add('BuildArch: ' + spec.tags.buildArch);

    bufferTagIfExists(buffer, spec, 'summary', 'Summary');
    bufferTagIfExists(buffer, spec, 'license', 'License');
    bufferTagIfExists(buffer, spec, 'epoch', 'Epoch');
    bufferTagIfExists(buffer, spec, 'distribution', 'Distribution');
    bufferTagIfExists(buffer, spec, 'icon', 'Icon');
    bufferTagIfExists(buffer, spec, 'vendor', 'Vendor');
    bufferTagIfExists(buffer, spec, 'url', 'URL');
    bufferTagIfExists(buffer, spec, 'group', 'Group');
    bufferTagIfExists(buffer, spec, 'packager', 'Packager');

    if (spec.tags.requires.length > 0) {
        plainRequires = spec.tags.requires.filter(function(require) {
            switch(typeof require) {
                case 'string':
                    return true;
                case 'object':
                    Object.keys(require).map(function(key) {
                        buffer.add('Requires(' + key + '): ' + require[key].join(', '));
                    });
                    return false;
                default:
                    return false;
            }
        });
        buffer.add('Requires: ' + plainRequires.join(', '));
    }
    if (spec.tags.buildRequires.length > 0) {
        buffer.add('BuildRequires: ' + spec.tags.buildRequires.join(', '));
    }
    if (spec.tags.provides.length > 0) {
        buffer.add('Provides: ' + spec.tags.provides.join(', '));
    }

    if (spec.tags.conflicts.length > 0) {
        buffer.add('Conflicts: ' + spec.tags.conflicts.join(', '));
    }

    if (spec.tags.autoReq === false && spec.tags.autoProv === false) {
        buffer.add('AutoReqProv: no');
    } else if (spec.tags.autoReq === false) {
        buffer.add('AutoReq: no');
    } else if (spec.tags.autoProv === false) {
        buffer.add('AutoProv: no');
    }

    if (spec.tags.excludeArchs.length > 0) {
        buffer.add('ExcludeArch: ' + spec.tags.excludeArchs.join(', '));
    }

    if (spec.tags.exclusiveArchs.length > 0) {
        buffer.add('ExclusiveArch: ' + spec.tags.exclusiveArchs.join(', '));
    }

    if (spec.tags.excludeOS.length > 0) {
        buffer.add('ExcludeOS: ' + spec.tags.excludeOS.join(', '));
    }

    if (spec.tags.exclusiveOS.length > 0) {
        buffer.add('ExclusiveOS: ' + spec.tags.exclusiveOS.join(', '));
    }

    bufferTagIfExists(buffer, spec, 'prefix', 'Prefix');
    bufferTagIfExists(buffer, spec, 'buildRoot', 'BuildRoot');

    if (spec.tags.sources.length > 0) {
        if (spec.tags.sources.length === 1) {
            buffer.add('Source: ' + spec.tags.sources[0]);
        } else {
            for (i = 0; i < spec.tags.sources.length; i++) {
                buffer.add('Source' + i + ': ' + spec.tags.sources[i]);
            }
        }
    }

    if (spec.tags.noSources.length > 0) {
        buffer.add('NoSource: ' + spec.tags.noSources.join(', '));
    }

    if (spec.tags.patches.length > 0) {
        if (spec.tags.patches.length === 1) {
            buffer.add('Patch: ' + spec.tags.patches[0]);
        } else {
            for (i = 0; i < spec.tags.patches.length; i++) {
                buffer.add('Patch' + i + ': ' + spec.tags.patches[i]);
            }
        }
    }

    if (spec.tags.noPatches.length > 0) {
        buffer.add('NoPatch: ' + spec.tags.noPatches.join(', '));
    }

    buffer.ensureEmptyLine();

    if (spec.tags.description !== null && spec.tags.description.length > 0) {
        buffer
            .add('%description')
            .add(spec.tags.description);
    }

    // Script sections.
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.prep, '%prep', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.build, '%build', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.install, '%install', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.check, '%check', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.clean, '%clean', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.preInstall, '%pre', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.postInstall, '%post', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.preUninstall, '%preun', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.postUninstall, '%postun', true);
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.scripts.verify, '%verifyscript', true);

    // Files section.
    bufferFiles(buffer, spec.files);

    // Changelog section.
    buffer.ensureEmptyLine();
    bufferDirectiveBlock(buffer, spec.other.changelog, '%changelog', true);

    callback(buffer.string(), null);
};
