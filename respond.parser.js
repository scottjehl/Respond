
(function(global, doc, undefined) {

  var parseMQs = function(str) {
    var index = 0,
        len = str.length,
        stack = [],
        media = [],
        queries = [],
        inMediaQuery = false;

    while (index < len) {
      switch (str[index]) {
        case '{':
          stack.push('{');
          if (stack.length === 2) {
            inMediaQuery = true;
          }
          break;

        case '}':
          stack.pop();
          if (stack.length === 0 && inMediaQuery) {
            // We might be in a media query!
            if (media.length) {
              var start = media.pop();
              queries.push(str.substring(start, index));
            }
            inMediaQuery = false;
          }
          break;
          
        case '@':
          if (str.substring(index + 1, index + 6) === 'media') {
            var start = index;
            // Zip forward to the start of the media query.
            while (str[index] !== '{' && index++ < len);
            
            // Save the location of this media query.  If we hit the end of the file
            // just fucking, i don't know, return.
            if (str[index] === '{') {
              media.push(start);
              index--;
            } else {
              return;
            }
          }
          break;
        
        // Doubley quoted strings.
        case '"':
          while (str[++index] !== '"');
          break;
        
        // Singley quoted strings.
        case "'":
          while (str[++index] !== "'");
          break;
        
        // Comments.
        case "/":
          if (str[index + 1] == '*') {
            index += 2;
            // Zip to the end of this comment block.
            while (str[++index] !== '/' && str[index - 1] !== '*');
          }
          break;
        
        default:
          // wat.
          break;
      };

      index++;
    }
    
    return queries;
  };

  global.parseMQs = parseMQs;

})(window, document);
