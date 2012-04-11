/*
Copyright (C) 2011 MoSync AB

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License,
version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301, USA.
*/


// ReloadLauncher.cpp : Defines the entry point for the console application.
//

#include <string>
#include <Windows.h>

void sh(const char* cmd, const char* shownCmdLine=NULL, bool hideOutput=false) {
	if (!shownCmdLine) {
		printf("%s\n", cmd);
	} else {
		printf("%s\n", shownCmdLine);
	}

	fflush(stdout);
	fflush(stderr);

	std::string finalCmd(cmd);
	if(hideOutput) {
		// Supress output from stdout and stderr
#ifdef WIN32
		finalCmd += "> nul 2>&1";
#else
		finalCmd += "> /dev/null 2>&1";
#endif
	}

	int res = system(finalCmd.c_str());

	fflush(stdout);
	fflush(stderr);
	if(res != 0) {
		char temp[1024];
		sprintf(temp, "System error %i. Have you installed node.js?\n", res);
		MessageBoxA(NULL,temp, "Error", MB_OK); 
		exit(res);
	}
}

int main(int argc, const char* argv[])
{
	sh("cd server");
	sh("start node ReloadServer.js");
	sh("start http://localhost:8282");
	return 0;
}
