var Spec = function() {
  this.tags = {
    // The name tag is used to define the name of the software being packaged.
    // In most (if not all) cases, the name used for a package should be
    // identical in spelling and case to the software being packaged. The name
    // cannot contain any whitespace: If it does, RPM will only use the first
    // part of the name (up to the first space).
    name: null,

    // The version tag defines the version of the software being packaged. The
    // version specified should be as close as possible to the format of the
    // original software's version. In most cases, there should be no problem
    // specifying the version just as the software's original developer did.
    // However, there is a restriction. There can be no dashes in the version.
    // Spaces in the version will also cause problems, in that anything after
    // the first space will be ignored by RPM. Bottom line: Stick with
    // alphanumeric characters and periods, and you'll never have to worry
    // about it.
    version: null,

    // The release tag can be thought of as the package's version. The release
    // is traditionally an integer — for example, when a specific piece of
    // software at a particular version is first packaged, the release should
    // be "1". If it is necessary to repackage that software at the same
    // version, the release should be incremented. When a new version of the
    // software becomes available, the release should drop back to "1" when it
    // is first packaged.
    release: null,

    // Can span multiple lines. If a line starts with a space, that line will
    // be displayed verbatim by RPM. Lines that do not start with a space are
    // assumed to be part of a paragraph and will be formatted by RPM. It's
    // even possible to mix and match formatted and unformatted lines.
    description: null,

    // The summary tag is used to define a one-line description of the
    // packaged software.
    summary: null,

    // The license tag is used to define the license terms applicable to
    // the software being packaged.  This is also known as the copyright tag.
    license: null,

    // The epoch tag is another part of RPM's dependency upgrade processing.
    // Consult the documentation on the RPM spec for its use.  It should be
    // an integer value.
    epoch: null,

    // The distribution tag is used to define a group of packages, of which
    // this package is a part.
    distribution: null,

    // The vendor tag is used to define the name of the entity that is
    // responsible for packaging the software. Normally, this would be the name
    // of an organization.
    vendor: null,

    // The url tag is used to define a Uniform Resource Locator that can be
    // used to obtain additional information about the packaged software. At
    // present, RPM doesn't actively make use of this tag. The data is stored
    // in the package however, and will be written into RPM's database when the
    // package is installed.
    url: null,

    // The group tag is used to group packages together by the types of
    // functionality they provide. The group specification looks like a path
    // and is similar in function, in that it specifies more general groupings
    // before more detailed ones.
    group: null,

    // The packager tag is used to hold the name and contact information for
    // the person or persons who built the package. Normally, this would be the
    // person that actually built the package, or in a larger organization, a
    // public relations contact.
    packager: null,

    // The requires tag is used to alert RPM to the fact that the package needs
    // to have certain capabilities available in order to operate properly.
    // These capabilities refer to the name of another package, or to a virtual
    // package provided by one or more packages that use the provides tag. When
    // the requires tag references a package name, version comparisons may also
    // be included by following the package name with <, >, =, >=, or <=, and a
    // version specification. To get even more specific, a package's release
    // may be included as well.
    requires: [],

    // The conflicts tag is the logical complement to the requires tag. The
    // requires tag is used to specify what packages must be present in order
    // for the current package to operate properly. The conflicts tag is used
    // to specify what packages cannot be installed if the current package is
    // to operate properly.
    conflicts: [],

    // The autoreqprov, autoreq, and autoprov tags are used to control the
    // automatic dependency processing performed when the package is being
    // built. When both of these are set to false, the AutoReqProv tag is
    // instead set to 'no'.
    autoReq: true,
    autoProv: true,

    // The excludearch tag directs RPM to ensure that the package does not
    // attempt to build on the excluded architecture(s). One or more
    // architectures may be specified after the excludearch tag, separated by
    // either spaces or commas.
    excludeArchs: [],

    // The exclusivearch tag is used to direct RPM to ensure the package is
    // only built on the specified architecture(s). One or more architectures
    // may be specified after the exclusivearch tag, separated by either spaces
    // or commas.
    exclusiveArchs: [],

    // The excludeos tag is used to direct RPM to ensure that the package does
    // not attempt to build on the excluded operating system(s).
    excludeOS: [],

    // The exclusiveos tag has the same syntax as excludeos, but it has the
    // opposite logic. The exclusiveos tag is used to denote which operating
    // system(s) should only be be permitted to build the package.
    exclusiveOS: [],

    // The prefix tag is used when a relocatable package is to be built.
    // A relocatable package can be installed normally or can be installed in
    // a user-specified directory, by using RPM's --prefix install-time option.
    // The data specified after the prefix tag should be the part of the
    // package's path that may be changed during installation.
    prefix: null,

    // The buildroot tag is used to define an alternate build root. The name is
    // a bit misleading, as the build root is actually used when the software
    // is installed during the build process. In order for a build root to be
    // defined and actually used, a number of issues must be taken into account.
    // See http://www.rpm.org/max-rpm-snapshot/ch-rpm-anywhere.html
    buildRoot: null,

    // Effectively points to the source locations provided by the developer(s).
    // It is best to read about this at:
    // http://www.rpm.org/max-rpm-snapshot/s1-rpm-inside-tags.html
    sources: [],

    // The nosource tag is used to direct RPM to omit one or more source files
    // from the source package.  More information at:
    // http://www.rpm.org/max-rpm-snapshot/s1-rpm-inside-tags.html
    noSources: [],

    // The patch tag is used to identify which patches are associated with the
    // software being packaged. The patch files are kept in RPM's SOURCES
    // directory, so only the name of the patch file should be specified.
    patches: [],

    // Just like the nosource tag, the nopatch tag is used to direct RPM to
    // omit something from the source package. In the case of nosource, that
    // "something" was one or more sources. For the nopatch tag, the
    // "something" is one or more patches.
    noPatches: []
  };
};

/**
 * Adds the contents of args, which should be an Arguments object, to the
 * tag specified by tagName.  If the tagName property does not exist on the
 * spec.tags object, or it is not an array, an error is thrown.
 */
Spec.prototype._bulkAddToTag = function(tagName, args) {
  if (this.tags.hasOwnProperty(tagName) &&
      this.tags[tagName].constructor === Array) {
    var tagArray = this.tags[tagName], i;
    for (i = 0; i < args.length; i++) {
      tagArray.push(args[i]);
    }
  } else {
    throw new Error('Tag property must exist and must be an array.');
  }
};

Spec.prototype.addRequirements = function() {
  this._bulkAddToTag('requires', arguments);
};

Spec.prototype.addConflicts = function() {
  this._bulkAddToTag('conflicts', arguments);
};

Spec.prototype.addExcludeArchs = function() {
  this._bulkAddToTag('excludeArchs', arguments);
};

Spec.prototype.addExclusiveArchs = function() {
  this._bulkAddToTag('exclusiveArchs', arguments);
};

Spec.prototype.addExcludeOS = function() {
  this._bulkAddToTag('excludeOS', arguments);
};

Spec.prototype.addExclusiveOS = function() {
  this._bulkAddToTag('exclusiveOS', arguments);
};

Spec.prototype.addSources = function() {
  this._bulkAddToTag('sources', arguments);
};

Spec.prototype.addNoSources = function() {
  this._bulkAddToTag('noSources', arguments);
};

Spec.prototype.addPatches = function() {
  this._bulkAddToTag('patches', arguments);
};

Spec.prototype.addNoPatches = function() {
  this._bulkAddToTag('noPatches', arguments);
};

module.exports = Spec;
