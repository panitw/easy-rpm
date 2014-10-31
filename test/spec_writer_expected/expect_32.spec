Name: easyrpm
Version: 0.0.1
Release: 21
BuildArch: noarch

%files
%attr(666, -, baseballfury) "/fileA"
%attr(662, bazbaz, -) "/fileB"
%attr(-, jimmy, theorphans) "/fileC"
%attr(777, u, g) "/fileD"
