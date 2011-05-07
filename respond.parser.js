
(function(global, doc, undefined) {

  var parseMQs = function(str) {
    var index = 0,
        len = str.length,
        stack = [],
        media = [],
        queries = [],
        inMediaQuery = false,
        inDoubleString = false,
        inSingleString = false;

    while (index < len) {
      switch (str[index]) {
        case '{':
          if (!inDoubleString && !inSingleString) {
            stack.push('{');
            if (stack.length === 2) {
              inMediaQuery = true;
            } 
          }
          break;

        case '}':
          if (!inDoubleString && !inSingleString) {        
            stack.pop();
            if (stack.length === 0 && inMediaQuery) {
              // We might be in a media query!
              if (media.length) {
                var start = media.pop();
                queries.push(str.substring(start, index));
              }
              inMediaQuery = false;
            }
          }
          break;
          
        case '@':
          if (!inDoubleString && !inSingleString && str.substring(index + 1, index + 6) === 'media') {
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
        
        case '"':
          console.log('inDoubleString');
          inDoubleString = (!inSingleString && !inDoubleString);
          break;
        
        case "'":
          console.log('inSingleString');
          inSingleString = (!inDoubleString && !inSingleString);
          break;
        
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
