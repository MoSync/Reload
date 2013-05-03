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
	maScreenSetFullscreen(1);
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	RelativeLayout *mContainer = new RelativeLayout();
	mContainer->fillSpaceHorizontally();
	mContainer->fillSpaceVertically();
	mContainer->setBackgroundColor(0x000000);

	Image * mReloadImage = new Image();
	mReloadImage->setImage(LOGO_IMAGE);
	mReloadImage->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mReloadImage->setWidth(screenWidth);
	lprintfln("@@@ RELOAD: height=%d", mReloadImage->getHeight());
	mReloadImage->setPosition(0, (int)((float)screenHeight*0.3));

	Label * mPoweredBy = new Label();
	mPoweredBy->setText("powered by");
	mPoweredBy->setFontColor(0xffffff);
	mPoweredBy->setWidth(screenWidth);
	mPoweredBy->setPosition(0,(int)((float)screenHeight*0.3)+(int)((float)screenHeight*0.15));
	mPoweredBy->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);

	Image * mMosyncImage = new Image();
	mMosyncImage->setImage(MOSYNC_IMAGE);
	mMosyncImage->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mMosyncImage->setWidth((int)((float)screenWidth * 0.3));
	mMosyncImage->setPosition((int)((float)screenWidth * 0.35),
							 (int)((float)screenHeight*0.3)+(int)((float)screenHeight*0.15)+(int)((float)screenHeight*0.07));

	mContainer->addChild(mReloadImage);
	mContainer->addChild(mPoweredBy);
	mContainer->addChild(mMosyncImage);

	this->addChild(mContainer);
}

SplashScreen::~SplashScreen()
{
	delete mReloadImage;
	delete mMosyncImage;
	delete mPoweredBy;
	delete mContainer;
}


