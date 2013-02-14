/*
 * MainStackScreen.h
 *
 *  Created on: Feb 1, 2013
 *      Author: spiri
 */

#ifndef MAINSTACKSCREEN_H_
#define MAINSTACKSCREEN_H_

#include <NativeUI/Widgets.h>
using namespace NativeUI;

class MainStackScreen : StackScreen
{
public:
   static StackScreen* getInstance();
private:
   MainStackScreen();
   static StackScreen* pSingleton;
};

#endif /* MAINSTACKSCREEN_H_ */
