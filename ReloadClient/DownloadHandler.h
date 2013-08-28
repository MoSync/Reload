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
 * @file DownloadHandler.h
 *
 * Helpers for managing app download
 * from the the Reload server.
 *
 * Author: Mikael Kindborg
 */

#ifndef MOSYNC_RELOAD_DOWNLOAD_HANDLER_H
#define MOSYNC_RELOAD_DOWNLOAD_HANDLER_H

#include <MAUtil/String.h>
#include <MAUtil/Vector.h>
#include <MAUtil/Downloader.h>

/**
 * Abstract class that communicates back download events to the client.
 */
class DownloadHandlerListener
{
public:
	/**
	 * A data object has successfully been downloaded.
	 * @param data Handle to data, must be deallocated by client
	 * (ownership transfered to the client).
	 */
	virtual void downloadHandlerSuccess(MAHandle data) = 0;

	/**
	 * There was a download error.
	 */
	virtual void downloadHandlerError(int code) = 0;
};

/**
 * Class that handles app data download in the ReloadClient.
 */
class DownloadHandler :
	public MAUtil::DownloadListener
{
public:
	// ========== Construction/destruction ==========

	/**
	 * Constructor.
	 */
	DownloadHandler();

	/**
	 * Destructor.
	 */
	virtual ~DownloadHandler();

	// ========== High-level public protocol ==========

	/**
	 * Set client who will get callbacks for download events.
	 */
	void setListener(DownloadHandlerListener* listener);

	/**
	 * Add extra download listener.
	 */
	void addDownloadListener(MAUtil::DownloadListener* listener);

	/**
	 * Check if a download is in progress.
	 * @return true if there is a download in progress,
	 * false if not.
	 */
	bool isDownloading();

	/**
	 * Download data from the server.
	 */
	int startDownload(const char* url);

	/**
	 * Cancel any ongoing download.
	 */
	void cancelDownload();


public:

	// ========== Inherited DownloadListener protocol ==========

    /**
     * Called when a download operation is canceled
     * @param downloader The downloader that was canceled
     */
    void downloadCancelled(MAUtil::Downloader* downloader);

    /**
     * Method displays error code in case of error in downloading.
     * @param downloader The downloader that got the error
     * @param code The error code that was returned
     */
    void error(MAUtil::Downloader* downloader, int code);

    /**
     * Called when the download is complete
     * @param downloader The downloader who finished it's operation
     * @param data A handle to the data that was downloaded.
     */
    void finishedDownloading(MAUtil::Downloader* downloader, MAHandle data);


protected:

	// ========== Instance variables ==========

	/**
	 * Object that listens for downloaded data.
	 */
    DownloadHandlerListener* mListener;

	/**
	 * Downloader for bundles.
	 */
	MAUtil::Downloader *mDownloader;

	DownloadListener* mDownloadListener;

	bool isCanceled;

};

#endif
