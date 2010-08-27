/**
	Authorisation-related functions
*/
var Auth = {
	/**
		A prefix used to identify Auth-related HTML elements
	*/
	typePrefix: 'auth',
	/**
		Based on an XML response, checks to see if it contains a link to the authorisation page (is not suthorised).
		@param xml - the XML
		@return isAuthorised
	*/
	isAuthorised: function( xml ){
		var comparison = 'Authorise to get';
		return $( xml ).find('BUTTON_TOOLTIP').text().indexOf( comparison ) === -1 ? true : false;
	},
	/**
		Based on a xml response, checks to see if it is null (too many requests have been made, causing you to be blocked from Jagex's servers)
		@param xhr - the XHR
		@return isBlocked - boolean
	*/
	isBlocked: function( xml ){
		if( XMLToString( xml ).indexOf('parsererror') !== -1 ){
			return true;
		}
		return false;
	},
	/**
		Checks to see if the response data indicates that the user has been blocked.
		@param xml
		@param typePrefix - a prefix used to identify HTML elements relating to that object
		@return A boolean saying whether or not you're blocked
	*/
	checkBlock: function( xml, typePrefix ){
		if( Auth.isBlocked( xml ) ){
			if( typeof Auth.displayBlockedInfo === 'function' ){
				Auth.displayBlockedInfo( typePrefix );
			}
			return true;
		}
		if( typeof Auth.hideBlockedInfo === 'function' ){
			Auth.hideBlockedInfo( typePrefix );
		}
		return false;
	},
	/**
		Opens up the authorisation page in a new tab.
	*/
	openAuthPage: function(){
		Browser.openTab( 'http://services.runescape.com/m=toolbar/authorise.ws' );
	},
	/**
		Opens up the unauthorisation page in a new tab.
	*/
	openUnauthPage: function(){
		Browser.openTab( 'http://services.runescape.com/m=toolbar/unauthorise.ws' );
	}
};

/**
	Various browser-related functions
*/
var Browser = {
	/**
		The default tooltip
	*/
	defaultTooltip: 'RuneScape Notifier',
	/**
		Opens a new tab
		@param URL - the URL to open in the new tab
	*/
	openTab: function( URL ){
		var tabConfig = {
			url: URL
		};
		chrome.tabs.create( tabConfig );
	},
	/**
		Set the badge text for the icon
		@param text - the text to display (will show up to ~4 characters)
	*/
	setBadgeText: function( text ){
		if( text === '0' ){
			text = '';
		}
		var details = {
			text: text
		};
		chrome.browserAction.setBadgeText( details );
	},
	/**
		Set the title of the browser action (the tooltip when you hover over the extension icon)
		@param text - the text to display
	*/
	setBadgeTooltip: function( text ){
		var details = {
			title: text
		};
		chrome.browserAction.setTitle( details );
	},
	/**
		Works out the text to go in the icon tooltip based on feed data
		@return text - the text to go in the tooltip
	*/
	workOutBadgeTooltipText: function(){
		var GEObj = GE.parseOffers( GE.fetchDataFromStorage() );
		var GECompleted = GE.countCompletedOffers( GEObj );
		var GETotal = GE.getRunningOffers( GEObj );
		
		var ActObj = Activities.parseActivities( Activities.fetchDataFromStorage() );
		var ActTotal = Activities.countTotalActivities( ActObj );
		var ActAvailable = Activities.countAvailableActivities( ActObj );
		
		var tooltip = Browser.defaultTooltip + ' - ' + GECompleted + '/' + GETotal + ' GE offers completed. ';
		tooltip += ActAvailable + '/' + ActTotal + ' Activities available.';
		
		return tooltip;
	},
	/**
		Shows a browser notification
		@param title - the title string
		@param body - the main notification text
		@param iconType - the 'type' part of the URL of the icon to display
	*/
	notification: function( title, body, iconType ){
		if( NotificationOpts.fetchSetting() === 'true' ){
			var notification = webkitNotifications.createNotification(
				'img/notification_icon_' + iconType + '.png',  // icon url - can be relative
				title,  // notification title
				body  // notification body text
			);
			// Then show the notification.
			notification.show();
			setTimeout(function(){
				notification.cancel();
			}, 7000);
		}
	},
	//, //requires Chrome 6.0.472.36 (Beta) to access cookies
	/**
		Returns the content of the specified cookie
		@param URL - the URL with which the cookie is associated
		@param cookieName - the name of the cookie
		@param callback - the callback
		@return content - the content of the cookie
	*/
	//getCookie: function( URL, cookieName, callback ){
	//	var details = {
	//		url: URL,
	//		name: cookieName
	//	};
	//	chrome.cookies.get( details, callback );
	//}
};

/**
	Contains the functions for manipulating and using personalised GE data.
*/
var GE = {
	/**
		A prefix used to identify GE-related HTML elements
	*/
	typePrefix: 'GE',
	/**
		The URL to fetch GE info
	*/
	coreURL: 'http://services.runescape.com/m=toolbar/geupdate.ws',
	/**
		Fetches the GE data
		@param callback - the callback to perform when the data returns
	*/
	fetchData: function( callback ){
		var ajaxConfig = {
			url: GE.coreURL,
			dataType: 'xml',
			success: callback
		};
		$.ajax( ajaxConfig );
	},
	/**
		The title for a GE update notification
	*/
	updateNotificationTitle: 'GE Offers Update',
	/**
		The body text for a GE update notification
	*/
	updateNotificationBody: 'One or more of your GE offers have updated!',
	/**
		Displays a notification if there have been any changes between the new XML and the stored XML
		@param newXML - the new xml data
	*/
	updateNotification: function( newXML ){
		if( XMLToString( GE.fetchDataFromStorage() ) !== XMLToString( newXML ) ){
			Browser.notification( GE.updateNotificationTitle, GE.updateNotificationBody, GE.typePrefix );
		}
	},
	/**
		Fetches and stores the GE data
	*/
	fetchAndStoreData: function(){
		GE.fetchData( function( xml ){
			GE.updateNotification( xml );
			GE.storeData( xml );
			Browser.setBadgeTooltip( Browser.workOutBadgeTooltipText() );
		});
	},
	/**
		Stores the data in localstorage
		@param xml - the xml data
	*/
	storeData: function( xml ){
		Storage.setItem( Storage.GE.XMLstring, XMLToString( xml ) );
	},
	/**
		Fetches the data from localstorage
		@return xml - the xml data
	*/
	fetchDataFromStorage: function(){
		return XMLFromString( Storage.getItem( Storage.GE.XMLstring ) );
	},
	/**
		Parses the GE offers, turning into an array of objects
		@param xml - the XML data
		@return offers[] - the array of offers
	*/
	parseOffers: function( xml ){
		if( Auth.checkBlock( xml, GE.typePrefix ) ){
			return;
		}
		if( Auth.isAuthorised( xml ) ){
			var offers = new Array( $( xml ).find('MENU_ITEM').length );
			$( xml ).find('MENU_ITEM').each(function( i ){
				offers[i] = GE.splitOffer( $(this) );
			});
			return offers;
		}
		return false;
	},
	/**
		Returns the number of running offers
		@param offers[] - an array of offer objects
		@return noOffers - the number of running offers
	*/
	getRunningOffers: function( offers ){
		if( typeof offers === 'undefined' ){
			return 0;
		}
		return offers.length;
	},
	/**
		Counts the number of offers that are complete
		@param offers[] - an array of offer objects
		@return complete - the number of completed offers
	*/
	countCompletedOffers: function( offers ){
		var complete = 0;
		if( GE.getRunningOffers( offers ) === 0 ){
			Browser.setBadgeText( complete.toString() );
			return complete;
		}
		for(var i = 0, offer; offer = offers[i]; i++){
			if( offer.percent === 100 ){
				complete++;
			}
		}
		Browser.setBadgeText( complete.toString() );
		return complete;
	},
	/**
		Splits a GE info string into the various parts, converting it into a useful object with various bits of extra data
		@param offer - the individual xml data object
		@return obj - the offer, but split into the various parts so it can be manipulated
	*/
	splitOffer: function( offer ){
		var obj = GE.splitOfferCaption( $( offer ).find('CAPTION').text() );

		obj.iconURL = $( offer ).find('ICON_URL').text();
		obj.gedbURL = $( offer ).find('URL').text();
		obj.geid = obj.gedbURL.match( Regexp.globalInt )[0];

		return obj;
	},
	/**
		Splits a GE offer CAPTION into the various parts and works out a few other bits of useful information about it
		@param caption - the string that is the caption text
		@return obj - an object with the bits of data in
	*/
	splitOfferCaption: function( caption ){
		var split = caption.split(' ');
		var matchInt = caption.match( Regexp.globalInt );
		var obj = {};
		obj.buying = caption.indexOf('Buying') === -1 ? false : true;
		obj.quantity = parseInt( matchInt[0], 10 );
		
		//TODO: Make this something other than a crude hack - currently finds the bit between two numbers, then removes ' at ' from the end
		var matchName = caption.match( Regexp.crudeGEName );
		obj.name = matchName[1].substr( 0, matchName[1].length - 3);
		
		obj.price = parseInt( matchInt[1], 10 );
		obj.costSoFar = parseInt( matchInt[3], 10 );
		obj.quantityProcessed = obj.costSoFar === 0 ? 0 : parseInt( Math.round( obj.costSoFar / obj.price ), 10 );
		obj.percent = parseInt( ( obj.quantityProcessed / obj.quantity ) * 100, 10 );
		
		return obj;
	}
};

/**
	Contains Activity / D&D related functions
*/
var Activities = {
	/**
		A prefix used to identify Activity-related HTML elements
	*/
	typePrefix: 'activity',
	/**
		The URL to fetch activity info
	*/
	coreURL: 'http://services.runescape.com/m=toolbar/activities.ws',
	/**
		Fetches the Activities data
		@param callback - the callback to perform when the data returns
	*/
	fetchData: function( callback ){
		var ajaxConfig = {
			url: Activities.coreURL,
			dataType: 'xml',
			success: callback
		};
		$.ajax( ajaxConfig );
	},
	/**
		The title for an Activity update notification
	*/
	updateNotificationTitle: 'Activity / D&D Update',
	/**
		The body text for an Activity update notification
	*/
	updateNotificationBody: 'The status of one or more of your available D&Ds has updated!',
	/**
		Displays a notification if there have been any changes between the new XML and the stored XML
		@param newXML - the new xml data
	*/
	updateNotification: function( newXML ){
		var oldActivites = Activities.parseActivities( Activities.fetchDataFromStorage() );
		var newActivites = Activities.parseActivities( newXML );
		if( Activities.countAvailableActivities( oldActivites )
				!== Activities.countAvailableActivities( newActivites )){
			Browser.notification( Activities.updateNotificationTitle, Activities.updateNotificationBody, Activities.typePrefix );
		}
	},
	/**
		Fetches and stores activity data
	*/
	fetchAndStoreData: function(){
		Activities.fetchData( function( xml ){
			Activities.updateNotification( xml );
			Activities.storeData( xml );
			Browser.setBadgeTooltip( Browser.workOutBadgeTooltipText() );
		});
	},
	/**
		Stores the data in localstorage
		@param xml - the xml data
	*/
	storeData: function( xml ){
		Storage.setItem( Storage.Activities.XMLstring, XMLToString( xml ) );
	},
	/**
		Fetches the data from localstorage
		@return xml - the xml data
	*/
	fetchDataFromStorage: function(){
		return XMLFromString( Storage.getItem( Storage.Activities.XMLstring ) );
	},
	/**
		Counts the total number of activities that can be completed (whether they can be done now or not)
		@param activities[] - an array of activity objects
		@return number - a number of activities that there are in the list
	*/
	countTotalActivities: function( activities ){
		if( typeof activities === 'undefined' ){
			return 0;
		}
		return activities.length;
	},
	/**
		Counts the number of available activities that are available to complete at this point in time according to the data
		@param activities[] - an array of activity objects
		@return number - a number of activities that can be completed
	*/
	countAvailableActivities: function( activities ){
		var number = 0;
		if( Activities.countTotalActivities( activities ) === 0 ){
			return number;
		}
		for( var i = 0; i < activities.length; i++){
			if( activities[i].allow ){
				number++;
			}
		}
		return number;
	},
	/**
		Parses the activities, turning into an array of objects
		@param xml 
		@return activities[] - the array of activities
	*/
	parseActivities: function( xml ){
		if( Auth.checkBlock( xml, Activities.typePrefix ) ){
			return;
		}
		if( Auth.isAuthorised( xml ) ){
			var activities = new Array( $( xml ).find('MENU_ITEM').length );
			$( xml ).find('MENU_ITEM').each(function( i ){
				activities[i] = Activities.splitActivity( $(this) );
			});
			return activities;
		}
		return false;
	},
	/**
		Converts a activity xml segment into an object with extra data
		@param  act - the individual xml data object
		@return obj - the activity, but split into the various parts
	*/
	splitActivity: function( act ){
		var obj = {};
		
		obj.text = $( act ).find('CAPTION').text();
		obj.icon = $( act ).find('ICON_URL').text();
		obj.allow = obj.icon.indexOf('disallow') === -1 ? true : false;
		obj.rskbLink = $( act ).find('URL').text();
		
		return obj;
	}
};

/**
	Contains news-related functions
*/
var News = {
	/**
		A prefix used to identify news-related HTML elements
	*/
	typePrefix: 'news',
	/**
		The URL of the RSS feed
	*/
	rssURL: 'http://services.runescape.com/m=news/latest_news.rss',
	/**
		Fetches the news RSS feed and does something with it
		@param callback - what to do once the data has been fetched
	*/
	fetchRSS: function( callback ){
		var ajaxConfig = {
			url: News.rssURL,
			dataType: 'xml',
			success: callback
		};
		$.ajax( ajaxConfig );
	},
	/**
		The title for a new update notification
	*/
	updateNotificationTitle: 'News Update',
	/**
		The body text for an Activity update notification
	*/
	updateNotificationBody: 'The latest RuneScape News has updated!',
	/**
		Displays a notification if there have been any changes between the new XML and the stored XML
		@param newContent - the new formatted content
	*/
	updateNotification: function( newContent ){
		if( News.fetchFormattedRSS() !== newContent ){
			Browser.notification( News.updateNotificationTitle, News.updateNotificationBody, News.typePrefix );
		}
	},
	/**
		Stores the formatted RSS feed in storage
		@param formattedFeed - the formatted feed
	*/
	storeFormattedRSS: function( content ){
		Storage.setItem( Storage.News.formattedFeed, content );
	},
	/**
		Fetches the formatted RSS feed from storage, checks to see if there's anything there and if there isn't, trys to fetch it
		@return formattedFeed - the formatted feed for the popup
	*/
	fetchFormattedRSS: function(){
		return Storage.getItem( Storage.News.formattedFeed, function(){
			//News.fetchBGNews();
			News.fetchRSS( function( xml ){ News.formatAndStoreRSS( xml ); } );
			News.fetchAndDisplayData();
		});
	},
	/**
		Creates the content to display the RSS feed
		@param  xml - the result from the XHR for the RSS feed
		@return content - the formatted feed
	*/
	createFeedContent: function( xml ){
		var content = '';
		//http://www.switchonthecode.com/tutorials/xml-parsing-with-jquery
		$( xml ).find('item').each(function(){
			content += '<h3><a href="#">';
			content += $(this).find('title').text();
			content += '</a></h3><div><p>' + $(this).find('description').text();
			content += ' <a href="#" onclick="Browser.openTab(\'' + $(this).find('guid').text();
			content += '\');" class="newsLink">Read more...</a></p></div>';
		});
		return content;
	}
};

/**
	Options to do with whether the notifications show
*/	
var NotificationOpts = {
	/**
		The default option - enabled
	*/
	defaultSetting: 'false',
	/**
		Fetches the setting from storage
		@return setting - the value that has been stored
	*/
	fetchSetting: function(){
		var setting = Storage.getItem( Storage.Options.showNotifications );
		if( typeof setting === 'undefined' ){
			setting = NotificationOpts.defaultSetting;
		}
		return setting;
	}
};

/**
	Custom number-formatting functions.
*/
var Number = {
	/**
		Adds commas to large numbers to make them easier to read.
	*/
	addCommas: function( number ){
		if(number >= 1000){
			var noStr = number + '';
			var decimalPointPosition = noStr.indexOf('.');
			var decimal = '';
			if(decimalPointPosition != -1){
				decimal = noStr.substr(decimalPointPosition, noStr.length - decimalPointPosition);
				noStr = noStr.substr(0, decimalPointPosition);
			}
			var numberOfCommas = Math.floor((noStr.length - 1) / 3);
			var output = noStr.substr(0, (noStr.length - (numberOfCommas * 3)));
			var lengthBeforeCommas = output.length;
			for(var i = 0; i < numberOfCommas; i++){
				output += ',' + noStr.substr(lengthBeforeCommas, 3);
				lengthBeforeCommas += 3;
			}
			return output + decimal;
		} else {
			return number;
		}
	}
};

/**
	Various keys used for localStorage
*/
var Storage = {
	//http://paperkilledrock.com/2010/05/html5-localstorage-part-one/
	//http://dev.w3.org/html5/webstorage/
	/**
		Stores some data, referencing it with the specified key
		@param key - the key with which to access the data later on
		@param value - a string to store
	*/
	setItem: function( key, value ){
		if( typeof value !== 'string' ){
			return; //can only store strings
		}
		try {
			localStorage[ key ] = value;
		} catch ( e ) {
			 if (e == QUOTA_EXCEEDED_ERR) {
				//data wasn't successfully saved due to quota exceed so threw an error
			}
		}
	},
	/**
		Fetches some data specified by the passed key
		@param key - the storage location at which the data can be found
		@param fallback - an optional function to call to try and fetch data in the case that there's nothing stored
		@return value - the data that was stored (a string)
	*/
	getItem: function( key, fallback ){
		var content = localStorage[ key ];
		//try to fetch it again if there's nothing stored
		//TODO: fix - it currently goes into a strange loop
		//if( content === null || typeof content === 'undefined' || content.length === 0 ){
		//	if( typeof fallback === 'function' ){
		//		alert('is a function');
		//		$( fallback );
		//		alert('run the callback');
		//		content = localStorage[ key ];
		//		return content;
		//	} else {
		//		content = '';
		//	}
		//}
		return content;
	},
	/**
		Storage keys relating to GE offers
	*/
	GE: {
		/**
			The storage key for the personalised GE XML data
		*/
		XMLstring: 'personalGEoffersXML'
	},
	/**
		Storage keys relating to Activities
	*/
	Activities: {
		/**
			The storage key for the personalised Activities XML data
		*/
		XMLstring: 'personalActivitiesXML'
	},
	/**
		Storage keys relating to the news
	*/
	News: {
		/**
			The storage key for the news RSS feed
		*/
		formattedFeed: 'formattedNewsRSS'
	},
	/**
		Storage keys relating to options
	*/
	Options: {
		/**
			The storage key for whether notifcations show
		*/
		showNotifications: 'showNotifications'
	}
};

/**
	The regexps that are used
*/
var Regexp = {
	//http://stackoverflow.com/questions/37684/replace-url-with-html-links-javascript/37687#37687
	URL: /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
	globalInt: /\d+/g,
	crudeGEName: /[\s\D]+/ig
};

//http://joncom.be/code/javascript-xml-conversion/
var XMLToString = function(oXML) {
	if (window.ActiveXObject) {
		return oXML.xml;
	} else {
		return (new XMLSerializer()).serializeToString(oXML);
	}
}
var XMLFromString = function(sXML) {
	if (window.ActiveXObject) {
		var oXML = new ActiveXObject("Microsoft.XMLDOM");
		oXML.loadXML(sXML);
		return oXML;
	} else {
		return (new DOMParser()).parseFromString(sXML, "text/xml");
	}
}

/**
	Displays the key-value pairs in an object for debugging purposes
	@param obj - the object to display key-value pairs for
*/
var getKeys = function(obj){
	var keys = [];
	for(var key in obj){
		keys.push(key);
		displayText( key + "  -  " + obj[key] );
	}
	return keys;
};

/**
	Displays text to see what it says
*/
var displayText = function( text ){
	var div = document.createElement("div");
	div.innerHTML = text;
	document.body.appendChild(div);
};