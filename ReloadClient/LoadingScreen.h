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

/**
 * @file LoadingScreen.h
 *
 *  Created on: Feb 27, 2012
 *      Author: Iraklis Rossis
 */

#ifndef LOADINGSCREEN_H_
#define LOADINGSCREEN_H_

#include "ReloadClient.h"

class ReloadClient;

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

class LoadingScreen : public ButtonListener, public DownloadListener
{
public:
	LoadingScreen(ReloadClient *client);

	void initializeScreen(MAUtil::String &os);

	/**
	 * Called by the system when the user clicks a button
	 * @param button The button that was clicked
	 */
	void buttonClicked(Widget *button);

	/**
	  * This method is called whenever some data was downloaded
	  * @param downloader The downloader that sent the event
	  * @param downloadedBytes The bytes that have been downloaded up to now
	  * @param totalBytes The total bytes to be downloaded
	  */
	 void notifyProgress(Downloader *downloader, int downloadedBytes, int totalBytes);

	/**
	 * Called when the download is complete
	 * @param downloader The downloader who finished it's operation
	 * @param data A handle to the data that was downloaded
	 */
	void finishedDownloading(Downloader* downloader, MAHandle data);

    /**
     * Called when a download operation is canceled
     * @param downloader The downloader that was canceled
     */
    void downloadCancelled(Downloader* downloader){}

    /**
     * Method displays error code in case of error in downloading.
     * @param downloader The downloader that got the error
     * @param code The error code that was returned
     */
    void error(Downloader* downloader, int code){}

    void show();

private:
	Screen *mSplashScreen;

	ActivityIndicator *mIndicator;

	ProgressBar *mProgressBar;

	TextWidget *mCancelDownloadButton;

	ReloadClient *mReloadClient;

};


#endif /* LOADINGSCREEN_H_ */
