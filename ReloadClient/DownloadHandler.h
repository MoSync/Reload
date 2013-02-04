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
	int cancelDownload();

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
	MAUtil::Downloader mDownloader;
};

#endif
