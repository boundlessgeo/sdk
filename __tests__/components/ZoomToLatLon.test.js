/* global beforeEach, afterEach, describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import intl from '../mock-i18n';
import ZoomToLatLon from '../../src/components/ZoomToLatLon';
import TestUtils from 'react-addons-test-utils';

raf.polyfill();

describe('ZoomToLatLon', function() {

  var target, map;
  var width = 360;
  var height = 180;

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

  it('transforms DMS to DD', function(done) {
    var container = document.createElement('div');
    var comp = ReactDOM.render((
      <ZoomToLatLon map={map} intl={intl} />
    ), container);
    var dd = comp._dmsToDegrees(60, 10, 5, 'N');
    assert.equal(dd, 60.168055555555554);
    dd = comp._dmsToDegrees(60, 10, 5, 'S');
    assert.equal(dd, -60.168055555555554);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('renders the zoom component', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<ZoomToLatLon map={map} intl={intl}/>);
    const actual = renderer.getRenderOutput().props.children[0].props.className;
    const expected = 'sdk-component zoom-to-latlon';
    assert.equal(actual, expected);
  });

});
