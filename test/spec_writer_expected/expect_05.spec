Name: easyrpm
Version: 0.0.1
Release: 21
BuildArch: noarch
Summary: Easily create RPM packages.
License: MIT
Epoch: 23
Distribution: grunt
Icon: easyrpm.png
Vendor: EasyRPM Inc.
URL: http://www.google.com/
Group: Applications/Productivity
Packager: Dr. Foo <foo@tardis.com>
Requires(foo): bar = 1.2.3
Requires: quux > 1.6.9, k9 <= 2.0
BuildRequires: bar <= 1.2.3
Provides: virtualeasyrpm = 0.0.1
Conflicts: quux = 1.6.9, baz < 1.2
AutoReqProv: no
ExcludeArch: sparc, alpha
ExclusiveArch: x86, powerpc
ExcludeOS: linux, irix
ExclusiveOS: bsd, solaris
Prefix: /opt/easyrpm
BuildRoot: /tmp/easyrpm
