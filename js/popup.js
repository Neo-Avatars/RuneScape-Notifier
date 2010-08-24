//http://services.runescape.com/m=toolbar/geupdate.ws
//http://services.runescape.com/m=toolbar/activities.ws
/**
	Contains functions relating to initialising page content
*/
var Page = {
	/**
		Set the text for the 'blocked' messages
	*/
	initBlockedMessages: function(){
		Page.setBlockedMessage( GE );
		Page.setBlockedMessage( Activities );
	},
	/**
		Set the text for an individual 'blocked' message
		@param type - an object relating to that type of request
	*/
	setBlockedMessage: function( type ){
		$('#' + type.typePrefix + 'Blocked').html('<p class="info"><strong>Load Error</strong><br />\
			An attempt was made to fetch ' + type.typePrefix
			+ ' data, but nothing was returned. This may be a problem with the connection, \
			 or may indicate that too many requests have been made, causing Jagex to temporarily \
			 prevent you from making any more. [/essay]');
	}
};

/**
	Popup-specific authorisation-related functions
*/
var PopupAuth = {
	/**
		Displays the link to the authorisation page and hides any other content.
	*/
	showAuthLink: function(){
		//alert( 'auth ');
		$('#authAuthorise').show();
		$('#authUnauthorise').hide();
		$('#GE').hide();
		$('#activities').hide();
	},
	/**
		Hides the link to the authorisation page and hides any other content.
	*/
	hideAuthLink: function(){
		$('#authAuthorise').hide();
		$('#authUnuthorise').show();
		$('#GE').show();
		$('#activities').show();
	},
	/**
		Displays the relevant things to tell the user that they've possibly been blocked and hides unneeded things
		@param prefix - the prefix for the type of request that the user has been blocked from making
	*/
	displayBlockedInfo: function( typePrefix ){
		$('#' + typePrefix + 'Open').hide();
		$('#' + typePrefix + 'Blocked').show();
	},
	/**
		Hides the relevant things to tell the user that they've possibly been blocked and shows other things
		@param prefix - the prefix for the type of request that the user has been blocked from making
	*/
	hideBlockedInfo: function( typePrefix ){
		$('#' + typePrefix + 'Open').show();
		$('#' + typePrefix + 'Blocked').hide();
	}
};

/**
	Popup-specific GE-related functions
*/
var PopupGE = {
	/**
		Fetches personalised GE data.
	*/
	fetchAndDisplayData: function(){
		GE.displayData( GE.fetchDataFromStorage() );
	},
	/**
		Displays the GE data
		@param xml
	*/
	displayData: function( xml ){
		if( Auth.isAuthorised( xml ) ){
			Auth.hideAuthLink();
			var offers = GE.parseOffers( xml );
			$('#GETable tbody').html( GE.generateTable( offers ) );
			$('#GECompleteOffers').html( GE.generateOfferCompletionText( offers ) );
			$('#GERunningOffers').html( GE.generateRunningOffersText( offers ) );
		} else {
			Auth.showAuthLink();
		}
	},
	/**
		Generates some text to indicate how many offers have completed.
		@param offers[] - an array of offer objects
		@return text - meaningful text to say how many are completed
	*/
	generateOfferCompletionText: function( offers ){
		var complete = GE.countCompletedOffers( offers );
		var text = complete + ' offer';
		if( complete === 1 ){
			text += ' has completed';
		} else {
			text += 's have completed';
		}
		return text;
	},
	/**
		Returns the number of running offers
		@param offers[] - an array of offer objects
		@return numberOfOffers - a string teling you how many offers you have
	*/
	generateRunningOffersText: function( offers ){
		return 'You have ' + GE.getRunningOffers( offers ) + ' running offers.';
	},
	/**
		Generates a table of data based on the passed object
		@param offers[] - an array of offer objects
		@return table - the HTML to fit within the <tbody> tags of a table
	*/
	generateTable: function( offers ){
		var content = '';
		for(var i = 0, offer; offer = offers[i]; i++){
			content += GE.generateTableRow( offer );
		}
		return content;
	},
	/**
		Generates a row for the GE offer table
		@param offers - a single offer object
		@return row - the HTML for a row of the table
	*/
	generateTableRow: function( offer ){
		var content = '';
		
		content += '<tr';
		if( offer.percent === 100 ){
			content += ' class="completed"'
		}
		content += '><td rowspan="2">\
			<a href="#" onclick="Browser.openTab(\'' + offer.gedbURL + '\');" title="View in the Grand Exchange Database">\
			<img src="' + offer.iconURL + '" alt="' + offer.name + '" /></a></td><td>';
		offer.buying ? content += 'Buying ' : content += 'Selling ';
		content += offer.quantity + ' ' + offer.name + ' at ' + Number.addCommas( offer.price ) + 'gp each.</td></tr><tr';
		if( offer.percent === 100 ){
			content += ' class="completed"'
		}
		content += '><td>';
		content += offer.percent + '% complete (' + offer.quantityProcessed + '), ';
		offer.buying ? content += 'costing ' : content += 'earning ';
		content += Number.addCommas( offer.costSoFar ) + 'gp';
		offer.percent === 100 ? content += '</td></tr>' : content += ' so far</td></tr>';
		
		return content;
	}
};

/**
	Popup-specific activity-related functions
*/
var PopupActivities = {
	/**
		Fetches personalised activity data.
	*/
	fetchAndDisplayData: function(){
		Activities.displayData( Activities.fetchDataFromStorage() );
	},
	/**
		Displays the activity data
		@param xml
	*/
	displayData: function( xml ){
		if( Auth.isAuthorised( xml ) ){
			Auth.hideAuthLink();
			var activities = Activities.parseActivities( xml );
			$('#activityList').html( Activities.generateList( activities ) );
		} else {
			Auth.showAuthLink();
		}
	},
	/**
		Generates a list of activites based on the passed object
		@param activities[] - an array of activity objects
		@return list - the HTML to fit within the <ul> tags of the list
	*/
	generateList: function( activities ){
		var content = '';
		for(var i = 0, activity; activity = activities[i]; i++){
			content += Activities.generateListBullet( activity );
		}
		return content;
	},
	/**
		Generates a bullet point for the activity list
		@param activity - a single activity object
		@return bullet - the HTML for one row of the table
	*/
	generateListBullet: function( act ){
		var content = '';
		
		content += '<li class="';
		act.allow ? content += 'allow' : content += 'disallow';
		content += '">' + act.text + '</li>';
		
		return content;
	},
};

/**
	Popup-specific news-related functions
*/
var PopupNews = {
	/**
		Fetches and displays the news data
	*/
	fetchAndDisplayData: function(){
		var content = News.fetchFormattedRSS();
		News.displayFeedContent( content );
		
		//News.fetchRSS( function( xml ){ News.createAndDisplayFeed( xml ) } );
		//News.createAndDisplayFeed( content );
	},
	/**
		Creates and displays the news RSS feed content
		@param xml - the result from the XHR for the RSS feed
	*/
	createAndDisplayFeed: function( xml ){
		//var content = News.fetchFormattedRSS();
		var content = News.createFeedContent( xml );
		News.displayFeedContent( content );
	},
	/**
		Displays the news feed
		@param content - the content to display
	*/
	displayFeedContent: function( content ){
		$('#newsPosts').html('<div id="newsPostsContent"></div>'); //need an inner container to be able to re-acordionify it
		$('#newsPostsContent').html( content );
		$('#newsPostsContent').accordion({autoHeight: false});
		//alert('accordioned');
	}
};

/**
	Does various things relating to the Username - requires Chrome 6.0.472.36+ (Beta) (to access cookies)
*/
//var Username = {
	/**
		Fetches the username that has been authorised and sets it as the displayed value
	*/
	//get: function(){
	//	Browser.getCookie( 'http://www.runescape.com/', 'toolbar_username', function( cookie ){
	//		Username.set( cookie.value );
	//	});
	//},
	/**
		Sets the username to be visible
	*/
	//set: function( username ){
	//	$('#authUsername').text( username );
	//}
//};

/**
	Reloads all the feeds and re-initialises the UI of the popup
*/
var reloadPopup = function(){
	chrome.extension.getBackgroundPage().fetchBackgroundFeeds();
	fetchAndDisplayPopupData();
};

/**
	Fetches and displays various feeds visually in the popup
*/
var fetchAndDisplayPopupData = function(){
	$("ul.tabs").tabs("div.panes > div");
	GE.fetchAndDisplayData();
	Activities.fetchAndDisplayData();
	News.fetchAndDisplayData();
};

/**
	Initialises the popup content
*/
var initPopup = function(){
	$.extend( Auth, PopupAuth );
	$.extend( GE, PopupGE );
	$.extend( Activities, PopupActivities );
	$.extend( News, PopupNews );
	//Username.get(); //requires Chrome 6.0.472.36 (Beta)
	Page.initBlockedMessages();
	fetchAndDisplayPopupData();
};

$(function() {
	initPopup();
});