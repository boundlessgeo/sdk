/* global afterEach, beforeEach, describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import intl from '../mock-i18n';
import ToolActions from '../../src/actions/ToolActions';
import QGISPrint from '../../src/components/QGISPrint';
import TestUtils from 'react-addons-test-utils';

raf.polyfill();

describe('QGISPrint', function() {
  var target, map, layer;
  var width = 360;
  var height = 180;

  var printLayouts = [{
    name: 'Layout 1',
    thumbnail: 'layout1_thumbnail.png',
    width: 420.0,
    elements: [{
      name: 'Title',
      height: 40.825440467359044,
      width: 51.98353115727002,
      y: 39.25222551928783,
      x: 221.77507418397624,
      font: 'Helvetica',
      type: 'label',
      id: '24160ce7-34a3-4f25-a077-8910e4889681',
      size: 18
    }, {
      height: 167.0,
      width: 171.0,
      grid: {
        intervalX: 0.0,
        intervalY: 0.0,
        annotationEnabled: false,
        crs: ''
      },
      y: 19.0,
      x: 16.0,
      type: 'map',
      id: '3d532cb9-0eca-4e50-9f0a-ce29b1c7f5a6'
    }],
    height: 297.0
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
    layer = new ol.layer.Tile({
      id: 'foo',
      source: new ol.source.OSM()
    });
    map = new ol.Map({
      target: target,
      layers: [layer],
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

  it('layoutName not set before user makes a selection', function() {
    var container = document.createElement('div');
    var print = ReactDOM.render((
      <QGISPrint intl={intl} layouts={printLayouts} map={map}/>
    ), container);
    assert.equal(print.state.layoutName, null);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('loading state gets set on print', function(done) {
    var container = document.createElement('div');
    var print = ReactDOM.render((
      <QGISPrint intl={intl} layouts={printLayouts} map={map}/>
    ), container);
    print._onClick(printLayouts[0]);
    print._print();
    assert.equal(print.state.loading, true);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done()
    }, 500);
  });

  it('getTileLayers returns correct number of layers', function() {
    var container = document.createElement('div');
    var print = ReactDOM.render((
      <QGISPrint intl={intl} layouts={printLayouts} map={map}/>
    ), container);
    assert.equal(print._getTileLayers().length, 1);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('disables the tool', function() {
    var container = document.createElement('div');
    var print = ReactDOM.render((
      <QGISPrint intl={intl} layouts={printLayouts} map={map}/>
    ), container);
    assert.equal(print.state.disabled, false);
    ToolActions.disableAllTools();
    assert.equal(print.state.disabled, true);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('adds elements loaded', function() {
    var container = document.createElement('div');
    var print = ReactDOM.render((
      <QGISPrint intl={intl} layouts={printLayouts} map={map} thumbnailPath={""}/>
    ), container);
    print._onClick(printLayouts[0]);
    print._print();
    assert.equal(print.state.layout.elements.length, 2);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('opens on click', function() {
    var container = document.createElement('div');
    var print = ReactDOM.render((
      <QGISPrint intl={intl} layouts={printLayouts} map={map} thumbnailPath={""}/>
    ), container);
    assert.equal(print.state.open, false);
    print._onClick(printLayouts[0]);
    assert.equal(print.state.open, true);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('renders the component', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<QGISPrint intl={intl} layouts={printLayouts} map={map} thumbnailPath={""}/>);
    const actual = renderer.getRenderOutput().props.className;
    const expected = 'sdk-component qgis-print';
    assert.equal(actual, expected);
  });

});
