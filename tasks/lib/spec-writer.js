var LineBuffer = function() {
  this.lines = [];
};

LineBuffer.prototype.add = function(line) {
  this.lines.push(line);
  return this;
};

LineBuffer.prototype.newline = function() {
  this.lines.push('');
  return this;
};

LineBuffer.prototype.string = function() {
  return this.lines.join('\n');
};

function bufferTagIfExists(buffer, spec, tag, label) {
  if (spec.tags.hasOwnProperty(tag)) {
    var value = spec.tags[tag];
    if (value !== null && value.length > 0) {
      buffer.add(label + ': ' + value);
    }
  }
}

module.exports = function(spec, callback) {
  var buffer = new LineBuffer();

  buffer
    .add('Name: ' + spec.tags.name)
    .add('Version: ' + spec.tags.version)
    .add('Release: ' + spec.tags.release);

  bufferTagIfExists(buffer, spec, 'summary', 'Summary');
  bufferTagIfExists(buffer, spec, 'copyright', 'Copyright');
  bufferTagIfExists(buffer, spec, 'distribution', 'Distribution');
  bufferTagIfExists(buffer, spec, 'icon', 'Icon');
  bufferTagIfExists(buffer, spec, 'vendor', 'Vendor');
  bufferTagIfExists(buffer, spec, 'group', 'Group');
  bufferTagIfExists(buffer, spec, 'packager', 'Packager');

  if (spec.tags.requires.length > 0) {
    buffer.add('Requires: ' + spec.tags.requires.join(', '));
  }

  if (spec.tags.conflicts.length > 0) {
    buffer.add('Conflicts: ' + spec.tags.conflicts.join(', '));
  }

  if (spec.tags.autoReqProv === false) {
    buffer.add('AutoReqProv: no');
  }
  
  if (spec.tags.description !== null && spec.tags.description.length > 0) {
    buffer
      .newline()
      .add('%description')
      .add(spec.tags.description)
      .newline();
  }

  callback(buffer.string(), null);
};
