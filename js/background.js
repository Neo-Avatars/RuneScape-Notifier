
var BGGE = {
	/**
		The interval between lookups to see if any offers have reached 100% complete (5 minutes = 300,000ms)
	*/
	updateInterval: 300000,
	/**
		Does the various things to update the badge text which says how many GE offers have completed
	*/
	updateBadgeText: function(){
		var ajaxConfig = {
			url: GE.coreURL,
			success: function( data, status, xhr ){
				var offers = GE.parseOffers( xhr );
				if( typeof offers.length !== 'undefined' ){
					GE.countCompletedOffers( offers );
				}
			}
		};
		$.ajax( ajaxConfig );
	}
};

$(function() {
	$.extend( GE, BGGE );
	GE.updateBadgeText();
	window.setInterval(	GE.updateBadgeText, GE.updateInterval );
});