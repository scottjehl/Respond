# Respond.js 
### A fast & lightweight polyfill for min/max-width CSS3 Media Queries (for IE 6-8, and more)

 - Copyright 2011: Scott Jehl, scottjehl.com
 - Dual licensed under the MIT or GPL Version 2 licenses. 
 
The goal of this script is to provide a fast and lightweight (3kb minified / 1kb gzipped) script to enable [responsive web designs](http://www.alistapart.com/articles/responsive-web-design/) in browsers that don't support CSS3 Media Queries - in particular, Internet Explorer 8 and under. It's written in such a way that it will probably patch support for other non-supporting browsers as well (more information on that soon).

If you're unfamiliar with the concepts surrounding Responsive Web Design, you can read up [here](http://www.alistapart.com/articles/responsive-web-design/) and also [here](http://filamentgroup.com/examples/responsive-images/)


Usage Instructions
======

- Craft your CSS with min/max-width media queries to adapt your layout from mobile (first) all the way up to desktop

- Follow each of your media query closing braces with this closing comment (handy for scanning the stylesheet anyway, IMHO):

<pre>
    @media screen and (min-width: 480px){
        ...styles for 480px and up go here
    }/*/mediaquery*/
</pre>

- Reference the respond.min.js script (1kb min/gzipped) after all of your CSS

- Crack open Internet Explorer and pump fists in delight


Support & Caveats
======

Some notes to keep in mind:

- This script's focus is purposely very narrow: only min-width and max-width media queries (along with their media type) are translated to non-supporting browsers. I wanted to keep things simple for filesize, maintenance, and performance, so I've intentionally limited support to queries that are essential to building a mobile-first responsive design. In the future, I may rework things a bit to include a hook for patching-in additional media query features - stay tuned!

- Browsers that natively support CSS3 Media Queries are opted-out of running this script as quickly as possible. In testing for support, I immediately pass browsers that support the window.matchMedia API (such as recent Chrome releases), and Internet Explorer 9+. Internet Explorer 8 and under are immediately flagged for failed media query support. All other browsers are subjected to a quick feature test to determine whether they support media queries or not before proceeding to run the script.

- This script relies on no other scripts or frameworks, and is optimized for mobile delivery (~1kb total filesize)

- During translation, cascade order is preserved, so you can count on styles applying in the order you wrote them.

- As you might guess by the closing-comment requirement, this implementation is quite dumb in regards to CSS parsing rules. This is a good thing, because it makes it run really fast, but it's looseness may also cause unexpected behavior. For example: if you enclose a whole media query in a comment intending to disable its rules, you'll probably find that those rules will end up enabled in non-media-query-supporting browsers. Keep things simple and you'll be less likely to encounter issues.

- It may not work with @import'd CSS files right now, and it probably won't ever work with media queries within style elements, as those styles can't be re-requested for parsing.

- Due to security restrictions, some browsers may not allow this script to work on file:// urls (because it uses xmlHttpRequest). 

- Currently, this script will only work with same-domain CSS files, though I may patch that up soon.

- While this script has been tested against very complex responsive designs, I make no guarantees that it will work with yours. Feel free to file an issue if it doesn't work as described, and I might be able to help you out!


How's it work?
======
Basically, the script loops through the CSS referenced in the page and runs a regular expression or two on their contents to find media queries and their associated blocks of CSS. The closing comment noted above is the marker that the script recognizes the end of a query, so don't forget to add it! Since at least in Internet Explorer, the content of the stylesheet seems to be impossible to retrieve in its pre-parsed state (which in IE 8-, means its media queries are removed from the text), the script re-requests the CSS files using Ajax and parses the text response from there. Obviously, this brings a little undesirable overhead, but it should not result in a additional server requests as long as cache settings are honored (testing is needed to verify).

From there, each query block is appended to the head in order via style elements, and those style elements are enabled and disabled (read: appended and removed from the DOM) depending on how their min/max width compares with the browser width. The media attribute on the style elements will match that of the query in the CSS, so it could be "screen", "projector", or whatever you want. Any relative paths contained in the CSS will be prefixed by their stylesheet's href, so image paths will direct to their proper destination


Alternatives to this script
======
This isn't the only CSS3 Media Query polyfill script out there; but it damn well may be the fastest.

If you're looking for more robust CSS3 Media Query support, you might check out http://code.google.com/p/css3-mediaqueries-js/. In testing, I've found that script to be noticeably slow when rendering complex responsive designs (both in filesize and performance), but it really does support a lot more media query features than this script. Big hat tip to the authors! :)