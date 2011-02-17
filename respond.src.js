/*
 * respond.js - A small and fast polyfill for min/max-width CSS3 Media Queries
 * Copyright 2011, Scott Jehl, scottjehl.com
 * Dual licensed under the MIT or GPL Version 2 licenses. 
 * Usage: Check out the readme file or github.com/scottjehl/respond
*/
(function( win, mqSupported ){
	//exposed namespace
	win.respond		= {};
	
	//define update even in native-mq-supporting browsers, to avoid errors
	respond.update	= function(){};
	
	//expose media query support flag for external use
	respond.mediaQueriesSupported	= mqSupported;
	
	//if media queries are supported, exit here
	if( mqSupported ){ return; }
	
	//define vars
	var doc 			= win.document,
		docElem 		= doc.documentElement,
		mediastyles		= [],
		rules			= [],
		appendedEls 	= [],
		parsedSheets 	= {},
		resizeThrottle	= 30,
		head 			= doc.getElementsByTagName( "head" )[0] || docElem,
		links			= head.getElementsByTagName( "link" ),
		
		//loop stylesheets, send text content to translate
		ripCSS			= function(){
			var sheets 	= doc.styleSheets,
				sl 		= sheets.length;

			for( var i = 0; i < sl; i++ ){
				var sheet		= sheets[ i ],
					href		= sheet.href;
				
				//only links plz and prevent re-parsing
				if( !!href && !parsedSheets[ href ] ){
					ajax( href, function( styles ){
						translate( styles, href );
						parsedSheets[ href ] = true;
					} );
				}
			}		
		},
		//find media blocks in css text, convert to style blocks
		translate		= function( styles, href ){
			var qs		= styles.match( /@media ([^\{]+)\{([\S\s]+?)(?=\}\/\*\/mediaquery\*\/)/gmi ),
				ql		= qs && qs.length || 0,
				href	= href.substring( 0, href.lastIndexOf( "/" )) + "/";
				
			for( var i = 0; i < ql; i++ ){
				var fullq	= qs[ i ].match( /@media ([^\{]+)\{([\S\s]+?)$/ ) && RegExp.$1,
					eachq	= fullq.split( "," ),
					eql		= eachq.length;
					
				rules.push( RegExp.$2 && RegExp.$2.replace( /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g, "$1" + href + "$2$3" ) );
					
				for( var j = 0; j < eql; j++ ){
					var thisq	= eachq[ j ];
					mediastyles.push( { 
						media	: thisq.match( /(only\s+)?([a-zA-Z]+)(\sand)?/ ) && RegExp.$2,
						rules	: rules.length - 1,
						minw	: thisq.match( /\(min\-width:\s?(\s?[0-9]+)px\s?\)/ ) && parseFloat( RegExp.$1 ), 
						maxw	: thisq.match( /\(max\-width:\s?(\s?[0-9]+)px\s?\)/ ) && parseFloat( RegExp.$1 )
					} );
				}	
			}
			applyMedia();
		},
        	
		lastCall,
		
		resizeDefer,
		
		//enable/disable styles
		applyMedia			= function( fromResize ){
			var name		= "clientWidth",
				docElemProp	= docElem[ name ],
				currWidth 	= doc.compatMode === "CSS1Compat" && docElemProp || doc.body[ name ] || docElemProp,
				styleBlocks	= {},
				dFrag		= doc.createDocumentFragment(),
				lastLink	= links[ links.length-1 ],
				now 		= (new Date()).getTime();
			
			//throttle resize calls	
			if( fromResize && lastCall && now - lastCall < resizeThrottle ){
				clearTimeout( resizeDefer );
				resizeDefer = setTimeout( applyMedia, resizeThrottle );
				return;
			}
			else {
				lastCall	= now;
			}
										
			for( var i in mediastyles ){
				var thisstyle = mediastyles[ i ];
				if( !thisstyle.minw && !thisstyle.maxq || 
					( !thisstyle.minw || thisstyle.minw && currWidth >= thisstyle.minw ) && 
					(!thisstyle.maxw || thisstyle.maxw && currWidth <= thisstyle.maxw ) ){						
						if( !styleBlocks[ thisstyle.media ] ){
							styleBlocks[ thisstyle.media ] = [];
						}
						styleBlocks[ thisstyle.media ].push( rules[ thisstyle.rules ] );
				}
			}
			
			//remove any existing respond style element(s)
			for( var i in appendedEls ){
				if( appendedEls[ i ] && appendedEls[ i ].parentNode === head ){
					head.removeChild( appendedEls[ i ] );
				}
			}
			
			//inject active styles, grouped by media type
			for( var i in styleBlocks ){
				var ss		= doc.createElement( "style" ),
					css		= styleBlocks[ i ].join( "\n" );
				
				ss.type = "text/css";	
				ss.media	= i;
				
				if ( ss.styleSheet ){ 
		        	ss.styleSheet.cssText = css;
		        } 
		        else {
					ss.appendChild( doc.createTextNode( css ) );
		        }
		        dFrag.appendChild( ss );
				appendedEls.push( ss );
			}
			
			//append to DOM at once
			head.insertBefore( dFrag, lastLink.nextSibling );
		},
		//tweaked Ajax functions from Quirksmode
		ajax = function( url, callback ) {
			var req = xmlHttp();
			if (!req){
				return;
			}	
			req.open( "GET", url, true );
			req.onreadystatechange = function () {
				if ( req.readyState != 4 || req.status != 200 && req.status != 304 ){
					return;
				}
				callback( req.responseText );
			}
			if ( req.readyState == 4 ){
				return;
			}
			req.send();
		},
		//define ajax obj 
		xmlHttp = (function() {
			var xmlhttpmethod = false,
				attempts = [
					function(){ return new ActiveXObject("Microsoft.XMLHTTP") },
					function(){ return new ActiveXObject("Msxml3.XMLHTTP") },
					function(){ return new ActiveXObject("Msxml2.XMLHTTP") },
					function(){ return new XMLHttpRequest() }		
				],
				al = attempts.length;
		
			while( al-- ){
				try {
					xmlhttpmethod = attempts[ al ]();
				}
				catch(e) {
					continue;
				}
				break;
			}
			return function(){
				return xmlhttpmethod;
			};
		})();
	
	//translate CSS
	ripCSS();
	
	//expose update for re-running respond later on
	respond.update = ripCSS;
	
	//adjust on resize
	function callMedia(){
		applyMedia( true );
	}
	if( win.addEventListener ){
		win.addEventListener( "resize", callMedia, false );
	}
	else if( win.attachEvent ){
		win.attachEvent( "onresize", callMedia );
	}
})(
	this,
	(function( win ){
		//cond. comm. IE check by James Padolsey
		var ie = (function(undef){
 		    var v 	= 3,
		        div	= document.createElement( "div" ),
		        all	= div.getElementsByTagName( "i" );
		 
		    while(div.innerHTML = "<!--[if gt IE " + (++v) + "]><i></i><![endif]-->", all[0]);
		    return v > 4 ? v : undef;
		}());
		
		//for speed, flag browsers with window.matchMedia support and IE 9 as supported
		if( win.matchMedia || ie && ie >= 9 ){ return true; }
		//flag IE 8 and under as false - no test needed
		if( ie && ie <= 8 ){ return false; }
		//otherwise proceed with test
		var doc		= win.document,
			docElem	= doc.documentElement,
		    fb		= doc.createElement( "body" ),
		    div		= doc.createElement( "div" ),
		    se		= doc.createElement( "style" ),
			cssrule	= "@media only all { #qtest { position: absolute; } }";
		div.setAttribute( "id", "qtest" );
			
		se.type = "text/css";
		fb.appendChild( div );
		if ( se.styleSheet ){ 
		  se.styleSheet.cssText = cssrule;
		} 
		else {
		  se.appendChild( doc.createTextNode( cssrule ) );
		} 
		docElem.insertBefore( fb, docElem.firstChild );
		docElem.insertBefore( se, fb );
		support = ( win.getComputedStyle ? win.getComputedStyle( div, null ) : div.currentStyle )["position"] == "absolute";
		docElem.removeChild( fb );
		docElem.removeChild( se );
		return support;
	})( this )
);