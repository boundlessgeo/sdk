/* global beforeEach, afterEach, describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import ol from 'openlayers';
import intl from '../mock-i18n';
import AddLayerModal from '../../src/components/AddLayerModal';
import TestUtils from 'react-addons-test-utils';

import '../polyfills';

describe('AddLayerModal', function() {

  var target, map;
  var width = 360;
  var height = 180;
  var wmsUrl = 'http://localhost:8080/geoserver/wms';
  var wfsUrl = 'http://localhost:8080/geoserver/wfs';
  var sources = [{url: wmsUrl, type: 'WMS', title: 'My WMS'}];

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

  it('changes attributes state', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} onRequestClose={function() {}} />
    ), container);
    var actual = modal.state.attributes;
    var expected = '';
    assert.equal(actual, expected);
    modal._onChangeAttributes(null, 'cat, TYPE');
    actual = modal.state.attributes;
    expected = 'cat, TYPE';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('changes geometry type state', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} onRequestClose={function() {}} />
    ), container);
    var actual = modal.state.geometryType;
    var expected = undefined;
    assert.equal(actual, expected);
    modal._changeGeometryType(null, null, 'Point');
    actual = modal.state.geometryType;
    expected = 'Point';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('sets fill and stroke state', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} onRequestClose={function() {}} />
    ), container);
    var actual = modal.state.hasOwnProperty('hasFill');
    var expected = false;
    assert.equal(actual, expected);
    actual = modal.state.hasOwnProperty('hasStroke');
    assert.equal(actual, expected);
    modal._onChangeFill({hasFill: true});
    modal._onChangeStroke({hasStroke: true});
    actual = modal.state.hasOwnProperty('hasFill');
    expected = true;
    assert.equal(actual, expected);
    actual = modal.state.hasOwnProperty('hasStroke');
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('sets state to loading on upload', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} onRequestClose={function() {}} />
    ), container);
    var actual = modal.state.loading;
    var expected = false;
    assert.equal(actual, expected);
    modal.setState({showUpload: true});
    modal.addLayers();
    actual = modal.state.loading;
    expected = true;
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('reads file', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} onRequestClose={function() {}} />
    ), container);
    var actual = modal._text;
    var expected = undefined;
    assert.equal(actual, expected);
    modal._readFile('foo');
    actual = modal._text;
    expected = 'foo';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('creates layer [0]', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} onRequestClose={function() {}} />
    ), container);
    var actual = modal.props.map.getLayers().getLength();
    var expected = 0;
    assert.equal(actual, expected);
    modal.setState({createTitle: 'My Layer'});
    modal.addLayers();
    assert.equal(actual, expected);
    modal.setState({showCreate: true});
    modal.addLayers();
    actual = modal.props.map.getLayers().getLength();
    expected = 1;
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('creates layer [1]', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} onRequestClose={function() {}}/>
    ), container);
    modal._createLayer();
    var actual = modal.props.map.getLayers().getLength();
    var expected = 0;
    assert.equal(actual, expected);
    modal.setState({createTitle: 'My Layer'});
    modal._createLayer();
    actual = modal.props.map.getLayers().getLength();
    expected = 1;
    assert.equal(actual, expected);
    actual = modal.props.map.getLayers().getArray()[0].getStyle().getFill();
    expected = null;
    assert.equal(actual, expected);
    actual = modal.props.map.getLayers().getArray()[0].getStyle().getStroke();
    expected = null;
    assert.equal(actual, expected);
    modal.setState({fillColor: {}, strokeColor: {}});
    modal._createLayer();
    actual = modal.props.map.getLayers().getArray()[1].getStyle().getFill();
    expected = null;
    assert.notEqual(actual, expected);
    actual = modal.props.map.getLayers().getArray()[1].getStyle().getStroke();
    expected = null;
    assert.notEqual(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('adds a menu item with valid layer name and title', function(done) {
    var container = document.createElement('div');
    var layer = {Title: ''};
    var menuItems = [];
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} />
    ), container);
    modal._getLayersMarkup(layer, menuItems);
    var actual = menuItems.length;
    var expected = 0;
    assert.equal(actual, expected);
    layer.Name = 'My Layer';
    modal._getLayersMarkup(layer, menuItems);
    actual = menuItems.length;
    expected = 1;
    assert.equal(actual, expected);
    actual = menuItems[0].props.primaryText.props.className;
    expected = 'layer-title-empty';
    assert.equal(actual, expected);
    layer.Title = 'My Title';
    modal._getLayersMarkup(layer, menuItems);
    actual = menuItems[1].props.primaryText;
    expected = 'My Title';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('adds a menu items for layer children', function(done) {
    var container = document.createElement('div');
    var layer = {Layer: [{Title: 'My Title', Name: 'My Name'}]};
    var menuItems = [];
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} />
    ), container);
    modal._getLayersMarkup(layer, menuItems);
    var actual = menuItems.length;
    var expected = 1;
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('clears layerInfo on error', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    modal._setError('Error');
    assert.equal(modal.state.layerInfo, null);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('opens error message on error', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    modal._setError('Error');
    assert.equal(modal.state.errorOpen, true);
    assert.equal(modal.state.msg, 'Error');
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('generates correct layer title info', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var title = modal._getLayerTitle({Title: ''});
    assert.equal(title.empty, true);
    title = modal._getLayerTitle({Title: 'My Layer'});
    assert.equal(title.empty, false);
    assert.equal(title.title, 'My Layer');
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('creates a title', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var actual = modal.state.createTitle;
    var expected = '';
    assert.equal(actual, expected);
    modal._onChangeCreateTitle(null, 'foo');
    actual = modal.state.createTitle;
    expected = 'foo';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('returns the correct url if no url input field', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={false} sources={sources} intl={intl} />
    ), container);
    modal.setState({source: 0}, function() {
      var result = modal.state.sources[modal.state.source].url;
      assert.equal(result, wmsUrl);
      window.setTimeout(function() {
        ReactDOM.unmountComponentAtNode(container);
        done();
      }, 500);
    });
  });

  it('returns a new generate ID', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var id = modal._generateId();
    assert.equal(id, 'sdk-addlayer-1');
    id = modal._generateId();
    assert.equal(id, 'sdk-addlayer-2');
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('change of source to Create', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    //TestCreate
    modal._onSourceChange(null, 1, 'CREATE');
    var result = modal.state;
    var expectedState = {layerInfo: null, showNew: false, showUpload: false, showCreate: true, layer: null, source: 'CREATE'};
    assert.include(result, expectedState);
    //TestUpload
    modal._onSourceChange(null, 1, 'UPLOAD');
    result = modal.state;
    expectedState = {layerInfo: null, showNew: false, showUpload: true, showCreate: false, layer: null, source: 'UPLOAD'};
    assert.include(result, expectedState);
    //TestNew
    modal._onSourceChange(null, 1, 'NEW');
    result = modal.state;
    expectedState = {layerInfo: null, showUpload: false, showNew: true, showCreate: false, layer: null, source: 'NEW'};
    assert.include(result, expectedState);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('renders the add layer component', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<AddLayerModal map={map} intl={intl} sources={sources}/>);
    const actual = renderer.getRenderOutput().props.className;
    const expected = 'add-layer-modal';
    assert.equal(actual, expected);
  });

  it('is intially closed', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<AddLayerModal map={map} intl={intl} sources={sources}/>);
    const actual = renderer.getRenderOutput().props.open;
    const expected = false;
    assert.equal(actual, expected);
  });

  it('closes error on request close', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var actual = modal.state.errorOpen;
    var expected = false;
    assert.equal(actual, expected);
    modal.setState({errorOpen: true});
    actual = modal.state.errorOpen;
    expected = true;
    assert.equal(actual, expected);
    modal._handleRequestClose();
    actual = modal.state.errorOpen;
    expected = false;
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('changes new source type', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var actual = modal.state.newType;
    var expected = 'WMS';
    assert.equal(actual, expected);
    modal._onNewTypeChange(null, null, 'foo');
    actual = modal.state.newType;
    expected = 'foo';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('changes source url', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var actual = modal.state.newUrl;
    var expected = '';
    assert.equal(actual, expected);
    modal._onNewUrlChange(null, 'foo');
    actual = modal.state.newUrl;
    expected = 'foo';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('changes source name', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var actual = modal.state.newName;
    var expected = '';
    assert.equal(actual, expected);
    modal._onNewNameChange(null, 'foo');
    actual = modal.state.newName;
    expected = 'foo';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('adds sources and updates layer source', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var actual = modal.state.source;
    var expected = null;
    assert.equal(actual, expected);
    actual = modal.state.sources.length;
    expected = 1;
    assert.equal(actual, expected);
    modal.setState({newUrl: wfsUrl, newType: 'WFS', newName: 'My WFS'});
    modal._onNewUrlBlur();
    actual = modal.state.sources.length;
    expected = 2;
    assert.equal(actual, expected);
    actual = modal.state.source;
    expected = 1;
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('changes layer on select', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} allowUserInput={true} sources={sources} intl={intl} />
    ), container);
    var actual = modal.state.layer;
    var expected = null;
    assert.equal(actual, expected);
    modal._onChangeSelectLayer(null, null, 'foo');
    actual = modal.state.layer;
    expected = 'foo';
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('get caps sets loading state to true', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} />
    ), container);
    modal.setState({source: 0});
    modal._getCaps();
    var actual = modal.state.loading;
    var expected = true;
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('contains two children', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} />
    ), container);
    var actual = modal.refs.dialog.props.children.length;
    var expected = 2;
    assert.equal(actual, expected);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('initial content is undefined', function(done) {
    var container = document.createElement('div');
    var modal = ReactDOM.render((
      <AddLayerModal map={map} sources={sources} intl={intl} />
    ), container);
    var initialContent = modal.refs.dialog.props.children[1].props.children;
    var actual = initialContent.length;
    var expected = 6;
    assert.equal(actual, expected);
    initialContent.forEach(function(child) {
      assert.equal(child, undefined);
    });
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

});
