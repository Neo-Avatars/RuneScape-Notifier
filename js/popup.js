//http://services.runescape.com/m=toolbar/geupdate.ws
//http://services.runescape.com/m=toolbar/activities.ws
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
		//alert('show');
		$('#authAuthorise').hide();
		$('#authUnuthorise').show();
		$('#GE').show();
		$('#activities').show();
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
		var ajaxConfig = {
			url: GE.coreURL,
			success: function( data, status, xhr ){
				GE.displayData( xhr );
			}
		};
		$.ajax( ajaxConfig );
	},
	/**
		Displays the GE data
		@param xhr
	*/
	displayData: function( xhr ){
		if( Auth.isAuthorised( xhr ) ){
			Auth.hideAuthLink();
			//alert('ge hide');
			var offers = GE.parseOffers( xhr );
			$('#GETable tbody').html( GE.generateTable( offers ) );
			$('#GECompleteOffers').html( GE.generateOfferCompletionText( offers ) );
			$('#GERunningOffers').html( GE.generateRunningOffersText( xhr ) );
		} else {
			//alert('ge show');
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
		@param xhr - the XHR
		@return numberOfOffers - a string teling you how many offers you have
	*/
	generateRunningOffersText: function( xhr ){
		return 'You have ' + GE.getRunningOffers( xhr ) + ' running offers.';
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
		var ajaxConfig = {
			url: Activities.coreURL,
			success: function( data, status, xhr ){
				Activities.displayData( xhr );
			}
		};
		$.ajax( ajaxConfig );
	},
	/**
		Displays the activity data
		@param xhr
	*/
	displayData: function( xhr ){
		if( Auth.isAuthorised( xhr ) ){
			//alert('act hide');
			Auth.hideAuthLink();
			var activities = Activities.parseActivities( xhr );
			$('#activityList').html( Activities.generateList( activities ) );
		} else {
			//alert('act show');
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
	}
};

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

var initPopup = function(){
	$.extend( Auth, PopupAuth );
	$.extend( GE, PopupGE );
	$.extend( Activities, PopupActivities );
	//Username.get();
	GE.fetchAndDisplayData();
	Activities.fetchAndDisplayData();
};

$(function() {
	initPopup();
});