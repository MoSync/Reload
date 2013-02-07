
#  Copyright (C) 2013  MoSync AB

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
  
require "fileutils"


def sh(command)
  if(!system(command))
    raise("failed to run #{command}")
    exist!(1)
  end
end



#Defince version and timestamp 
version = "1.0"
time_stamp = Time.now.strftime("%Y%m%d-%H%M")[2..-1]

#Write the version information to the file for use in the server  and client
File.open("ReloadServer/build.dat", "w") do |file|
  file.puts("MoSync Reload Version #{version}")
  file.puts(time_stamp);
end

puts "Updating the templates"

FileUtils.cp "#{ENV['MOSYNCDIR']}/templates/HTML5 JS NativeUI Project/index.html", "ReloadServer/templates/NativeUITemplate/LocalFiles/"
FileUtils.cp "#{ENV['MOSYNCDIR']}/templates/HTML5 JS NativeUI Project/wormhole.js", "ReloadServer/templates/NativeUITemplate/LocalFiles/js"
FileUtils.cp "#{ENV['MOSYNCDIR']}/templates/HTML5 JS NativeUI Project/main.cpp", "ReloadServer/templates/NativeUITemplate/LocalFiles/"

FileUtils.cp "#{ENV['MOSYNCDIR']}/templates/HTML5 JS WebUI Project/index.html", "ReloadServer/templates/ReloadTemplate/LocalFiles/"
FileUtils.cp "#{ENV['MOSYNCDIR']}/templates/HTML5 JS WebUI Project/wormhole.js", "ReloadServer/templates/ReloadTemplate/LocalFiles/js"
FileUtils.cp "#{ENV['MOSYNCDIR']}/templates/HTML5 JS WebUI Project/main.cpp", "ReloadServer/templates/ReloadTemplate/LocalFiles/"

puts "making the information files"
FileUtils.cp "ReloadServer/build.dat", "ReloadClient/Resources/information"
FileUtils.cp ENV['MOSYNCDIR'] + "/bin/version.dat", "ReloadServer/MoSyncVersion.dat"
FileUtils.rm_rf "ReloadServer/UI/docs"
FileUtils.cp_r ENV['MOSYNCDIR'] + "/eclipse/plugins/com.mobilesorcery.sdk.help_1.0.0/docs/html5", "ReloadServer/UI/docs"

#build Output Directory
FileUtils.mkdir_p "Build/#{time_stamp}"


puts "building for timestamp #{time_stamp}"

#Build Clients 

FileUtils.cd "ReloadClient"

sh "ruby workfile.rb"

puts "Writing down the debugger info"
FileUtils.cp "Clients/iOS/Classes/MoSyncAppDelegate.mm", "Clients/iOS/Classes/MoSyncAppDelegateBackup.mm" 
initialFile = File.new("Clients/iOS/Classes/MoSyncAppDelegate.mm", "w")
initialFile.puts("\#define JSDEBUG 1")
File.readlines("Clients/iOS/Classes/MoSyncAppDelegateBackup.mm").each do |line|
  initialFile.puts(line)
  if(line.include?("- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {"))
    initialFile.puts("//Adding the debug support for webkit")
    initialFile.puts("\#ifdef JSDEBUG")
  	initialFile.puts("	[NSClassFromString(@\"WebView\") _enableRemoteInspector];")
  	initialFile.puts("\#endif")
  end
end
initialFile.close
FileUtils.rm_rf "Clients/iOS/Classes/MoSyncAppDelegateBackup.mm" 

FileUtils.cd ".."

files_to_copy = [
  "ReloadServer/main.js",
  "ReloadServer/UI",
  "ReloadServer/bin",
  "ReloadServer/templates",
  "ReloadServer/application",
  "ReloadServer/express",
  "ReloadServer/lib",  
  "ReloadServer/build.dat",
  "ReloadServer/MoSyncVersion.dat",
  "ReloadServer/node_modules"
  
  ]


main_dir = FileUtils.pwd

FileUtils.cd "ReloadLauncher/Mac"
if File.exist?("Reload.app")
  FileUtils.rm_rf "Reload.app"
end
sh "platypus -y -P ./Reload.platypus ./Reload.app"

FileUtils.cd main_dir


sh "hdiutil attach ReloadAppTemplates/MoSync_Reload_Template.dmg"
FileUtils.mkdir_p "Build/#{time_stamp}/MoSync_Reload_Windows/server"
FileUtils.mkdir_p "Build/#{time_stamp}/MoSync_Reload_Linux/server"

FileUtils.rm_rf "/Volumes/MoSync Reload/Android Client"
FileUtils.rm_rf "/Volumes/MoSync Reload/iOS Client"
FileUtils.rm_rf "/Volumes/MoSync Reload/WP7 Client"
FileUtils.rm_rf "/Volumes/MoSync Reload/Reload.app"
FileUtils.cp_r "ReloadLauncher/Mac/Reload.app", "/Volumes/MoSync Reload/"

puts "Copying Clients"
FileUtils.cp_r "ReloadClient/Clients/Android", "/Volumes/MoSync Reload/Android Client"
FileUtils.cp_r "ReloadClient/Clients/iOS", "/Volumes/MoSync Reload/iOS Client"
FileUtils.cp_r "ReloadClient/Clients/WindowsPhone", "/Volumes/MoSync Reload/WP7 Client"
FileUtils.cp_r "ReloadClient/Clients/Android", "Build/#{time_stamp}/MoSync_Reload_Windows/Android Client"
FileUtils.cp_r "ReloadClient/Clients/iOS", "Build/#{time_stamp}/MoSync_Reload_Windows/iOS Client"
FileUtils.cp_r "ReloadClient/Clients/WindowsPhone", "Build/#{time_stamp}/MoSync_Reload_Windows/WP7 Client"
FileUtils.cp_r "ReloadClient/Clients/Android", "Build/#{time_stamp}/MoSync_Reload_Linux/Android Client"
FileUtils.cp_r "ReloadClient/Clients/iOS", "Build/#{time_stamp}/MoSync_Reload_Linux/iOS Client"
FileUtils.cp_r "ReloadClient/Clients/WindowsPhone", "Build/#{time_stamp}/MoSync_Reload_Linux/WP7 Client"

puts "Copying Readme"
FileUtils.cp_r "ReadMe.txt", "/Volumes/MoSync Reload/"
FileUtils.cp_r "ReadMe.txt", "Build/#{time_stamp}/MoSync_Reload_Windows"
FileUtils.cp_r "ReadMe.txt", "Build/#{time_stamp}/MoSync_Reload_Linux"

FileUtils.cp_r "Licenses", "/Volumes/MoSync Reload/"
FileUtils.cp_r "Licenses", "Build/#{time_stamp}/MoSync_Reload_Windows"
FileUtils.cp_r "Licenses", "Build/#{time_stamp}/MoSync_Reload_Linux"



files_to_copy.each { |item|
  FileUtils.cp_r item, "Build/#{time_stamp}/MoSync_Reload_Windows/server"
  FileUtils.cp_r item, "Build/#{time_stamp}/MoSync_Reload_Linux/server"
}
sh "cp -rf ReloadAppTemplates/MoSync_Reload_Windows/* Build/#{time_stamp}/MoSync_Reload_Windows"
sh "cp -rf ReloadAppTemplates/MoSync_Reload_Linux/* Build/#{time_stamp}/MoSync_Reload_Linux"

puts "creating final Mac Package"
sh "hdiutil detach -force /Volumes/MoSync\\ Reload/"
sh "hdiutil convert  ReloadAppTemplates/MoSync_Reload_Template.dmg -format UDZO -imagekey zlib-level=9 -o  Build/#{time_stamp}/MoSync_Reload_OSX_#{time_stamp}.dmg"

puts "Creating final Windows Package"
FileUtils.cd "Build/#{time_stamp}"
sh "zip -9r MoSync_Reload_Windows_#{time_stamp}.zip MoSync_Reload_Windows"

puts "Creating final Linux Package"

sh "tar -jcvf MoSync_Reload_Linux_#{time_stamp}.tar.bz2 MoSync_Reload_Linux"
