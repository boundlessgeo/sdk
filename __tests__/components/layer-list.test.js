/* global it, describe, expect, beforeEach */

import React from 'react';
import { mount } from 'enzyme';

import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';

import MapReducer from '../../src/reducers/map';
import { isLayerVisible } from '../../src/util';

import SdkLayerList, { SdkLayerListItem } from '../../src/components/layer-list';


class TestLayerListItem extends SdkLayerListItem {
  render() {
    return (
      <div>
        <button className="btn-up" onClick={() => { this.moveLayerUp(); }}></button>
        <button className="btn-down" onClick={() => { this.moveLayerDown(); }}></button>
        <button className="btn-remove" onClick={() => { this.removeLayer(); }}></button>
      </div>
    );
  }
}

describe('test the LayerList component', () => {
  let store = null;

  // this is the same setup as used in legends but instead
  //  of listing legends this lists the layers in a list.
  beforeEach(() => {
    store = createStore(combineReducers({
      map: MapReducer,
    }), {
      map: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tileSize: 256,
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
          },
          wms: {
            type: 'raster',
            tiles: [
              '/wms?SERVICE=WMS&LAYERS=x,y,z&FORMAT=image/png&EXCEPTIONS=image/png&BBOX={bbox-epsg-3857}',
            ],
          },
          other: {
            type: 'geojson',
            data: { },
          },
        },
        layers: [
          {
            id: 'osm',
            source: 'osm',
          },
          {
            id: 'wms-test',
            source: 'wms',
          },
          {
            id: 'html-test',
            source: 'other',
          },
          {
            id: 'href-test',
            source: 'other',
          },
          {
            id: 'image-test',
            ref: 'href-test',
          },
          {
            id: 'null-test',
            source: 'other',
          },
          {
            id: 'bad-type-test',
            source: 'other',
            metadata: {
              'bnd:title': 'custom-layer-title',
            },
          },
        ],
      },
    });
  });

  it('should render the layer list without error', () => {
    mount(<Provider store={store}><SdkLayerList /></Provider>);
  });

  function getCustomLayerList() {
    return mount(<Provider store={store}><SdkLayerList layerClass={TestLayerListItem} /></Provider>);
  }

  it('should render with a custom layer list class', () => {
    getCustomLayerList();
  });

  it('should check that the custom title was rendered', () => {
    const wrapper = mount(<Provider store={store}><SdkLayerList /></Provider>);
    expect(wrapper.html().indexOf('custom-layer-title')).toBeGreaterThan(-1);
  });

  it('should remove a layer', () => {
    const n_layers = store.getState().map.layers.length;

    const wrapper = getCustomLayerList();
    wrapper.find('.btn-remove').first().simulate('click');

    expect(store.getState().map.layers.length).toBe(n_layers - 1);
  });

  it('should move a layer up', () => {
    const layers = store.getState().map.layers;

    const wrapper = getCustomLayerList();
    wrapper.find('.btn-up').last().simulate('click');

    let new_layers = store.getState().map.layers;
    expect(new_layers[0].id).toBe(layers[1].id);

    // try to move a layer up that's already at the top
    wrapper.find('.btn-up').first().simulate('click');

    const last_layer = layers.length - 1;
    new_layers = store.getState().map.layers;

    expect(new_layers[last_layer].id).toBe(layers[last_layer].id);
  });

  it('should move a layer down', () => {
    const layers = store.getState().map.layers;
    const n_layers = layers.length;

    const wrapper = getCustomLayerList();
    wrapper.find('.btn-down').first().simulate('click');

    let new_layers = store.getState().map.layers;
    expect(new_layers[n_layers - 1].id).toBe(layers[n_layers - 2].id);

    // try to move a layer down that's already at the bottom
    wrapper.find('.btn-down').last().simulate('click');
    new_layers = store.getState().map.layers;
    expect(new_layers[0].id).toBe(layers[0].id);
  });

  it('should toggle layer visibility', () => {
    const wrapper = mount(<Provider store={store}><SdkLayerList /></Provider>);

    expect(isLayerVisible(store.getState().map.layers[0])).toBe(true);

    const checkbox = wrapper.find('input').last();
    checkbox.simulate('change', { target: { checked: false }});

    expect(isLayerVisible(store.getState().map.layers[0])).toBe(false);
    checkbox.simulate('change', { target: { checked: true }});
    expect(isLayerVisible(store.getState().map.layers[0])).toBe(true);
  });
});
