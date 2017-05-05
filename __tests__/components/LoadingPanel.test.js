/* global afterEach, beforeEach, describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import LoadingPanel from '../../src/components/LoadingPanel';
import TestUtils from 'react-addons-test-utils';

raf.polyfill();

describe('LoadingPanel', function() {
  var target, map, layer;
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
    layer = new ol.layer.Tile({
      name: 'foo',
      source: new ol.source.TileWMS({
        url: '/geoserver/wms',
        params: {
          LAYERS: 'foo'
        }
      })
    });
    map = new ol.Map({
      layers: [layer],
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


  it('shows when tileloadstart is fired', function() {
    var container = document.createElement('div');
    var lp = ReactDOM.render((
      <LoadingPanel map={map}/>
    ), container);
    layer.getSource().dispatchEvent('tileloadstart');
    assert.equal(lp.state.show, true);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('renders the loading panel', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<LoadingPanel map={map}/>);
    const actual = renderer.getRenderOutput().props.className;
    const expected = 'sdk-component loading-panel';
    assert.include(actual, expected);
  });

});
