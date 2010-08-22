/**
	Authorisation-related functions
*/
var Auth = {
	/**
		A prefix used to identify Auth-related HTML elements
	*/
	typePrefix: 'auth',
	/**
		Based on an XML xhr response, checks to see if it contains a link to the authorisation page (is not suthorised).
		@param xhr - the XHR
		@return isAuthorised
	*/
	isAuthorised: function( xhr ){
		var comparison = 'toolbar/authorise';
		return xhr.responseText.indexOf( comparison ) === -1 ? true : false;
	},
	/**
		Based on a xhr response, checks to see if it is null (too many requests have been made, causing you to be blocked from Jagex's servers)
		@param xhr - the XHR
		@return isBlocked - boolean
	*/
	isBlocked: function( xhr ){
		if( xhr.getResponseHeader('Content-Length') == 0 ){
			return true;
		}
		return false;
	},
	/**
		Checks to see if the response data indicates that the user has been blocked.
		@param xhr
		@param typePrefix - a prefix used to identify HTML elements relating to that object
		@return A boolean saying whether or not you're blocked
	*/
	checkBlock: function( xhr, typePrefix ){
		if( Auth.isBlocked( xhr ) ){
			if( popup ){
				Auth.displayBlockedInfo( typePrefix );
			}
			return true;
		}
		if( popup ){
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
	}
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
		Parses the GE offers, turning into an array of objects
		@param xhr - the XHR
		@return offers - the array of offers
	*/
	parseOffers: function( xhr ){
		if( Auth.checkBlock( xhr, GE.typePrefix ) ){
			return;
		}
		if( Auth.isAuthorised( xhr ) ){
			var geOffers = xhr.responseXML.getElementsByTagName("MENU_ITEM");
			var offers = new Array( geOffers.length );
			for( var i = 0, offer; offer = geOffers[i]; i++){
				offers[i] = GE.splitOffer( offer.textContent );
			}
			return offers;
		}
		return false;
	},
	/**
		Returns the number of running offers
		@param xhr - the XHR
		@return noOffers - the number of running offers
	*/
	getRunningOffers: function( xhr ){
		if( Auth.checkBlock( xhr, GE.typePrefix ) ){
			return;
		}
		if( Auth.isAuthorised( xhr ) ){
			var geOffers = xhr.responseXML.getElementsByTagName("MENU_ITEM");
			return geOffers.length;
		}
		return 0;
	},
	/**
		Counts the number of offers that are complete
		@param offers[] - an array of offer objects
		@return complete - the number of completed offers
	*/
	countCompletedOffers: function( offers ){
		var complete = 0;
		for(var i = 0, offer; offer = offers[i]; i++){
			if( offer.percent === 100 ){
				complete++;
			}
		}
		Browser.setBadgeText( complete.toString() );
		return complete;
	},
	/**
		Splits a GE info string into the various parts, converting it into a useful object.
		@param offer - a string about a GE offer
		@return obj - the offer, but split into the various parts so it can be manipulated
	*/
	splitOffer: function( offer ){
		var split = offer.split(' ');
		var matchInt = offer.match( Regexp.globalInt );
		var obj = {};
		obj.buying = offer.indexOf('Buying') === -1 ? false : true;
		obj.quantity = parseInt( matchInt[0], 10 );
		
		//TODO: Make this something other than a crude hack - currently finds the bit between two numbers, then removes ' at ' from the end
		var matchName = offer.match( Regexp.crudeGEName );
		obj.name = matchName[1].substr( 0, matchName[1].length - 3);
		
		obj.price = parseInt( matchInt[1], 10 );
		obj.costSoFar = parseInt( matchInt[3], 10 );
		obj.quantityProcessed = obj.costSoFar === 0 ? 0 : parseInt( Math.round( obj.costSoFar / obj.price ), 10 );
		obj.percent = parseInt( ( obj.quantityProcessed / obj.quantity ) * 100, 10 );
		
		var matchURL = offer.match( Regexp.URL );
		obj.iconURL = matchURL[0];
		obj.gedbURL = matchURL[1];
		obj.geid = matchURL[1].match( Regexp.globalInt )[0];
		
		//getKeys( obj );
		
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
		Parses the activities, turning into an array of objects
		@param xhr - the XHR
		@return activities - the array of activities
	*/
	parseActivities: function( xhr ){
		if( Auth.checkBlock( xhr, Activities.typePrefix ) ){
			return;
		}
		if( Auth.isAuthorised( xhr ) ){
			var rawActivities = xhr.responseXML.getElementsByTagName("MENU_ITEM");
			var activities = new Array( rawActivities.length );
			for(var i = 0, activity; activity = rawActivities[i]; i++){
				activities[i] = Activities.splitActivity( activity.textContent );
			}
			return activities;
		}
		return false;
	},
	/**
		Splits a activity info string into the various parts, converting it into a useful object.
		@param  act - a string about an activity
		@return obj - the activity, but split into the various parts so it can be manipulated
	*/
	splitActivity: function( act ){
		var matchURL = act.match( Regexp.URL );
		var obj = {};
		obj.text = act.substr( 0, act.indexOf('http') );
		obj.allow = act.indexOf('disallow') === -1 ? true : false;
		obj.icon = matchURL[0];
		obj.rskbLink = matchURL[1];
		//getKeys( obj );
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
		Stores the formatted RSS feed in storage
		@param formattedFeed - the formatted feed
	*/
	storeFormattedRSS: function( content ){
		localStorage[ Storage.News.formattedFeed ] = content;
	},
	/**
		Fetches the formatted RSS feed from storage, checks to see if there's anything there and if there isn't, trys to fetch it
		@return formattedFeed - the formatted feed for the popup
	*/
	fetchFormattedRSS: function(){
		var content = localStorage[ Storage.News.formattedFeed ];
		//try to fetch it again if there's nothing stored
		if( content.length === 0 || content === null ){
			News.fetchBGNews();
			content = localStorage[ Storage.News.formattedFeed ];
		}
		return content
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
	/**
		Storage keys relating to the news
	*/
	News: {
		/**
			The storage key for the news RSS feed
		*/
		formattedFeed: 'newsRSS'
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