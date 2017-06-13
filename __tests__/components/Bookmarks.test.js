/* global afterEach, beforeEach, describe, it */

import TestUtils from 'react-addons-test-utils';
import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import intl from '../mock-i18n';
import Bookmarks from '../../src/components/Bookmarks';
import BoundlessSdk from '../../src/components/BoundlessSdk';
import Map from '../../src/components/Map';
import configureStore from '../../src/stores/Store';

raf.polyfill();

describe('Bookmarks', function() {
  var target, map;
  var width = 360;
  var height = 180;
  var bookmarks = [{
    name: 'Le Grenier Pain',
    description: '<b>Address: </b>38 rue des Abbesses<br><b>Telephone:</b> 33 (0)1 46 06 41 81<br><a href="http://www.legrenierapain.com">Website</a>',
    extent: [259562.7661267497, 6254560.095662868, 260675.9610346824, 6256252.988234103],
    center: ol.extent.getCenter([259562.7661267497, 6254560.095662868, 260675.9610346824, 6256252.988234103]),
    zoom: 13
  }, {
    name: 'Poilne',
    description: '<b>Address: </b>8 rue du Cherche-Midi<br><b>Telephone:</b> 33 (0)1 45 48 42 59<br><a href="http://www.poilane.fr">Website</a>',
    extent: [258703.71361629796, 6248811.5276565505, 259816.90852423065, 6250503.271278702],
    center: ol.extent.getCenter([258703.71361629796, 6248811.5276565505, 259816.90852423065, 6250503.271278702]),
    zoom: 13
  }];

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


  it('zooms to the next bookmark', function(done) {
    var container = document.createElement('div');
    const store = configureStore();
    ReactDOM.render((
      <BoundlessSdk store={store}>
        <Map intl={intl} map={map}>
          <Bookmarks intl={intl} bookmarks={bookmarks} />
        </Map>
      </BoundlessSdk>
    ), container);
    var next = container.querySelector('div.navNext');
    assert.equal(map.getView().getZoom(), 1);
    assert.equal(map.getView().getCenter()[0], 0);
    assert.equal(map.getView().getCenter()[1], 0);
    TestUtils.SimulateNative.click(next);
    window.setTimeout(function() {
      assert.equal(Math.round(map.getView().getZoom()), 13);
      assert.equal(map.getView().getCenter()[0], 260119.36358071605);
      assert.equal(map.getView().getCenter()[1], 6255406.541948485);
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 1000);
  });

  it('zooms to the next bookmark using nav dots [1]', function(done) {
    var container = document.createElement('div');
    const store = configureStore();
    ReactDOM.render((
      <BoundlessSdk store={store}>
        <Map intl={intl} map={map}>
          <Bookmarks intl={intl} map={map} bookmarks={bookmarks} />
        </Map>
      </BoundlessSdk>
    ), container);
    var buttonOne = container.querySelector('button#dots_1');
    assert.equal(map.getView().getZoom(), 1);
    assert.equal(map.getView().getCenter()[0], 0);
    assert.equal(map.getView().getCenter()[1], 0);
    TestUtils.SimulateNative.click(buttonOne);
    window.setTimeout(function() {
      assert.equal(Math.round(map.getView().getZoom()), 13);
      assert.equal(map.getView().getCenter()[0], 260119.36358071605);
      assert.equal(map.getView().getCenter()[1], 6255406.541948485);
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 1000);
  });

  it('zooms to the next bookmark using nav dots [2]', function(done) {
    var container = document.createElement('div');
    const store = configureStore();
    ReactDOM.render((
      <BoundlessSdk store={store}>
        <Map intl={intl} map={map}>
          <Bookmarks intl={intl} map={map} bookmarks={bookmarks} />
        </Map>
      </BoundlessSdk>
    ), container);
    var buttonTwo = container.querySelector('button#dots_2');
    assert.equal(map.getView().getZoom(), 1);
    assert.equal(map.getView().getCenter()[0], 0);
    assert.equal(map.getView().getCenter()[1], 0);
    TestUtils.SimulateNative.click(buttonTwo);
    window.setTimeout(function() {
      assert.equal(Math.round(map.getView().getZoom()), 13);
      assert.equal(map.getView().getCenter()[0], 259260.31107026432);
      assert.equal(map.getView().getCenter()[1], 6249657.399467627);
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 1000);
  });

});
