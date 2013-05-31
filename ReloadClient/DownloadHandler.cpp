/*
Copyright (C) 2012 MoSync AB

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
