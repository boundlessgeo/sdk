/* global afterEach, beforeEach, describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import intl from '../mock-i18n';
import ToolActions from '../../src/actions/ToolActions';
import Select from '../../src/components/Select';
import TestUtils from 'react-addons-test-utils';

raf.polyfill();

describe('SelectTool', function() {
  var target, map;
  var width = 360;
  var height = 180;

  beforeEach(function() {
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
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
  });

  afterEach(function() {
    map.setTarget(null);
    document.body.removeChild(target);
  });


  it('adds a drag box interaction to the map', function() {
    var container = document.createElement('div');
    ReactDOM.render((
      <Select intl={intl} map={map} />
    ), container);

    var count = 0;
    map.getInteractions().forEach(function(interaction) {
      if (interaction instanceof ol.interaction.DragBox) {
        ++count;
      }
    });
    assert.equal(count, 1);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('selects the individual features of a cluster', function() {
    var container = document.createElement('div');
    var select = ReactDOM.render((
      <Select intl={intl} map={map} />
    ), container);

    var selected = [];
    var cluster = new ol.Feature({
      features: [
        new ol.Feature(),
        new ol.Feature(),
        new ol.Feature()
      ]
    });
    selected = select._handleSelection(cluster, selected);
    assert.equal(selected.length, 3);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('disables the tool', function() {
    var container = document.createElement('div');
    var select = ReactDOM.render((
      <Select intl={intl} map={map} />
    ), container);
    assert.equal(select.state.disabled, false);
    ToolActions.disableAllTools();
    assert.equal(select.state.disabled, true);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('renders the select tool', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<Select intl={intl} map={map}/>);
    const actual = renderer.getRenderOutput().props.className;
    const expected = 'sdk-component select';
    assert.equal(actual, expected);
  });

});
