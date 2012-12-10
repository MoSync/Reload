/* Customization of JavaScript libs for ReloadClient */
/* When called from C++ the value for param appPath is supplied */
(function(appPath)
{
	try
	{
		/* Modify the URL if it is a relative URL */
		var patchURL=function(url)
		{
			if (url.match(/^(http|https|javascript):\/\//))
			{
				return url;
			}
			else
			{
				return appPath+url;
			}
		};
		/* Modify maWidgetSetProperty to add app path to URLs */
		if (!mosync.nativeui.maWidgetSetPropertyOld)
		{
			mosync.nativeui.maWidgetSetPropertyOld = mosync.nativeui.maWidgetSetProperty;
			mosync.nativeui.maWidgetSetProperty = function(
				widgetID,property,value,successCallback,errorCallback,processedCallback)
			{
				if('url'===property){value=patchURL(value)}
				mosync.nativeui.maWidgetSetPropertyOld(
					widgetID,property,value,successCallback,errorCallback,processedCallback);
			};
		}
		/* Modify maWidgetCreate to add app path to URLs */
		if(!mosync.nativeui.maWidgetCreateOld)
		{
			mosync.nativeui.maWidgetCreateOld = mosync.nativeui.maWidgetCreate;
			mosync.nativeui.maWidgetCreate = function(
				widgetType,widgetID,successCallback,errorCallback,processedCallback,properties)
			{
				var url=properties['url'];
				if(url){properties['url']=patchURL(url)}
				mosync.nativeui.maWidgetCreateOld(
					widgetType,widgetID,successCallback,errorCallback,processedCallback,properties);
			};
		}
		/* TODO: Delete commented out code below */
		/* Modify loadImage to add app path to urls */
		/*if (!mosync.resource.loadImageOld)
		{
			mosync.resource.loadImageOld = mosync.resource.loadImage;
			mosync.resource.loadImage = function(imagePath,imageID,successCallback)
			{
				console.log('@@@ mosync.resource.loadImage imagePath: ' + imagePath);
				mosync.resource.loadImageOld(imagePath,imageID,successCallback);
			};
		}*/
		/* Modify PhoneGap function LocalFileSystem.prototype._castFS to use app path */
		/*if (!LocalFileSystem.prototype._castFSOld)
		{
			LocalFileSystem.prototype._castFSOld = LocalFileSystem.prototype._castFS;
			LocalFileSystem.prototype._castFS = function(pluginResult)
			{
				pluginResult.message.root.fullPath+='/'+appPath;
				this._castFSOld(pluginResult);
			};
		}*/
		/* Modify PhoneGap function LocalFileSystem.prototype._castEntry to use app path */
		/*if (!LocalFileSystem.prototype._castEntryOld)
		{
			LocalFileSystem.prototype._castEntryOld = LocalFileSystem.prototype._castEntry;
			LocalFileSystem.prototype._castEntry = function(pluginResult)
			{
				pluginResult.message.fullPath+='/'+appPath;
				this._castEntryOld(pluginResult);
			};
		}*/
	}
	catch(e){console.log('@@@ ReloadClient: Error in custom.js: '+e)}
})