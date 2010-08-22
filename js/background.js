/**
	Background-specific GE-related functions
*/
var BGGE = {
	/**
		The interval between lookups to see if any offers have reached 100% complete (5 minutes = 300,000ms)
	*/
	updateInterval: 300000,
	/**
		Does the various things to update the badge text which says how many GE offers have completed
	*/
	updateBadgeText: function(){
		GE.fetchData( function( data, status, xhr ){
				var offers = GE.parseOffers( xhr );
				if( typeof offers.length !== 'undefined' ){
					GE.countCompletedOffers( offers );
				}
			});
	},
	/**
		Fetches the GE offer data in the background so that it doesn't need to be loaded every time the popup is viewed
	*/
	fetchBGOffers: function(){
		GE.fetchData( function( xml ){ GE.storeData( xml ); } );
	}
};

/**
	Background-specific activity-related functions
*/
var BGActivities = {
	/**
		The interval between lookups (10 minutes = 600,000ms)
	*/
	updateInterval: 600000,
	/**
		Fetches the activity data in the background so that it doesn't need to be loaded every time the popup is viewed
	*/
	fetchBGActivities: function(){
		Activities.fetchData( function( xml ){ Activities.storeData( xml ); } );
	}
};

/**
	Background-specific news-related functions
*/
var BGNews = {
	/**
		The interval between lookups (10 minutes = 600,000ms)
	*/
	updateInterval: 600000,
	/**
		Fetches the news feed in the background so that it doesn't need to be loaded every time the popup is viewed
	*/
	fetchBGNews: function(){
		News.fetchRSS( function( xml ){ News.formatAndStoreRSS( xml ); } );
	},
	/**
		Stores the content of the news RSS feed in local storage
		@param xml - the result from the XHR for the RSS feed
	*/
	formatAndStoreRSS: function( xml ){
		var content = News.createFeedContent( xml );
		News.storeFormattedRSS( content );
	}
};

//http://julianapena.com/2010/01/how-to-build-a-chrome-extension-part-2-options-and-localstorage/

/**
	Sets various tasks running in the background
*/
var initBGTasks = function(){
	//GE.updateBadgeText();
	//window.setInterval( GE.updateBadgeText, GE.updateInterval );
	//News.fetchBGNews();
	//window.setInterval( News.fetchBGNews, News.updateInterval );
	//Activities.fetchBGActivities();
	GE.fetchBGOffers();
};

$(function() {
	$.extend( GE, BGGE );
	$.extend( News, BGNews );
	$.extend( Activities, BGActivities );
	initBGTasks();
});