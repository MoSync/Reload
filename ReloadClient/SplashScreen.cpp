/*
Copyright (C) 2013 MoSync AB

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

/*
 * SplashScreen.cpp
 *
 *  Created on: May 2, 2013
 *      Author: Kostas Tsolakis
 */

#include <NativeUI/Widgets.h>
#include "SplashScreen.h"
#include "MAHeaders.h"

using namespace MAUtil;
using namespace NativeUI;

SplashScreen::SplashScreen() : Screen()
{
	// Get Orientation, OS, Screen dimensions
	int orientation = maScreenGetCurrentOrientation();

	char buffer[64];
	maGetSystemProperty(
		"mosync.device.OS",
		buffer,
		64);
	MAUtil::String os = buffer;

	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);
	int baseSize;
	if (orientation == MA_SCREEN_ORIENTATION_PORTRAIT_UP ||
			orientation == MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN)
	{
		baseSize = screenWidth;
	}
	else
	{
		baseSize = screenHeight;
	}

	mContainer = new VerticalLayout();
	mContainer->fillSpaceHorizontally();
	mContainer->fillSpaceVertically();
	mContainer->setChildHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mContainer->setChildVerticalAlignment(MAW_ALIGNMENT_CENTER);
	if(os.find("iPhone") >= 0)
	{
		mContainer->setBackgroundColor(0x000000);
	}

	mReloadImage = new Image();
	mReloadImage->setImage(LOGO_IMAGE);
	mReloadImage->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mReloadImage->setWidth((int)((float)baseSize * 0.8));

	mPoweredBy = new Label();
	mPoweredBy->setText("powered by");
	if(os.find("iPhone") >= 0)
	{
		mPoweredBy->setFontColor(0xffffff);
	}
	mPoweredBy->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mPoweredBy->fillSpaceHorizontally();

	mMosyncImage = new Image();
	mMosyncImage->setImage(MOSYNC_IMAGE);
	mMosyncImage->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mMosyncImage->setWidth((int)((float)baseSize * 0.4));

	mContainer->addChild(mReloadImage);
	mContainer->addChild(mPoweredBy);

	/**
	 * On WP the mosync logo does not align vertically in the center.
	 * Create a layout and align it inside the layout instead
	 */
	if(os.find("Windows") >= 0)
	{
		mMosync = new HorizontalLayout();
		mMosync->setWidth((int)((float)baseSize * 0.8));
		((HorizontalLayout *)mMosync)->setChildHorizontalAlignment(MAW_ALIGNMENT_CENTER);
		mMosync->addChild(mMosyncImage);
	}
	else
	{
		mMosync = (Widget*)mMosyncImage;
	}
	mContainer->addChild(mMosync);

	this->addChild(mContainer);
	this->setMainWidget(mContainer);
}

SplashScreen::~SplashScreen()
{
	delete mReloadImage;
	delete mMosyncImage;
	delete mPoweredBy;
	delete mContainer;
}


