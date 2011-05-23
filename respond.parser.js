
(function(win, doc, undefined) {

  var parseMQs = function(str) {
    var index = 0,
        len = str.length,
        stack = [],
        media = [],
        queries = [],
        inMediaQuery = false;
        
    while (index < len) {
      switch (str.charAt(index)) {
        // Start of a block.
        case '{':
          stack.push('{');
          if (stack.length === 2) {
            inMediaQuery = true;
          }
          break;
        
        // End of a block.
        case '}':
          stack.pop();
          if (stack.length === 0 && inMediaQuery) {
            if (media.length) {
              queries.push(str.substring(media.pop(), index));
            }
            inMediaQuery = false;
          }
          break;
        
        // @media queries.
        case '@':
          if (str.substring(index, index + 7) === '@media ') {
            var start = index;
            // Zip forward to the start of the media query.
            while (++index < len && str.charAt(index) !== '{');
            
            // Save the location of this media query.  If we hit the end of the file
            // just fucking, i don't know.
            if (str.charAt(index) === '{') {
              media.push(start);
              index--;
            }
          }
          break;
        
        // Doubley quoted strings.
        case '"':
          while (++index < len && str.charAt(index) !== '"');
          break;
        
        // Singley quoted strings.
        case "'":
          while (++index < len && str.charAt(index) !== "'");
          break;
        
        // Comments.
        case "/":
          if (str.charAt(index + 1) == '*') {
            index += 2;
            // Zip to the end of this comment block.
            while (++index < len && str.charAt(index) !== '/' && str.charAt(index - 1) !== '*');
          }
          break;
      };

      index++;
    }
    
    return queries;
  };
  
  win.respond = win.respond || {};
  win.respond.parseMQs = parseMQs;

})(window, document);
