#!/usr/bin/ruby

require File.expand_path(ENV['MOSYNCDIR']+'/rules/mosync_exe.rb')

work = PipeExeWork.new
work.instance_eval do
	@SOURCES = ['.']
	@SPECIFIC_CFLAGS = {
		'snprintf.c' => ' -Wno-sign-compare',
	}
	@LSTFILES = ['Resources/Resources.lst']
	@LIBRARIES = ['mautil', 'wormhole', 'mafs', 'nativeui', 'yajl', 'Notification']
	@EXTRA_LINKFLAGS = standardMemorySettings(14)
	@PACK_ICON = 'ReloadClient.icon'
	@NAME = 'ReloadClient'
end

target :default do
	work.invoke
end

target :all do
	[
		'WindowsPhone/7',
		'Apple/iPhone',
		'Android/Android',
	].each do |t|
		Work.invoke_subdir_ex2(File.basename(__FILE__), false, '.', "PACK=#{t}")
	end
end

Targets.invoke
