
#  Copyright (C) 2012  MoSync AB

#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU Affero General Public License as
#  published by the Free Software Foundation, either version 3 of the
#  License, or (at your option) any later version.

#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU Affero General Public License for more details.

#  You should have received a copy of the GNU Affero General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.


#!/usr/bin/ruby

require "FileUtils"

pipeToolPath = ENV['MOSYNCDIR'] + "/bin/pipe-tool"
packagerPath = ENV['MOSYNCDIR'] + "/bin/package"
xgccPath = ENV['MOSYNCDIR'] + "/bin/xgcc"
libs = "mastd.lib MAUtil.lib NativeUI.lib MAFS.lib Wormhole.lib yajl.lib Notification.lib"
outputPath = "Output/Release/"
commonPath = outputPath + "common/"
androidPath = outputPath + "Android/2.x/"
wp7Path = outputPath + "WindowsPhone/7/"
iOSPath = outputPath + "iOS/iPhone/"

packagePath = "Clients/"
androidPackagePath = packagePath + "Android/"
iOSPackagePath = packagePath + "iOS/"
wp7PackagePath = packagePath + "WindowsPhone/"

projectFiles = Dir.entries(".")
cFiles = []
hFiles = []
iconFile = ""
programName = "ReloadClient"

for fileName in projectFiles do
	if(File.extname(fileName) == ".cpp")
		cFiles.push(fileName)
	elsif(File.extname(fileName) == ".h")
		hFiles.push(fileName)
	elsif(File.extname(fileName) == ".icon")
		iconFile = FileUtils.pwd + "/" + fileName
	end
end
puts "Building Stuff............................................"
FileUtils.mkpath([commonPath, androidPath + "package/", iOSPath + "package/", wp7Path + "package/", androidPackagePath, iOSPackagePath, wp7PackagePath]);
system(pipeToolPath + " -appcode=DSFN -R -depend=" + commonPath + "resources.deps "+ commonPath +"resources Resources/Resources.lst")

for fileName in cFiles do
	system(xgccPath + " -o " + commonPath + File.basename(fileName,".cpp") + ".s -S -g -MMD -MF " + commonPath + File.basename(fileName,".cpp") + ".s.deps -DMAPIP -O2 -DPLATFORM_IOS -DVARIANT_IOS_IPHONE " + fileName + " -I" + ENV['MOSYNCDIR'] + "/include -I" + commonPath)
end

sFileListString = ""
for fileName in Dir.entries(commonPath) do
	if(File.extname(fileName) == ".s")
		sFileListString += Dir.getwd + "/" + commonPath + fileName + " "
	end
end

#Android
system(pipeToolPath + " -appcode=DSFN -stabs=stabs.tab -heapsize=3145728 -stacksize=524288 -datasize=4194304 -sld=sld.tab -s" + ENV['MOSYNCDIR'] + "/lib/pipe -B " + Dir.getwd + "/" + commonPath + "program " + sFileListString + libs)
puts("pipe-tool ..............................................................")
system(packagerPath + " -t platform -p " + Dir.getwd + "/" + commonPath + "program -r " + Dir.getwd + "/" + commonPath + "resources -i " + iconFile + " -d " + Dir.getwd + "/" + androidPath + "package -m Android/Android --vendor \"Built with MoSync SDK\" -n " + programName + " --version 1.0 --permissions \"Accelerometer,Bluetooth,Calendar,Camera,Compass,Contacts,File Storage,File Storage/Read,File Storage/Write,Gyroscope,Internet Access,Internet Access/HTTPS,Location,Location/Coarse,Location/Fine,Location/Coarse,Location/Fine,Orientation,Power Management,Proximity,Push Notifications,SMS,Vibration\" --android-package com.mosync.app_" + programName + " --android-version-code 6")
puts("package ..............................................................")

FileUtils.cp_r androidPath + "package/" + programName + ".apk", androidPackagePath, :verbose => true

oldWD = Dir.getwd;
#WP7
Dir.chdir(wp7Path);
system(pipeToolPath + " -appcode=DSFN -stabs=stabs.tab -heapsize=3145728 -stacksize=524288 -datasize=4194304 -sld=sld.tab -s" + ENV['MOSYNCDIR'] + "/lib/pipe -B -cs " + oldWD + "/" + commonPath + "program " + sFileListString + libs)
Dir.chdir(oldWD);
system(packagerPath + " -t platform -p " + commonPath + "program -r " + commonPath + "resources -i " + iconFile + " -d " + wp7Path + "package -m \"Windows Phone/7\" --vendor \"Built with MoSync SDK\" -n " + programName + " --version 1.0 --permissions \"Accelerometer,Bluetooth,Calendar,Camera,Compass,Contacts,File Storage,File Storage/Read,File Storage/Write,Gyroscope,Internet Access,Internet Access/HTTPS,Location,Location/Coarse,Location/Fine,Location/Coarse,Location/Fine,Orientation,Power Management,Proximity,Push Notifications,SMS,Vibration\" --cs-output " + wp7Path + " --wp-project-only --wp-target device --wp-config rebuild_release --wp-guid 3e0fa7b0-3ec6-102f-8003-a9d7f020192f")
FileUtils.cp_r Dir.glob(wp7Path + "package/project/*"), wp7PackagePath, :verbose => true

#iOS
Dir.chdir(iOSPath);
system(pipeToolPath + " -appcode=DSFN -stabs=stabs.tab -heapsize=3145728 -stacksize=524288 -datasize=4194304 -sld=sld.tab -s" + ENV['MOSYNCDIR'] + "/lib/pipe -B -cpp " + oldWD + "/" + commonPath + "program " + sFileListString + libs)
Dir.chdir(oldWD);
system(packagerPath + " -t platform -p " + commonPath + "program -r " + commonPath + "resources -i " + iconFile + " -d " + iOSPath + "package -m iOS/iPhone --vendor \"Built with MoSync SDK\" -n " + programName + " --version 1.0 --permissions \"Accelerometer,Bluetooth,Calendar,Camera,Compass,Contacts,File Storage,File Storage/Read,File Storage/Write,Gyroscope,Internet Access,Internet Access/HTTPS,Location,Location/Coarse,Location/Fine,Location/Coarse,Location/Fine,Orientation,Power Management,Proximity,Push Notifications,SMS,Vibration\" --ios-project-only --ios-cert \"iPhone Developer\" --ios-sdk iphoneos5.0 --ios-xcode-target Release --cpp-output " + iOSPath)
FileUtils.cp_r Dir.glob(iOSPath + "package/xcode-proj/*"), iOSPackagePath, :verbose => true
plist = IO.read(iOSPackagePath + "ReloadClient.plist")
f = File.new(iOSPackagePath + "ReloadClient.plist", 'w');
f.write(plist.gsub(/(<key>UIPrerenderedIcon<\/key>\s*<)false(\/>)/, '\1true\2').gsub(/(<\/dict>\s*<\/plist>)/, "\t<key>UIPrerenderedIcon</key>\n\t<true/>\n\\1"));
f.close;