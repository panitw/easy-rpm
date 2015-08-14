Name: easyrpm
Version: 0.0.1
Release: 21
BuildArch: noarch

%files
%config "/opt/easyrpm/package.json"
"/opt/easyrpm/foo.c"
%config(noreplace) "/opt/easyrpm/more.conf"
%config(noreplace) "/opt/easyrpm/third.json"
