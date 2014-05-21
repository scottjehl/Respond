/*
 Respond.js unit tests - based on qUnit
*/

QUnit.config.reorder = false;

window.onload = function(){

	function getNormalizedUrl( filename ) {
		var url = window.location.href;
		return url.substr( 0, url.lastIndexOf( '/' ) + 1 ) + ( filename || '' );
	}

	// ajax doesn’t finish if you queue them while respond is already ajaxing
	function queueRequest( callback ) {
		var clearQueue = window.setInterval( function() {
			if( !respond.queue.length ) {
				window.clearInterval( clearQueue );
				callback();
			}
		}, 50 );
	}

	if( !window.opener ){

		document.documentElement.className = "launcher";

		document.getElementById("launcher").innerHTML = '<p>Tests must run in a popup window. <a href="suite.html" id="suitelink">Open test suite</a></p>';

		document.getElementById( "suitelink" ).onclick = function(){
			window.open( location.href + "?" + Math.random(), 'win', 'width=800,height=600,scrollbars=1,resizable=1' );
			return false;
		};

	}
	else {

		var testElem = document.getElementById("testelem");

		function getWidth(){
			return testElem.offsetWidth;
		}
		function getHeight(){
			return testElem.offsetHeight;
		}
		
		// A short snippet for detecting versions of IE in JavaScript - author: @padolsey
		var ie = (function(){

				var undef,
						v = 3,
						div = document.createElement('div'),
						all = div.getElementsByTagName('i');
		
				while (
						div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
						all[0]
				);
		
				return v > 4 ? v : undef;
		
		}());

		window.moveTo(0,0);
		
		/* TESTS HERE */ 
		asyncTest( 'Styles not nested in media queries apply as expected', function() { 
			window.resizeTo(200,800);
			setTimeout(function(){
				strictEqual( getWidth(), 50, "testelem is 50px wide when window is 200px wide" );
				start();
			}, 900);
		});
		
		asyncTest( 'styles within min-width media queries apply properly', function() { 
			window.resizeTo(520,800);
			setTimeout(function(){
				strictEqual( getWidth(), 150, 'testelem is 150px wide when window is 500px wide'  );
				start();
			}, 900);
		});
		
		// // This test is for a feature in IE7 and up
		if( ie >= 7 ){
			asyncTest( "attribute selectors still work (where supported) after respond runs its course", function() { 
				window.resizeTo(520,800);
				setTimeout(function(){
					strictEqual( getHeight(), 200, "testelem is 200px tall when window is 500px wide" );
					start();
				}, 900);
			});
		}
		
		
		asyncTest( 'styles within max-width media queries apply properly', function() { 
			window.resizeTo(300,800);
			setTimeout(function(){
				strictEqual( getHeight(), 150, 'testelem is 150px tall when window is under 480px wide'  );
				start();
			}, 900);
		});


		
		asyncTest( 'min and max-width media queries that use EM units apply properly', function() { 
			window.resizeTo(580,800);
			setTimeout(function(){
				strictEqual( getWidth(), 75, 'testelem is 75px wide when window is 580px wide (between 33em and 38em)'  );
				start();
			}, 900);
		});
		
		
		
		asyncTest( "styles within a min-width media query with an \"only\" keyword apply properly", function() { 
			window.resizeTo(660,800);
			setTimeout(function(){
				strictEqual( getWidth(), 250, "testelem is 250px wide when window is 650px wide" );
				start();
			}, 900);
		});
		
		asyncTest( "styles within a media query with a one true query among other false queries apply properly", function() { 
			window.resizeTo(800,800);
			setTimeout(function(){
				strictEqual( getWidth(), 350, "testelem is 350px wide when window is > 620px wide" );
				start();
			}, 900);
		});
		
		
		
		asyncTest( "Styles within a false media query do not apply", function() { 
			window.resizeTo(800,800);
			setTimeout(function(){
				notStrictEqual( getWidth(), 500, "testelem is not 500px wide when window is 800px wide" );
				start();

			}, 900);
		});

		asyncTest( "stylesheets with a media query in a media attribute apply when they should", function() { 
			window.resizeTo(1000,800);
			setTimeout(function(){
				strictEqual( getWidth(), 16, "testelem is 16px wide when window is wider than 950px" );
				start();
			}, 900);
		});

		// Careful, browserstack has a default resolution of 1024x768
		asyncTest( "stylesheets with an EM-based media query in a media attribute apply when they should", function() { 
			window.resizeTo(1150,800);
			setTimeout(function(){
				strictEqual( getWidth(), 25, "testelem is 25px wide when window is wider than 1100px wide. Does your screen width go that wide?" );
				start();
			}, 900);
		});

		asyncTest( 'Test keyframe animation inside of media query', function() { 
			queueRequest( function() {
				respond.ajax( getNormalizedUrl( 'test-with-keyframe.css' ),
					function( data ) {
						ok( data.replace( respond.regex.keyframes, '' ).match( respond.regex.media ), 'A keyframe animation doesn\'t bust the media regex.' );
						start();
					});
			});
		});

		asyncTest( 'Test comments inside of a media query', function() { 
			queueRequest( function() {
				respond.ajax( getNormalizedUrl( 'test-with-comment.css' ),
					function( data ) {
						var stripped = data.replace( respond.regex.comments, '' );
						// TODO allow /* */ inside of CSS content strings.
						ok( stripped.match( respond.regex.media ), 'Comments don\'t bust the media regex.' );
						ok( !stripped.match( /\/\*/gi ), 'No start comments exist in the result.' );
						ok( !stripped.match( /\*\//gi ), 'No end comments exist in the result.' );
						start();
					});
			});
		});

		test( 'Issue #242 overly agressive keyframes regex', function() {
			strictEqual( '@media(q1){ @keyframes abc{ from{ }to{ } } } @media(q2){}'.replace( respond.regex.keyframes, '' ), '@media(q1){  } @media(q2){}' );
			strictEqual( '@media(q1){} @keyframes abc{ from{ }to{ } } @media(q2){}'.replace( respond.regex.keyframes, '' ), '@media(q1){}  @media(q2){}' );
			strictEqual( '@media(q1){} @media(q2){ @keyframes abc{ from{ }to{ } } }'.replace( respond.regex.keyframes, '' ), '@media(q1){} @media(q2){  }' );
		});

		test( 'Test spaces around min-width/max-width', function() {
			ok( '@media only screen and (min-width: 1px) { }'.match( respond.regex.maxw ) === null );
			ok( '@media only screen and ( min-width: 1px ) { }'.match( respond.regex.maxw ) === null );
			ok( '@media only screen and (min-width: 1px) { }'.match( respond.regex.minw ).length );
			ok( '@media only screen and ( min-width: 1px ) { }'.match( respond.regex.minw ).length );

			ok( '@media only screen and (max-width: 1280px) { }'.match( respond.regex.minw ) === null );
			ok( '@media only screen and ( max-width: 1280px ) { }'.match( respond.regex.minw ) === null );
			ok( '@media only screen and (max-width: 1280px) { }'.match( respond.regex.maxw ).length );
			ok( '@media only screen and ( max-width: 1280px ) { }'.match( respond.regex.maxw ).length );
		});


		test( 'Issue #161: spaces around inside min-width/max-width', function() {
			ok( '@media only screen and (min-width : 1px) { }'.match( respond.regex.min ) !== null );
			ok( '@media only screen and (max-width : 1px ) { }'.match( respond.regex.maxw ) !== null );
		});

		test( 'Issue #181: non-min-width and non-max-width queries', function() {
			var others = ['(min--moz-device-pixel-ratio: 1.5)',
				'(-moz-min-device-pixel-ratio: 1.5)',
				'(-o-min-device-pixel-ratio: 1.5)',
				'(-webkit-min-device-pixel-ratio: 1.5)',
				'(min-device-pixel-ratio: 1.5)',
				'(min-resolution: 1.5dppx)'],
				str,
				mq;

			for( var j = 0, k = others.length; j<k; j++ ) {
				str = 'only screen and (max-width: 1319px) and ' + others[ j ] + ' {}';
				mq = str.match( respond.regex.minmaxwh );
				equal( mq && mq[ 0 ], '(max-width: 1319px)' );
				equal( respond.unsupportedmq( str )[ 0 ], others[ j ] );

				equal( ( 'only screen and (max-width: 1319px) and (min-width: 1px) and ' + others[ j ] + ' {}' ).replace( respond.regex.minmaxwh, '' ).match( respond.regex.other )[ 0 ], others[ j ] );
				equal( ( 'only screen and (max-width: 1319px) and (min-height: 1px) and ' + others[ j ] + ' {}' ).replace( respond.regex.minmaxwh, '' ).match( respond.regex.other )[ 0 ], others[ j ] );
			}
		});

		// At this point the media queries are already divided by commas
		test( 'Issue #181: unsupported MQ tests', function() { 
			// should pass
			strictEqual( respond.unsupportedmq( '(min-width: 1151px)' ), null );
			strictEqual( respond.unsupportedmq( 'all and (max-width: 699px) and (min-width: 520px)' ), null );
			strictEqual( respond.unsupportedmq( 'print' ), null );

			// source: http://www.w3.org/TR/css3-mediaqueries/
			// should fail: looks for anything in parens that is not min/max-height/width
			ok( respond.unsupportedmq( 'all and (orientation:portrait)' ) );
			ok( respond.unsupportedmq( 'screen and (device-aspect-ratio: 16/9)' ) );
			ok( respond.unsupportedmq( 'all and (color)' ) );
			ok( respond.unsupportedmq( 'all and (min-color: 1)' ) );
			ok( respond.unsupportedmq( 'all and (monochrome)' ) );
			ok( respond.unsupportedmq( 'print and (min-resolution: 300dpi)' ) );
			ok( respond.unsupportedmq( 'tv and (scan: progressive)' ) );
			ok( respond.unsupportedmq( 'handheld and (grid) and (device-max-height: 7em)' ) );
		});

		asyncTest( 'Issue #181: full MQ with DPR', function() { 
			queueRequest( function() {
				respond.ajax( getNormalizedUrl( 'test-with-dpr.css' ),
					function( data ) {
						ok( respond.unsupportedmq( data ) );
						start();
					});
			});
		});
	}
	
};