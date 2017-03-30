/* global beforeEach, afterEach, describe, it */

import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import LayerStore from '../../src/stores/LayerStore';
import LayerActions from '../../src/actions/LayerActions';
import WFSService from '../../src/services/WFSService';

raf.polyfill();

describe('LayerStore', function() {

  var target, map, level1, level2, level3, level3a, count, onChangeCb;
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

    level3 = new ol.layer.Layer({id: 'level3'});
    level3a = new ol.layer.Layer({id: 'level3a'});
    level2 = new ol.layer.Group({
      id: 'level2',
      layers: [
        level3,
        level3a
      ]
    });
    level1 = new ol.layer.Group({
      id: 'level1',
      layers: [
        level2
      ]
    });
    map = new ol.Map({
      target: target,
      layers: [
        level1
      ],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    LayerStore.bindMap(map);
  });

  afterEach(function() {
    map.setTarget(null);
    document.body.removeChild(target);
  });

  it('LayerStore behaves as expected', function() {
    // finds a layer in a group
    var layer = LayerStore.findLayer('level3');
    assert.equal(layer !== undefined, true);
    layer = LayerStore.findLayer('level2');
    assert.equal(layer !== undefined, true);
    layer = LayerStore.findLayer('level4');
    assert.equal(layer !== undefined, false);
    // fires change when layer gets added / removed on the map
    count = 0;
    onChangeCb = function() {
      count++;
    };
    LayerStore.addChangeListener(onChangeCb);
    assert.equal(LayerStore.getState().flatLayers.length, 2);
    map.addLayer(new ol.layer.Vector());
    assert.equal(LayerStore.getState().flatLayers.length, 3);
    assert.equal(count, 1);
    map.getLayers().pop();
    assert.equal(count, 2);
    assert.equal(LayerStore.getState().flatLayers.length, 2);
    // listens to the app dispatcher
    var vector = new ol.layer.Vector({id: '1'});
    map.addLayer(vector);
    assert.equal(LayerStore.findLayer('1'), vector);
    LayerActions.removeLayer(vector);
    assert.equal(LayerStore.findLayer('1'), undefined);
    // handles layer order changes
    count = 0;
    var idx = level2.getLayers().getArray().indexOf(level3a);
    assert.equal(idx, 1);
    LayerActions.moveLayer(1, 0, level3a, level2);
    assert.equal(count, 2);
    idx = level2.getLayers().getArray().indexOf(level3a);
    assert.equal(idx, 0);
    // removes layers from a group
    // test remove layer from subgroup
    var length = level2.getLayers().getLength();
    assert.equal(length, 2);
    LayerActions.removeLayer(level3a, level2);
    length = level2.getLayers().getLength();
    assert.equal(length, 1);
    // test remove subgroup
    length = level1.getLayers().getLength();
    assert.equal(length, 1);
    LayerActions.removeLayer(level2, level1);
    length = level1.getLayers().getLength();
    assert.equal(length, 0);
    // test remove group
    length = map.getLayers().getLength();
    assert.equal(length, 1);
    LayerActions.removeLayer(level1);
    length = map.getLayers().getLength();
    assert.equal(length, 0);
    // _getWfsInfo does not fail on a WFS layer
    var wfsLayer = WFSService.createLayer({Name: 'foo'}, 'http://localhost/geoserver/wfs', {title: 'Foo layer'}, ol.proj.get('EPSG:4326'));
    var error = false;
    try {
      LayerStore._getWfsInfo(wfsLayer);
    } catch (e) {
      error = true;
    }
    assert.equal(error, false);
    error = false;
    var imageWMS = new ol.layer.Image({
      id: 'imagewms',
      source: new ol.source.ImageWMS({
        url: 'http://localhost/geoserver/wms',
        params: {
          LAYERS: 'foo'
        }
      })
    });
    try {
      LayerStore._getWfsInfo(imageWMS);
    } catch (e) {
      error = true;
    }
    assert.equal(error, false);
    // QGIS WAB no featureNS handled
    var wab = new ol.layer.Vector({
      title: 'topp:states',
      id: 'topp_states20170316114032352',
      wfsInfo: {
        featureNS: '',
        featureType: 'states',
        featurePrefix: 'topp',
        geometryType: 'MultiPolygon',
        geometryName: 'the_geom',
        url: 'http://localhost:8080/geoserver/wfs'
      },
      isWFST: true
    });
    map.addLayer(wab);
    assert.equal(wab.get('name'), 'topp:states');
    assert.equal(wab.get('url'), 'http://localhost:8080/geoserver/wfs');
  });

});
