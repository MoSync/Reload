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
 * @file DownloadHandler.cpp
 *
 * Helpers for managing app download
 * from the the Reload server.
 *
 * Author: Mikael Kindborg
 */

#include "DownloadHandler.h"
#include "Log.h"

using namespace MAUtil;

// ========== Construction/destruction ==========

DownloadHandler::DownloadHandler()
{
	isCanceled = false;
	//	mDownloader = new MAUtil::Downloader;

	//mDownloader->addDownloadListener(this);
}

DownloadHandler::~DownloadHandler()
{
	//delete mDownloader;
}

// ========== High-level public protocol ==========

void DownloadHandler::setListener(DownloadHandlerListener* listener)
{
	mListener = listener;
}



void DownloadHandler::addDownloadListener(DownloadListener* listener)
{
	//mDownloader->addDownloadListener(listener);
	mDownloadListener = listener;
}

bool DownloadHandler::isDownloading()
{
	return mDownloader->isDownloading();
}

int DownloadHandler::startDownload(const char* url)
{
	// Do not start if there already is a download in progress.
	/*if (mDownloader->isDownloading())
	{
		return -1;
	}*/
	if(mDownloader != NULL)
	{
		mDownloader->removeDownloadListener(mDownloadListener);
	}
	isCanceled = false;
	Downloader * downloader = new Downloader();
	mDownloader = downloader;
	mDownloader->addDownloadListener(this);
	mDownloader->addDownloadListener(mDownloadListener);
	int result = mDownloader->beginDownloading(url);

	return result;
}

void DownloadHandler::cancelDownload()
{
	isCanceled = true;
}

// ========== DownloadListener protocol ==========

/**
 * Called when a download operation is canceled
 * @param downloader The downloader that was canceled
 */
void DownloadHandler::downloadCancelled(Downloader* downloader)
{
	LOG("@@@ RELOAD: downloadCancelled");
}

/**
 * Method displays error code in case of error in downloading.
 * @param downloader The downloader that got the error
 * @param code The error code that was returned
 */
void DownloadHandler::error(Downloader* downloader, int code)
{
	if(downloader != mDownloader)
	{
		delete downloader;
		return;
	}
	mListener->downloadHandlerError(code);
}

/**
 * Called when the download is complete
 * @param downloader The downloader who finished it's operation
 * @param data A handle to the data that was downloaded
 */
void DownloadHandler::finishedDownloading(Downloader* downloader, MAHandle data)
{
	if(downloader != mDownloader)
	{
		return;
	}

	if(!isCanceled)
	{
		mListener->downloadHandlerSuccess(data);
	}
}
