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


