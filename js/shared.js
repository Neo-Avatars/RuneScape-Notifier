/**
	Authorisation-related functions
*/
var Auth = {
	/**
		Based on an XML xhr response, checks to see if it contains a link to the authorisation page (is not suthorised).
		@param xhr
		@param ge - set to true if it's from a call to fetch GE data
		@return isAuthorised
	*/
	isAuthorised: function( xhr, ge ){
		var comparison = 'toolbar/authorise';
		/*if( xhr.responseXML === null ){
			if( ge ){
				Browser.setBadgeText( 'IDK' );
			}
			return false;
		}*/
		return xhr.responseText.indexOf( comparison ) === -1 ? true : false;
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
	}//,
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
		The URL to fetch GE info
	*/
	coreURL: 'http://services.runescape.com/m=toolbar/geupdate.ws',
	/**
		Parses the GE offers, turning into an array of objects
		@param xhr - the XHR
		@return offers - the array of offers
	*/
	parseOffers: function( xhr ){
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
		obj.quantityProcessed = obj.costSoFar === 0 ? 0 : parseInt( obj.costSoFar / obj.price, 10 );
		obj.percent = parseInt( ( obj.quantityProcessed / obj.quantity ) * 100, 10 );
		
		var matchURL = offer.match( Regexp.URL );
		obj.iconURL = matchURL[0];
		obj.gedbURL = matchURL[1];
		obj.geid = matchURL[1].match( Regexp.globalInt )[0];
		
		//getKeys( obj );
		
		return obj;
	}
};

var Activities = {
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
		if( Auth.isAuthorised( xhr ) ){
			var rawActivities = xhr.responseXML.getElementsByTagName("MENU_ITEM");
			var activites = new Array( rawActivities.length );
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