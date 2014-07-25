/*! Respond.js: min/max-width media query polyfill. Remote proxy (c) Scott Jehl. MIT/GPLv2 Lic. j.mp/respondjs  */
(function(win, doc, undefined){
	var docElem			= doc.documentElement,
		redirectURL		= (doc.getElementById("respond-redirect") || location).href,
		baseElem		= doc.getElementsByTagName("base")[0],
		urls			= [],
		proxyHostMap 	= {},
		refNode;

	function getProxyHostMap() {
		var links = doc.getElementsByTagName("link"),
			parser, 
			link;

		for( var l = links.length; l--; ) {
			link = links[l];
			if ( link.rel != "respond-proxy" || link.href == null ) {
				continue;
			}
			parser = getURLParser(link.href);
			proxyHostMap[parser.host] = parser.href;
		}
	}

	function getURLParser(url) {
		var a = doc.createElement('a');
		a.href = url;
		return a;
	}

	function getProxyURL(url) {
		var parser = getURLParser(url);
		return proxyHostMap[parser.host];
	}

	function encode(url){
		return win.encodeURIComponent(url);
	}

	function fakejax( url, callback ){

		var iframe,
			AXO,
			proxyURL;

		url = checkBaseURL(url);
		proxyURL = getProxyURL(url);

		if ( proxyURL == null ) {
			return;
		}
		
		// All hail Google http://j.mp/iKMI19
		// Behold, an iframe proxy without annoying clicky noises.
		if ( "ActiveXObject" in win ) {
			AXO = new ActiveXObject( "htmlfile" );
			AXO.open();
			AXO.write( '<iframe id="x"></iframe>' );
			AXO.close();
			iframe = AXO.getElementById( "x" );
		} else {
			iframe = doc.createElement( "iframe" );
			iframe.style.cssText = "position:absolute;top:-99em";
			docElem.insertBefore(iframe, docElem.firstElementChild || docElem.firstChild );
		}

		iframe.src = checkBaseURL(proxyURL) + "?url=" + encode(redirectURL) + "&css=" + encode(url);
		
		function checkFrameName() {
			var cssText;

			try {
				cssText = iframe.contentWindow.name;
			}
			catch (e) { }

			if (cssText) {
				// We've got what we need. Stop the iframe from loading further content.
				iframe.src = "about:blank";
				iframe.parentNode.removeChild(iframe);
				iframe = null;

			
				// Per http://j.mp/kn9EPh, not taking any chances. Flushing the ActiveXObject
				if (AXO) {
					AXO = null;

					if (win.CollectGarbage) {
						win.CollectGarbage();
					}
				}

				callback(cssText);
			}
			else{
				win.setTimeout(checkFrameName, 100);
			}
		}
		
		win.setTimeout(checkFrameName, 500);
	}

    // http://stackoverflow.com/a/472729
	function checkBaseURL(href) {
        var el = document.createElement('div'),
        escapedURL = href.split('&').join('&amp;').
            split('<').join('&lt;').
            split('"').join('&quot;');

        el.innerHTML = '<a href="' + escapedURL + '">x</a>';
        return el.firstChild.href;
	}
	
	function checkRedirectURL() {
		// IE6 & IE7 don't build out absolute urls in <link /> attributes.
		// So respond.proxy.gif remains relative instead of http://example.com/respond.proxy.gif.
		// This trickery resolves that issue.
		if (!~redirectURL.indexOf(location.host)) {

			var fakeLink = doc.createElement("div");

			fakeLink.innerHTML = '<a href="' + redirectURL + '"></a>';
			docElem.insertBefore(fakeLink, docElem.firstElementChild || docElem.firstChild );

			// Grab the parsed URL from that dummy object
			redirectURL = fakeLink.firstChild.href;

			// Clean up
			fakeLink.parentNode.removeChild(fakeLink);
			fakeLink = null;
		}
	}
	
	function buildUrls(){
		var links = doc.getElementsByTagName( "link" );
		
		for( var i = 0, linkl = links.length; i < linkl; i++ ){
			
			var thislink	= links[i],
				href		= links[i].href,
				extreg		= (/^([a-zA-Z:]*\/\/(www\.)?)/).test( href ),
				ext			= (baseElem && !extreg) || extreg;

			//make sure it's an external stylesheet
			if( thislink.rel.indexOf( "stylesheet" ) >= 0 && ext ){
				(function( link ){			
					fakejax( href, function( css ){
						link.styleSheet.rawCssText = css;
						respond.update();
					} );
				})( thislink );
			}	
		}

		
	}
	
	if( !respond.mediaQueriesSupported ){
		checkRedirectURL();
		getProxyHostMap();
		buildUrls();
	}

})( window, document );
