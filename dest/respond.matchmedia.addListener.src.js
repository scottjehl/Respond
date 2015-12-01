/*! Respond.js v1.4.2: min/max-width media query polyfill
 * Copyright 2015 Scott Jehl
 * Licensed under MIT
 * http://j.mp/respondjs */

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */
/*! NOTE: If you're already including a window.matchMedia polyfill via Modernizr or otherwise, you don't need this part */
(function(w) {
  "use strict";
  w.matchMedia = w.matchMedia || function(doc, undefined) {
    var bool, docElem = doc.documentElement, refNode = docElem.firstElementChild || docElem.firstChild, fakeBody = doc.createElement("body"), div = doc.createElement("div");
    div.id = "mq-test-1";
    div.style.cssText = "position:absolute;top:-100em";
    fakeBody.style.background = "none";
    fakeBody.appendChild(div);
    return function(q) {
      div.innerHTML = '&shy;<style media="' + q + '"> #mq-test-1 { width: 42px; }</style>';
      docElem.insertBefore(fakeBody, refNode);
      bool = div.offsetWidth === 42;
      docElem.removeChild(fakeBody);
      return {
        matches: bool,
        media: q
      };
    };
  }(w.document);
})(this);

/*! matchMedia() polyfill addListener/removeListener extension. Author & copyright (c) 2012: Scott Jehl. Dual MIT/BSD license */
(function(w) {
  "use strict";
  if (w.matchMedia && w.matchMedia("all").addListener) {
    return false;
  }
  var localMatchMedia = w.matchMedia, hasMediaQueries = localMatchMedia("only all").matches, isListening = false, timeoutID = 0, queries = [], handleChange = function(evt) {
    w.clearTimeout(timeoutID);
    timeoutID = w.setTimeout(function() {
      for (var i = 0, il = queries.length; i < il; i++) {
        var mql = queries[i].mql, listeners = queries[i].listeners || [], matches = localMatchMedia(mql.media).matches;
        if (matches !== mql.matches) {
          mql.matches = matches;
          for (var j = 0, jl = listeners.length; j < jl; j++) {
            listeners[j].call(w, mql);
          }
        }
      }
    }, 30);
  };
  w.matchMedia = function(media) {
    var mql = localMatchMedia(media), listeners = [], index = 0;
    mql.addListener = function(listener) {
      if (!hasMediaQueries) {
        return;
      }
      if (!isListening) {
        isListening = true;
        w.addEventListener("resize", handleChange, true);
      }
      if (index === 0) {
        index = queries.push({
          mql: mql,
          listeners: listeners
        });
      }
      listeners.push(listener);
    };
    mql.removeListener = function(listener) {
      for (var i = 0, il = listeners.length; i < il; i++) {
        if (listeners[i] === listener) {
          listeners.splice(i, 1);
        }
      }
    };
    return mql;
  };
})(this);

(function(w) {
  "use strict";
  w.RESPOND_REPLACE_STYLES = w.RESPOND_REPLACE_STYLES || false;
  var respond = {};
  w.respond = respond;
  respond.update = function() {};
  var requestQueue = [], xmlHttp = function() {
    var xmlhttpmethod = false;
    try {
      xmlhttpmethod = new w.XMLHttpRequest();
    } catch (e) {
      xmlhttpmethod = new w.ActiveXObject("Microsoft.XMLHTTP");
    }
    return function() {
      return xmlhttpmethod;
    };
  }(), ajax = function(url, callback) {
    var req = xmlHttp();
    if (!req) {
      return;
    }
    req.open("GET", url, true);
    req.onreadystatechange = function() {
      if (req.readyState !== 4 || req.status !== 200 && req.status !== 304) {
        return;
      }
      callback(req.responseText);
    };
    if (req.readyState === 4) {
      return;
    }
    req.send(null);
  }, isUnsupportedMediaQuery = function(query) {
    return query.replace(respond.regex.minmaxwh, "").match(respond.regex.other);
  };
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
  respond.mediaQueriesSupported = w.matchMedia && w.matchMedia("only all") !== null && w.matchMedia("only all").matches;
  if (respond.mediaQueriesSupported) {
    return;
  }
  var doc = w.document, docElem = doc.documentElement, mediastyles = [], rules = [], appendedEls = [], storedSheets = {}, parsedSheets = {}, resizeThrottle = 30, head = doc.getElementsByTagName("head")[0] || docElem, base = doc.getElementsByTagName("base")[0], links = head.getElementsByTagName("link"), lastCall, resizeDefer, eminpx, getEmValue = function() {
    var ret, div = doc.createElement("div"), body = doc.body, originalHTMLFontSize = docElem.style.fontSize, originalBodyFontSize = body && body.style.fontSize, fakeUsed = false;
    div.style.cssText = "position:absolute;font-size:1em;width:1em";
    if (!body) {
      body = fakeUsed = doc.createElement("body");
      body.style.background = "none";
    }
    docElem.style.fontSize = "100%";
    body.style.fontSize = "100%";
    body.appendChild(div);
    if (fakeUsed) {
      docElem.insertBefore(body, docElem.firstChild);
    }
    ret = div.offsetWidth;
    if (fakeUsed) {
      docElem.removeChild(body);
    } else {
      body.removeChild(div);
    }
    docElem.style.fontSize = originalHTMLFontSize;
    if (originalBodyFontSize) {
      body.style.fontSize = originalBodyFontSize;
    }
    ret = eminpx = parseFloat(ret);
    return ret;
  }, isRuleActive = function(hasquery, min, max) {
    var name = "clientWidth", docElemProp = docElem[name], currWidth = doc.compatMode === "CSS1Compat" && docElemProp || doc.body[name] || docElemProp, minnull = min === null, maxnull = max === null, em = "em";
    if (!!min) {
      min = parseFloat(min) * (min.indexOf(em) > -1 ? eminpx || getEmValue() : 1);
    }
    if (!!max) {
      max = parseFloat(max) * (max.indexOf(em) > -1 ? eminpx || getEmValue() : 1);
    }
    return !hasquery || (!minnull || !maxnull) && (minnull || currWidth >= min) && (maxnull || currWidth <= max);
  }, replaceStringBetween = function(source, replacement, start, end) {
    return source.substring(0, start) + replacement + source.substring(end);
  }, applyMedia = function(fromResize) {
    var method, now = new Date().getTime();
    if (w.RESPOND_REPLACE_STYLES) {
      method = applyMediaReplace;
    } else {
      method = applyMediaAppend;
    }
    if (fromResize && lastCall && now - lastCall < resizeThrottle) {
      w.clearTimeout(resizeDefer);
      resizeDefer = w.setTimeout(method, resizeThrottle);
      return;
    } else {
      lastCall = now;
    }
    method();
  }, removeAppendEls = function() {
    for (var j in appendedEls) {
      if (appendedEls.hasOwnProperty(j)) {
        if (appendedEls[j] && appendedEls[j].parentNode === head) {
          head.removeChild(appendedEls[j]);
        }
      }
    }
    appendedEls.length = 0;
  }, applyMediaReplace = function() {
    var lastLink = links[links.length - 1];
    removeAppendEls();
    for (var l in storedSheets) {
      if (storedSheets.hasOwnProperty(l)) {
        var stored = storedSheets[l], styles = stored.styles, sheet = stored.sheet, css = styles, styleBlocks = {}, styleBlocksAll = [], alreadyReplaced = {}, thisstyle, min, max;
        for (var m in stored.mediastyles) {
          if (stored.mediastyles.hasOwnProperty(m)) {
            thisstyle = stored.mediastyles[m];
            min = thisstyle.minw;
            max = thisstyle.maxw;
            if (thisstyle.media === "all") {
              styleBlocksAll.push(thisstyle);
            } else if (isRuleActive(thisstyle.hasquery, min, max)) {
              if (!styleBlocks[thisstyle.media]) {
                styleBlocks[thisstyle.media] = [];
              }
              styleBlocks[thisstyle.media].push(rules[thisstyle.rules]);
            }
          }
        }
        for (var n = styleBlocksAll.length - 1; n >= 0; n--) {
          thisstyle = styleBlocksAll[n];
          min = thisstyle.minw;
          max = thisstyle.maxw;
          var rule = rules[thisstyle.rules], start = thisstyle.replaceIndexStart, end = thisstyle.replaceIndexEnd, replacement = "";
          if (alreadyReplaced[rule]) {
            continue;
          }
          if (isRuleActive(thisstyle.hasquery, min, max)) {
            replacement = rule;
          }
          css = replaceStringBetween(css, replacement, start, end);
          alreadyReplaced[rule] = true;
        }
        insertCss(css, "all", stored.insertBefore);
        if (sheet.parentElement !== null) {
          head.removeChild(sheet);
        }
        for (var o in styleBlocks) {
          if (styleBlocks.hasOwnProperty(o)) {
            insertCss(styleBlocks[o].join("\n"), o, stored.insertBefore);
          }
        }
      }
    }
  }, applyMediaAppend = function() {
    var styleBlocks = {}, lastLink = links[links.length - 1];
    for (var i in mediastyles) {
      if (mediastyles.hasOwnProperty(i)) {
        var thisstyle = mediastyles[i], min = thisstyle.minw, max = thisstyle.maxw;
        if (isRuleActive(thisstyle.hasquery, min, max)) {
          if (!styleBlocks[thisstyle.media]) {
            styleBlocks[thisstyle.media] = [];
          }
          styleBlocks[thisstyle.media].push(rules[thisstyle.rules]);
        }
      }
    }
    removeAppendEls();
    for (var k in styleBlocks) {
      if (styleBlocks.hasOwnProperty(k)) {
        insertCss(styleBlocks[k].join("\n"), k, lastLink.nextSibling);
      }
    }
  }, insertCss = function(css, media, insertBefore) {
    var ss = doc.createElement("style");
    ss.type = "text/css";
    ss.media = media;
    head.insertBefore(ss, insertBefore);
    if (ss.styleSheet) {
      ss.styleSheet.cssText = css;
    } else {
      ss.appendChild(doc.createTextNode(css));
    }
    appendedEls.push(ss);
  }, replaceUrls = function(styles, href) {
    href = href.substring(0, href.lastIndexOf("/"));
    if (href.length) {
      href += "/";
    }
    return styles.replace(respond.regex.urls, "$1" + href + "$2$3");
  }, translate = function(styles, href, media) {
    styles = styles.replace(respond.regex.comments, "").replace(respond.regex.keyframes, "");
    if (w.RESPOND_REPLACE_STYLES) {
      styles = replaceUrls(styles, href);
      storedSheets[href].styles = styles;
      storedSheets[href].mediastyles = [];
    }
    var qs = styles.match(respond.regex.media), ql = qs && qs.length || 0, useMedia = !ql && media;
    if (useMedia) {
      ql = 1;
    }
    for (var i = 0; i < ql; i++) {
      var fullq, thisq, eachq, eql, rule;
      if (useMedia) {
        fullq = media;
        rule = styles;
      } else {
        fullq = qs[i].match(respond.regex.findStyles) && RegExp.$1;
        rule = RegExp.$2;
      }
      if (w.RESPOND_REPLACE_STYLES) {
        rules.push(rule);
      } else {
        rules.push(rule && replaceUrls(rule, href));
      }
      eachq = fullq.split(",");
      eql = eachq.length;
      for (var j = 0; j < eql; j++) {
        thisq = eachq[j];
        if (isUnsupportedMediaQuery(thisq)) {
          continue;
        }
        var thisstyle = {
          media: thisq.split("(")[0].match(respond.regex.only) && RegExp.$2 || "all",
          rules: rules.length - 1,
          hasquery: thisq.indexOf("(") > -1,
          minw: thisq.match(respond.regex.minw) && parseFloat(RegExp.$1) + (RegExp.$2 || ""),
          maxw: thisq.match(respond.regex.maxw) && parseFloat(RegExp.$1) + (RegExp.$2 || "")
        };
        if (w.RESPOND_REPLACE_STYLES) {
          thisstyle.replaceIndexStart = storedSheets[href].styles.indexOf(qs[i]);
          thisstyle.replaceIndexEnd = thisstyle.replaceIndexStart + qs[i].length;
          storedSheets[href].mediastyles.push(thisstyle);
        } else {
          mediastyles.push(thisstyle);
        }
      }
    }
    applyMedia();
  }, makeRequests = function() {
    if (requestQueue.length) {
      var thisRequest = requestQueue.shift();
      ajax(thisRequest.href, function(styles) {
        if (w.RESPOND_REPLACE_STYLES) {
          storedSheets[thisRequest.href] = {
            sheet: thisRequest.sheet,
            insertBefore: thisRequest.sheet.nextSibling,
            styles: styles
          };
        }
        translate(styles, thisRequest.href, thisRequest.media);
        parsedSheets[thisRequest.href] = true;
        w.setTimeout(function() {
          makeRequests();
        }, 0);
      });
    }
  }, ripCSS = function() {
    for (var i = 0; i < links.length; i++) {
      var sheet = links[i], href = sheet.href, media = sheet.media, isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet";
      if (!!href && isCSS && !parsedSheets[href]) {
        if (sheet.styleSheet && sheet.styleSheet.rawCssText) {
          if (w.RESPOND_REPLACE_STYLES) {
            storedSheets[href] = {
              sheet: sheet,
              insertBefore: sheet.nextSibling,
              styles: sheet.styleSheet.rawCssText
            };
          }
          translate(sheet.styleSheet.rawCssText, href, media);
          parsedSheets[href] = true;
        } else {
          if (!/^([a-zA-Z:]*\/\/)/.test(href) && !base || href.replace(RegExp.$1, "").split("/")[0] === w.location.host) {
            if (href.substring(0, 2) === "//") {
              href = w.location.protocol + href;
            }
            requestQueue.push({
              sheet: sheet,
              href: href,
              media: media
            });
          }
        }
      }
    }
    makeRequests();
  };
  ripCSS();
  respond.update = ripCSS;
  respond.getEmValue = getEmValue;
  function callMedia() {
    applyMedia(true);
  }
  if (w.addEventListener) {
    w.addEventListener("resize", callMedia, false);
  } else if (w.attachEvent) {
    w.attachEvent("onresize", callMedia);
  }
})(this);