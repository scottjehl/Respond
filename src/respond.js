/* Respond.js: min/max-width media query polyfill. (c) Scott Jehl. MIT Lic. j.mp/respondjs  */
(function( w ){

	"use strict";

	//when set to true, linked stylesheets will be replaced entirely with style elements for "all" media whilst other media are appended in individual styles, to ensure the cascade is not altered
	w.RESPOND_REPLACE_STYLES = w.RESPOND_REPLACE_STYLES || false;

	//exposed namespace
	var respond = {};
	w.respond = respond;

	//define update even in native-mq-supporting browsers, to avoid errors
	respond.update = function(){};

	//define ajax obj
	var requestQueue = [],
		xmlHttp = (function() {
			var xmlhttpmethod = false;
			try {
				xmlhttpmethod = new w.XMLHttpRequest();
			}
			catch( e ){
				xmlhttpmethod = new w.ActiveXObject( "Microsoft.XMLHTTP" );
			}
			return function(){
				return xmlhttpmethod;
			};
		})(),

		//tweaked Ajax functions from Quirksmode
		ajax = function( url, callback ) {
			var req = xmlHttp();
			if (!req){
				return;
			}
			req.open( "GET", url, true );
			req.onreadystatechange = function () {
				if ( req.readyState !== 4 || req.status !== 200 && req.status !== 304 ){
					return;
				}
				callback( req.responseText );
			};
			if ( req.readyState === 4 ){
				return;
			}
			req.send( null );
		},
		isUnsupportedMediaQuery = function( query ) {
			return query.replace( respond.regex.minmaxwh, '' ).match( respond.regex.other );
		};

	//expose for testing
	respond.ajax = ajax;
	respond.queue = requestQueue;
	respond.unsupportedmq = isUnsupportedMediaQuery;
	respond.regex = {
		media: /@media[^\{]+\{(([^\{\}]*\{[^\}\{]*\})+)[^\}]*\}/gi,
		keyframes: /@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi,
		comments: /\/\*[^*]*\*+([^/][^*]*\*+)*\//gi,
		urls: /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g,
		findStyles: /@media *([^\{]+)\{([\S\s]+?)\}$/,
		only: /(only\s+)?([a-zA-Z]+)\s?/,
		minw: /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
		maxw: /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
		minmaxwh: /\(\s*m(in|ax)\-(height|width)\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/gi,
		other: /\([^\)]*\)/g
	};

	//expose media query support flag for external use
	respond.mediaQueriesSupported = w.matchMedia && w.matchMedia( "only all" ) !== null && w.matchMedia( "only all" ).matches;

	//if media queries are supported, exit here
	if( respond.mediaQueriesSupported ){
		return;
	}

	//define vars
	var doc = w.document,
		docElem = doc.documentElement,
		mediastyles = [],
		rules = [],
		appendedEls = [],
		storedSheets = {},
		parsedSheets = {},
		resizeThrottle = 30,
		head = doc.getElementsByTagName( "head" )[0] || docElem,
		base = doc.getElementsByTagName( "base" )[0],
		links = head.getElementsByTagName( "link" ),

		lastCall,
		resizeDefer,

		//cached container for 1em value, populated the first time it's needed
		eminpx,

		// returns the value of 1em in pixels
		getEmValue = function() {
			var ret,
				div = doc.createElement('div'),
				body = doc.body,
				originalHTMLFontSize = docElem.style.fontSize,
				originalBodyFontSize = body && body.style.fontSize,
				fakeUsed = false;

			div.style.cssText = "position:absolute;font-size:1em;width:1em";

			if( !body ){
				body = fakeUsed = doc.createElement( "body" );
				body.style.background = "none";
			}

			// 1em in a media query is the value of the default font size of the browser
			// reset docElem and body to ensure the correct value is returned
			docElem.style.fontSize = "100%";
			body.style.fontSize = "100%";

			body.appendChild( div );

			if( fakeUsed ){
				docElem.insertBefore( body, docElem.firstChild );
			}

			ret = div.offsetWidth;

			if( fakeUsed ){
				docElem.removeChild( body );
			}
			else {
				body.removeChild( div );
			}

			// restore the original values
			docElem.style.fontSize = originalHTMLFontSize;
			if( originalBodyFontSize ) {
				body.style.fontSize = originalBodyFontSize;
			}


			//also update eminpx before returning
			ret = eminpx = parseFloat(ret);

			return ret;
		},

		isRuleActive = function( hasquery, min, max ){
			var name = "clientWidth",
				docElemProp = docElem[ name ],
				currWidth = doc.compatMode === "CSS1Compat" && docElemProp || doc.body[ name ] || docElemProp,
				minnull = min === null,
				maxnull = max === null,
				em = "em";

			if( !!min ){
				min = parseFloat( min ) * ( min.indexOf( em ) > -1 ? ( eminpx || getEmValue() ) : 1 );
			}
			if( !!max ){
				max = parseFloat( max ) * ( max.indexOf( em ) > -1 ? ( eminpx || getEmValue() ) : 1 );
			}

			// if there's no media query at all (the () part), or min or max is not null, and if either is present, they're true
			return !hasquery || ( !minnull || !maxnull ) && ( minnull || currWidth >= min ) && ( maxnull || currWidth <= max );
		},

		replaceStringBetween = function( source, replacement, start, end ){
			//replace the content between a start and end index
			return source.substring( 0, start ) + replacement + source.substring( end );
		},

		applyMedia = function( fromResize ){
			var method,
				now = (new Date()).getTime();

			if( w.RESPOND_REPLACE_STYLES ){
				method = applyMediaReplace;
			}
			else{
				method = applyMediaAppend;
			}

			//throttle resize calls
			if( fromResize && lastCall && now - lastCall < resizeThrottle ){
				w.clearTimeout( resizeDefer );
				resizeDefer = w.setTimeout( method, resizeThrottle );
				return;
			}
			else {
				lastCall = now;
			}

			method();
		},

		removeAppendEls = function(){
			//remove any existing respond style element(s)
			for( var j in appendedEls ){
				if( appendedEls.hasOwnProperty( j ) ){
					if( appendedEls[ j ] && appendedEls[ j ].parentNode === head ){
						head.removeChild( appendedEls[ j ] );
					}
				}
			}
			appendedEls.length = 0;
		},

		applyMediaReplace = function(){
			var lastLink = links[ links.length-1 ];

			removeAppendEls();

			//inject active styles, replacing current stylesheet
			for( var l in storedSheets ){
				if( storedSheets.hasOwnProperty( l ) ){
					var stored = storedSheets[ l ],
						styles = stored.styles,
						sheet = stored.sheet,
						css = styles,
						styleBlocks = {},
						styleBlocksAll = [],
						alreadyReplaced = {},
						thisstyle, min, max;

					for( var m in stored.mediastyles ){
						if( stored.mediastyles.hasOwnProperty( m ) ){
							thisstyle = stored.mediastyles[ m ];
							min = thisstyle.minw;
							max = thisstyle.maxw;

							if( thisstyle.media === "all" ){
								styleBlocksAll.push(thisstyle);
							}
							else if( isRuleActive( thisstyle.hasquery, min, max ) ){
								//group by media type
								if( !styleBlocks[ thisstyle.media ] ){
									styleBlocks[ thisstyle.media ] = [];
								}
								styleBlocks[ thisstyle.media ].push( rules[ thisstyle.rules ] );
							}
						}
					}

					//replace active rules with @media stripped and remove inactive rules, in reverse order so replace index won't change
					for( var n = styleBlocksAll.length - 1; n >= 0; n-- ){
						thisstyle = styleBlocksAll[ n ];
						min = thisstyle.minw;
						max = thisstyle.maxw;
						var rule = rules[ thisstyle.rules ],
							start = thisstyle.replaceIndexStart,
							end = thisstyle.replaceIndexEnd,
							replacement = '';

						if( alreadyReplaced[ rule ] ){
							//this rule has already been applied for "all" media, we don't need to add it again for the other media queries it is under
							continue;
						}

						if( isRuleActive( thisstyle.hasquery, min, max ) ){
							replacement = rule;
						}

						css = replaceStringBetween( css, replacement, start, end );
						alreadyReplaced[ rule ] = true;
					}

					insertCss( css, "all", stored.insertBefore );

					//remove original stylesheet
					if( sheet.parentElement !== null ){
						head.removeChild( sheet );
					}

					//inject active styles, grouped by media type
					for( var o in styleBlocks ){
						if( styleBlocks.hasOwnProperty( o ) ){
							insertCss( styleBlocks[ o ].join( "\n" ), o, stored.insertBefore );
						}
					}
				}
			}
		},

		//enable/disable styles
		applyMediaAppend = function(){
			var styleBlocks = {},
				lastLink = links[ links.length-1 ];

			for( var i in mediastyles ){
				if( mediastyles.hasOwnProperty( i ) ){
					var thisstyle = mediastyles[ i ],
						min = thisstyle.minw,
						max = thisstyle.maxw;

					if( isRuleActive( thisstyle.hasquery, min, max ) ){
						if( !styleBlocks[ thisstyle.media ] ){
							styleBlocks[ thisstyle.media ] = [];
						}
						styleBlocks[ thisstyle.media ].push( rules[ thisstyle.rules ] );
					}
				}
			}

			removeAppendEls();

			//inject active styles, grouped by media type
			for( var k in styleBlocks ){
				if( styleBlocks.hasOwnProperty( k ) ){
					insertCss( styleBlocks[ k ].join( "\n" ), k, lastLink.nextSibling );
				}
			}
		},

		insertCss = function( css, media, insertBefore ){
			var ss = doc.createElement( "style" );

			ss.type = "text/css";
			ss.media = media;

			//originally, ss was appended to a documentFragment and sheets were appended in bulk.
			//this caused crashes in IE in a number of circumstances, such as when the HTML element had a bg image set, so appending beforehand seems best. Thanks to @dvelyk for the initial research on this one!
			head.insertBefore( ss, insertBefore );

			if ( ss.styleSheet ){
				ss.styleSheet.cssText = css;
			}
			else {
				ss.appendChild( doc.createTextNode( css ) );
			}

			//push to appendedEls to track for later removal
			appendedEls.push( ss );
		},

		replaceUrls = function( styles, href ){
			//try to get CSS path
			href = href.substring( 0, href.lastIndexOf( "/" ) );

			//if path exists, tack on trailing slash
			if( href.length ){ href += "/"; }

			return styles.replace( respond.regex.urls, "$1" + href + "$2$3" );
		},

		//find media blocks in css text, convert to style blocks
		translate = function( styles, href, media ){
			styles = styles.replace( respond.regex.comments, '' )
					.replace( respond.regex.keyframes, '' );

			if( w.RESPOND_REPLACE_STYLES ){
				//replace urls in the whole stylesheet
				styles = replaceUrls( styles, href );
				storedSheets[ href ].styles = styles;
				storedSheets[ href ].mediastyles = [];
			}

			var qs = styles.match( respond.regex.media ),
				ql = qs && qs.length || 0,
				useMedia = !ql && media;

			//if no internal queries exist, but media attr does, use that
			//note: this currently lacks support for situations where a media attr is specified on a link AND
				//its associated stylesheet has internal CSS media queries.
				//In those cases, the media attribute will currently be ignored.
			if( useMedia ){
				ql = 1;
			}

			for( var i = 0; i < ql; i++ ){
				var fullq, thisq, eachq, eql, rule;

				//media attr
				if( useMedia ){
					fullq = media;
					rule = styles;
				}
				//parse for styles
				else{
					fullq = qs[ i ].match( respond.regex.findStyles ) && RegExp.$1;
					rule = RegExp.$2;
				}

				if( w.RESPOND_REPLACE_STYLES ){
					//urls have already been replaced
					rules.push( rule );
				}
				else {
					//replace urls only in the rules that are appended
					rules.push( rule && replaceUrls( rule, href ) );
				}

				eachq = fullq.split( "," );
				eql = eachq.length;

				for( var j = 0; j < eql; j++ ){
					thisq = eachq[ j ];

					if( isUnsupportedMediaQuery( thisq ) ) {
						continue;
					}

					var thisstyle = {
						media : thisq.split( "(" )[ 0 ].match( respond.regex.only ) && RegExp.$2 || "all",
						rules : rules.length - 1,
						hasquery : thisq.indexOf("(") > -1,
						minw : thisq.match( respond.regex.minw ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" ),
						maxw : thisq.match( respond.regex.maxw ) && parseFloat( RegExp.$1 ) + ( RegExp.$2 || "" )
					};
					if( w.RESPOND_REPLACE_STYLES ){
						thisstyle.replaceIndexStart = storedSheets[ href ].styles.indexOf( qs[ i ] );
						thisstyle.replaceIndexEnd = thisstyle.replaceIndexStart + qs[ i ].length;
						storedSheets[ href ].mediastyles.push( thisstyle );
					}
					else {
						mediastyles.push( thisstyle );
					}
				}
			}

			applyMedia();
		},

		//recurse through request queue, get css text
		makeRequests = function(){
			if( requestQueue.length ){
				var thisRequest = requestQueue.shift();

				ajax( thisRequest.href, function( styles ){
					if( w.RESPOND_REPLACE_STYLES ){
						storedSheets[ thisRequest.href ] = {
							sheet: thisRequest.sheet,
							insertBefore: thisRequest.sheet.nextSibling,
							styles: styles
						};
					}
					translate( styles, thisRequest.href, thisRequest.media );
					parsedSheets[ thisRequest.href ] = true;

					// by wrapping recursive function call in setTimeout
					// we prevent "Stack overflow" error in IE7
					w.setTimeout(function(){ makeRequests(); },0);
				} );
			}
		},

		//loop stylesheets, send text content to translate
		ripCSS = function(){

			for( var i = 0; i < links.length; i++ ){
				var sheet = links[ i ],
				href = sheet.href,
				media = sheet.media,
				isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet";

				//only links plz and prevent re-parsing
				if( !!href && isCSS && !parsedSheets[ href ] ){
					// selectivizr exposes css through the rawCssText expando
					if (sheet.styleSheet && sheet.styleSheet.rawCssText) {
						if( w.RESPOND_REPLACE_STYLES ){
							storedSheets[ href ] = {
								sheet: sheet,
								insertBefore: sheet.nextSibling,
								styles: sheet.styleSheet.rawCssText
							};
						}
						translate( sheet.styleSheet.rawCssText, href, media );
						parsedSheets[ href ] = true;
					} else {
						if( (!/^([a-zA-Z:]*\/\/)/.test( href ) && !base) ||
							href.replace( RegExp.$1, "" ).split( "/" )[0] === w.location.host ){
							// IE7 doesn't handle urls that start with '//' for ajax request
							// manually add in the protocol
							if ( href.substring(0,2) === "//" ) { href = w.location.protocol + href; }
							requestQueue.push( {
								sheet: sheet,
								href: href,
								media: media
							} );
						}
					}
				}
			}
			makeRequests();
		};

	//translate CSS
	ripCSS();

	//expose update for re-running respond later on
	respond.update = ripCSS;

	//expose getEmValue
	respond.getEmValue = getEmValue;

	//adjust on resize
	function callMedia(){
		applyMedia( true );
	}

	if( w.addEventListener ){
		w.addEventListener( "resize", callMedia, false );
	}
	else if( w.attachEvent ){
		w.attachEvent( "onresize", callMedia );
	}
})(this);
