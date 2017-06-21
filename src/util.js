/*
 * Copyright 2015-present Boundless Spatial Inc., http://boundlessgeo.com
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import ol from 'openlayers';

export default {
  getProxiedUrl(url, opt_proxy) {
    if (opt_proxy) {
      return opt_proxy + encodeURIComponent(url);
    } else {
      return url;
    }
  },
  getResolutionForScale(scale, units) {
    var dpi = 25.4 / 0.28;
    var mpu = ol.proj.METERS_PER_UNIT[units];
    var inchesPerMeter = 39.37;
    return parseFloat(scale) / (mpu * inchesPerMeter * dpi);
  },
  getTimeInfo(layer) {
    if (layer.Dimension) {
      for (var i = 0, ii = layer.Dimension.length; i < ii; ++i) {
        var dimension = layer.Dimension[i];
        if (dimension.name === 'time') {
          return dimension.values;
        }
      }
    }
  },
  rgbToHex(rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? '#' +
      ('0' + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ('0' + parseInt(rgb[2],10).toString(16)).slice(-2) +
      ('0' + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
  },
  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  transformColor(color) {
    var colorObj = color.rgb ? color.rgb : color;
    return [colorObj.r, colorObj.g, colorObj.b, colorObj.a];
  },
  doJSONP(url, success, failure, scope) {
    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }
    var cbname = 'fn' + Date.now() + getRandomInt(1, 10000);
    var script = document.createElement('script');
    script.onerror = function() {
      if (failure) {
        failure.call(scope);
      }
    };
    script.src = url.replace('__cbname__', cbname);
    window[cbname] = function(jsonData) {
      success.call(scope, jsonData);
      delete window[cbname];
    };
    document.head.appendChild(script);
  },
  doGET(url, success, failure, scope, opt_requestHeaders) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState === 4) {
        if (xmlhttp.status === 200) {
          if (success) {
            success.call(scope, xmlhttp);
          }
        } else if (failure) {
          failure.call(scope, xmlhttp);
        }
      }
    };
    xmlhttp.open('GET', url, true);
    if (opt_requestHeaders) {
      for (var key in opt_requestHeaders) {
        if (opt_requestHeaders.hasOwnProperty(key)) {
          xmlhttp.setRequestHeader(key, opt_requestHeaders[key]);
        }
      }
    }
    xmlhttp.send();
    return xmlhttp;
  },
  doPOST(url, data, success, failure, scope, contentType, put, opt_requestHeaders) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open((put ? 'PUT' : 'POST'), url, true);
    xmlhttp.setRequestHeader('Content-Type', contentType ? contentType : 'text/xml');
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState === 4) {
        if (xmlhttp.status === 200 || xmlhttp.status === 201) {
          success.call(scope, xmlhttp);
        } else {
          failure.call(scope, xmlhttp);
        }
      }
    };
    if (opt_requestHeaders) {
      for (var key in opt_requestHeaders) {
        if (opt_requestHeaders.hasOwnProperty(key)) {
          xmlhttp.setRequestHeader(key, opt_requestHeaders[key]);
        }
      }
    }
    xmlhttp.send(data);
    return xmlhttp;
  },
  fetch(url, options) {
    let req_url = url;
    if (options.params) {
      const params = [];
      for (const key of Object.keys(options.params)) {
        params.push(key + '=' + encodeURIComponent(options.params[key]));
      }
      req_url += '?' + params.join('&');
    }
    return fetch(req_url, options);
  }
};
