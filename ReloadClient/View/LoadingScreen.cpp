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
 * LoadingScreen.cpp
 *
 *  Created on: Feb 27, 2012
 *      Author: Iraklis Rossis
 */

#include "LoadingScreen.h"
#include "../Log.h"

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

LoadingScreen::LoadingScreen(ReloadClient *client)
{
	mReloadClient = client;
}

void LoadingScreen::initializeScreen(MAUtil::String &os)
{
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	mSplashScreen = new Screen();
	mSplashScreen->setBackgroundColor(40,40,40);

	//Layout that holds the screen elements
	RelativeLayout* relativeLayout = new RelativeLayout();
	relativeLayout->setSize(screenWidth, screenHeight);

	//The huge Reload "Circle"
	Image* logo = new Image();
	logo->setImage(SPLASH_IMAGE);
	logo->setSize(screenWidth,screenWidth);
	logo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);

	//Indicator placed on top of the reload circle
	mIndicator = new ActivityIndicator();
	mIndicator->show();

	//Progress bar for the download
	mProgressBar = new ProgressBar();
	mProgressBar->setWidth((int)(screenWidth * 0.75));
	mProgressBar->setMaximumValue(100);

	//Padding between the progress bar and the cancel button
	HorizontalLayout *paddingLayout = new HorizontalLayout();
	paddingLayout->setHeight(screenHeight / 36);

	//the cancel button stops the download and returns the user
	//to the login screen
	if(os == "Android")
	{
		mCancelDownloadButton = new Button();
		((Button*)mCancelDownloadButton)->addButtonListener(this);
	}
	else
	{
		mCancelDownloadButton = new ImageButton();
		((ImageButton*)mCancelDownloadButton)->addButtonListener(this);
		((ImageButton*)mCancelDownloadButton)->setBackgroundImage(RELOAD_BG);
		mCancelDownloadButton->setFontColor(0x000000);
	}

	mCancelDownloadButton->setText("Cancel");
	mCancelDownloadButton->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mCancelDownloadButton->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	mCancelDownloadButton->setWidth((int)(screenWidth * 0.75));
	mCancelDownloadButton->setHeight((int)(screenHeight * 0.1));

	//Spacing between the cancel button and the bottom of the screen
	HorizontalLayout *paddingLayout2 = new HorizontalLayout();
	paddingLayout2->setHeight(screenHeight / 15);

	VerticalLayout* logolayout = new VerticalLayout();
	logolayout->setSize(screenWidth, screenHeight);
	logolayout->setChildHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	logolayout->setChildVerticalAlignment(MAW_ALIGNMENT_CENTER);
	logolayout->addChild(logo);

	VerticalLayout* activitylayout = new VerticalLayout();
	activitylayout->setSize(screenWidth, screenHeight);
	activitylayout->setChildHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	activitylayout->setChildVerticalAlignment(MAW_ALIGNMENT_CENTER);
	activitylayout->addChild(mIndicator);

	VerticalLayout* progresslayout = new VerticalLayout();
	progresslayout->setSize(screenWidth, screenHeight);
	progresslayout->setChildHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	progresslayout->setChildVerticalAlignment(MAW_ALIGNMENT_BOTTOM);
	progresslayout->addChild(mProgressBar);
	progresslayout->addChild(paddingLayout);
	progresslayout->addChild(mCancelDownloadButton);
	progresslayout->addChild(paddingLayout2);

	relativeLayout->addChild(logolayout);
	relativeLayout->addChild(activitylayout);
	relativeLayout->addChild(progresslayout);
	mSplashScreen->setMainWidget(relativeLayout);
}

/**
 * Called by the system when the user clicks a button
 * @param button The button that was clicked
 */
void LoadingScreen::buttonClicked(Widget *button)
{
	if(button == mCancelDownloadButton)
	{
		//Cancel the download and go back to the login screen
		mReloadClient->cancelDownload();
		mIndicator->hide();
	}
}

/**
 * This method is called whenever some data was downloaded
 * @param downloader The downloader that sent the event
 * @param downloadedBytes The bytes that have been downloaded up to now
 * @param totalBytes The total bytes to be downloaded
 */
void LoadingScreen::notifyProgress(Downloader *downloader, int downloadedBytes, int totalBytes)
{
	mProgressBar->setProgress((int)(((float)downloadedBytes / totalBytes) * 100));
}

/**
 * Called when the download is complete
 * @param downloader The downloader who finished it's operation
 * @param data A handle to the data that was downloaded
 */
void LoadingScreen::finishedDownloading(Downloader* downloader, MAHandle data)
{
	mIndicator->hide(); //Needed for android to animate correctly
}

/**
 * Called when a download operation is canceled
 * @param downloader The downloader that was canceled
 */
void LoadingScreen::downloadCancelled(Downloader* downloader)
{
	LOG("@@@ LoadingScreen::downloadCancelled");
}

/**
 * Method displays error code in case of error in downloading.
 * @param downloader The downloader that got the error
 * @param code The error code that was returned
 */
void LoadingScreen::error(Downloader* downloader, int code)
{
	LOG("@@@ LoadingScreen::error");
}

void LoadingScreen::show()
{
	mSplashScreen->show();
	mIndicator->show(); //Needed for Android indicator to animate
	mProgressBar->setProgress(50);
}
