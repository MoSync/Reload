/* Copyright 2013 David Axmark

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
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
    void downloadCancelled(Downloader* downloader);

    /**
     * Method displays error code in case of error in downloading.
     * @param downloader The downloader that got the error
     * @param code The error code that was returned
     */
    void error(Downloader* downloader, int code);

    void show();

private:
	Screen *mSplashScreen;

	ActivityIndicator *mIndicator;

	ProgressBar *mProgressBar;

	TextWidget *mCancelDownloadButton;

	ReloadClient *mReloadClient;

};


#endif /* LOADINGSCREEN_H_ */
