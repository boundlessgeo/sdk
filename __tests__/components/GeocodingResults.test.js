/* global afterEach, beforeEach, describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import intl from '../mock-i18n';
import GeocodingResults from '../../src/components/GeocodingResults';

raf.polyfill();

describe('GeocodingResults', function() {
  var target, map;
  var width = 360;
  var height = 180;
  var mockResponse = [
      {
        'display_name': 'St. Louis, City of St. Louis, Missouri, United States of America',
        'address': {
          'city': 'St. Louis',
          'county': 'City of St. Louis',
          'state': 'Missouri',
          'country': 'United States of America',
          'country_code': 'us'
        }
      },
      {
        'display_name': 'Saint-Louis, Saint-Louis Region, Senegal',
        'address': {
          'state': 'Saint-Louis',
          'country': 'Senegal',
          'country_code': 'sn'
        }
      }
  ]
  beforeEach(function(done) {
    target = document.createElement('div');
    var style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);
    map = new ol.Map({
      target: target,
      view: new ol.View({
        center: [0, 0],
        zoom: 1
      })
    });
    map.once('postrender', function() {
      done();
    });
  });

  afterEach(function() {
    map.setTarget(null);
    document.body.removeChild(target);
  });


  it('creates an internal vector layer', function() {
    var container = document.createElement('div');
    var result = ReactDOM.render((
      <GeocodingResults intl={intl} map={map}/>
    ), container);
    assert(result._layer instanceof ol.layer.Vector, true);
    ReactDOM.unmountComponentAtNode(container);
  });
  it('reads the results and builds display component', function() {
    var container = document.createElement('div');
    var result = ReactDOM.render((
      <GeocodingResults intl={intl} map={map}/>
    ), container);
    var display = result._formatDisplayName(mockResponse[0]);
    var mockJsx = (<span><strong>{'St. Louis'}</strong>{', City of St. Louis, Missouri, United States of America'}</span>)
    assert.deepEqual(display, mockJsx);
    ReactDOM.unmountComponentAtNode(container);
  });
});
