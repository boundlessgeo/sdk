/* global afterEach, beforeEach, describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import intl from '../mock-i18n';
import StyleModal from '../../src/components/StyleModal';
import TestUtils from 'react-addons-test-utils';

raf.polyfill();

describe('StyleModal', function() {
  var target, map, layers;
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
    layers = [
      new ol.layer.Vector({
        souce: new ol.source.Vector()
      })
    ];
    document.body.appendChild(target);
    map = new ol.Map({
      target: target,
      layers: layers,
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


  it('sets the geometry type based on the layer', function(done) {
    var container = document.createElement('div');
    var dialog = ReactDOM.render((
      <StyleModal intl={intl} layer={layers[0]}/>
    ), container);
    layers[0].set('wfsInfo', {
      attributes: ['foo', 'bar'],
      geometryType: 'MultiPolygon'
    });
    assert.equal(dialog.state.geometryType, 'Polygon');
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('renders the style dialog', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<StyleModal intl={intl} layer={layers[0]}/>);
    const actual = renderer.getRenderOutput().props.children[0].props.className;
    const expected = 'style-modal';
    assert.equal(actual, expected);
  });

});
