/*
 * Convert.cpp
 *
 *  Created on: 24 May 2010
 *      Author: orac7
 */
#include "Convert.h"
#include <mavsprintf.h>
#include "snprintf.h"
#include <mawstring.h>
#include <wchar.h>

Convert::Convert()
{}

Convert::~Convert()
{}

int Convert::toInt(const char* digit)
{
   int sign = 1;
   int result = 0;

   // check sign
   if (*digit == '-')
   {
	  sign = -1;
	  digit++;
   }

   //--- get integer portion
   while (*digit >= '0' && *digit <='9')
   {
	  result = (result * 10) + *digit-'0';
	  digit++;
   }

   //--- set to sign given at the front
   return result * sign;
}

int Convert::toInt(String& input)
{
	return toInt(input.c_str());
}

double Convert::toDouble(String& input)
{
	return toDouble(input.c_str());
}

double Convert::toDouble(const char* input)
{
   int sign = 1;
   double result = 0;
   const char* digit = input;

   // check sign
   if (*digit == '-')
   {
	  sign = -1;
	  digit++;
   }

   //--- get integer portion
   while (*digit >= '0' && *digit <='9')
   {
	  result = (result * 10) + *digit-'0';
	  digit++;
   }

   //--- get decimal point and fraction, if any.
   if (*digit == '.')
   {
	  digit++;
	  double scale = 0.1;
	  while (*digit >= '0' && *digit <='9') {
		 result += (*digit-'0') * scale;
		 scale *= 0.1;
		 digit++;
	  }
   }

   //--- error if we're not at the end of the number
   if (*digit != 0) {
	  return 0.00;
   }

   //--- set to sign given at the front
   return result * sign;
}

time_t Convert::toDateTime(String& input)
{
	return (time_t)toInt(input);
}

String Convert::toString(bool input)
{
	if(input)
		return "1";
	else
		return "0";
}

String Convert::toString(int input)
{
	char buffer[128];
	snprintf(buffer, 128, "%d", input);

	return buffer;
}

String Convert::toString(double input)
{
	char buffer[128];
	snprintf(buffer, 128, "%f", input);

	return buffer;
}

String Convert::toString(const byte* src, size_t count)
{
	//At least enough space, even if every byte turns out to be a single character
	char output[count + 1];
	int ctr = 0;
	while(*src != 0)
	{
		if((*src & 0x80) == 0)
		{
			//ASCII-compatible character
			output[ctr++] = *src++;
		}
		else if((*src & 0xE0) == 0xC0)
		{
			// 2 bytes
			byte b1 = *src++;
			byte b2 = *src++;
			if((b2 & 0xC0) != 0x80)
					break;
			output[ctr++] = ((b1 & 0x1F) << 6) | (b2 & 0x3F);
		}
		else if((*src & 0xF0) == 0xE0)
		{
			// 3 bytes
			byte b1 = *src++;
			byte b2 = *src++;
			byte b3 = *src++;
			if((b2 & 0xC0) != 0x80)
					break;
			if((b3 & 0xC0) != 0x80)
					break;
			output[ctr++] = ((b1 & 0x0F) << 12) | ((b2 & 0x1F) << 6) |
					(b3 & 0x3F);
		}
	}
	output[ctr] = '\0';

	return output;
}

int Convert::hexToInt(const char* input)
{

	int v = 0;
	while (char c = *input++)
	{
		if (c < '0') return 0; //invalid character
		if (c > '9') //shift alphabetic characters down
		{
		if (c >= 'a') c -= 'a' - 'A'; //upper-case 'a' or higher
		if (c > 'Z') return 0; //invalid character
		if (c > '9') c -= 'A'-1-'9'; //make consecutive with digits
		if (c < '9' + 1) return 0; //invalid character
		}
		c -= '0'; //convert char to hex digit value
		v = v << 4; //shift left by a hex digit
		v += c; //add the current digit
	}

	return v;
}
