/*
 Respond.js unit tests - based on qUnit
*/

window.onload = function(){

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

		//check if a particular style has applied properly
		function widthApplied( val ){
			return testElem.offsetWidth === val;
		}
		function heightApplied( val ){
			return testElem.offsetHeight === val;
		}

		window.moveTo(0,0);
		
		/* TESTS HERE */ 
		asyncTest( 'Styles not nested in media queries apply as expected', function() { 
			window.resizeTo(200,600);
			setTimeout(function(){
				ok( widthApplied( 50 ), "testelem is 50px wide when window is 200px wide" );
				start();
			}, 900);	
		});
		
		asyncTest( 'styles within min-width media queries apply properly', function() { 
			window.resizeTo(500,600);
			setTimeout(function(){
				ok( widthApplied( 150 ), 'testelem is 150px wide when window is 500px wide'  );
				start();
			}, 900);	
		});
		
		asyncTest( 'styles within max-width media queries apply properly', function() { 
			window.resizeTo(300,600);
			setTimeout(function(){
				ok( heightApplied( 150 ), 'testelem is 150px tall when window is under 480px wide'  );
				start();
			}, 900);	
		});
		
		
		
		asyncTest( "styles within a min-width media query with an \"only\" keyword apply properly", function() { 
			window.resizeTo(650,600);
			setTimeout(function(){
				ok( widthApplied( 250 ), "testelem is 250px wide when window is 650px wide" );
				start();
			}, 900);	
		});
		
		asyncTest( "styles within a media query with a one true query among other false queries apply properly", function() { 
			window.resizeTo(800,600);
			setTimeout(function(){
				ok( widthApplied( 350 ), "testelem is 350px wide when window is 750px wide" );
				start();
			}, 900);	
		});
		
		
		
		asyncTest( "Styles within a false media query do not apply", function() { 
			window.resizeTo(800,600);
			setTimeout(function(){
				ok( !widthApplied( 500 ), "testelem is not 500px wide when window is 1300px wide" );
				start();

			}, 900);	
		});
		
		asyncTest( "stylesheets with a media query in a media attribute apply when they should", function() { 
			window.resizeTo(1300,600);
			setTimeout(function(){
				ok( widthApplied( 16 ), "testelem is 16px wide when window is 1300px wide" );
				start();
			}, 900);	
		});
		
	}
	
};