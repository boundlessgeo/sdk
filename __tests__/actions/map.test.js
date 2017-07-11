/* global describe, it, expect, afterEach */

import configureMockStore from 'redux-mock-store';
import nock from 'nock';
import thunk from 'redux-thunk';

import * as actions from '../../src/actions/map';
import { MAP } from '../../src/action-types';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('actions', () => {
  it('should create an action to set the view', () => {
    const center = [5, 5];
    const zoom = 10;
    const expectedAction = {
      type: MAP.SET_VIEW,
      view: {
        center,
        zoom,
      },
    };
    expect(actions.setView(center, zoom)).toEqual(expectedAction);
  });

  it('should create an action to add a layer', () => {
    const layerDef = {
      id: 'osm',
      source: 'osm',
    };
    const expectedAction = {
      type: MAP.ADD_LAYER,
      layerDef,
    };
    expect(actions.addLayer(layerDef)).toEqual(expectedAction);
  });

  it('should create an action to add a source', () => {
    const sourceName = 'osm';
    const sourceDef = {
      type: 'raster',
      attribution: '&copy; <a href=\'https://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors.',
      tileSize: 256,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
    };
    const expectedAction = {
      type: MAP.ADD_SOURCE,
      sourceName,
      sourceDef,
    };
    expect(actions.addSource(sourceName, sourceDef)).toEqual(expectedAction);
  });

  it('should create an action to remove a layer', () => {
    const layerId = 'osm';
    const expectedAction = {
      type: MAP.REMOVE_LAYER,
      layerId,
    };
    expect(actions.removeLayer(layerId)).toEqual(expectedAction);
  });

  it('should create an action to remove a source', () => {
    const sourceName = 'osm';
    const expectedAction = {
      type: MAP.REMOVE_SOURCE,
      sourceName,
    };
    expect(actions.removeSource(sourceName)).toEqual(expectedAction);
  });

  it('should create an action to update a layer', () => {
    const layerId = 'osm';
    const layerDef = {
      id: 'osm',
      source: 'osm',
    };
    const expectedAction = {
      type: MAP.UPDATE_LAYER,
      layerId,
      layerDef,
    };
    expect(actions.updateLayer(layerId, layerDef)).toEqual(expectedAction);
  });

  it('should create an action to add features', () => {
    const sourceName = 'tegola';
    const features = [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [102.0, 0.5],
        },
        properties: {
          prop0: 'value0',
        },
      },
    ];
    const expectedAction = {
      type: MAP.ADD_FEATURES,
      sourceName,
      features,
    };
    expect(actions.addFeatures(sourceName, features)).toEqual(expectedAction);
  });

  it('should create an action to set layer visibility', () => {
    const layerId = 'osm';
    const visibility = false;
    const expectedAction = {
      type: MAP.SET_LAYER_VISIBILITY,
      layerId,
      visibility,
    };
    expect(actions.setLayerVisibility(layerId, visibility)).toEqual(expectedAction);
  });

  it('should create an action to remove features', () => {
    const sourceName = 'points';
    const filter = ['all', ['<', 'n', '3']];
    const expectedAction = {
      type: MAP.REMOVE_FEATURES,
      sourceName,
      filter,
    };

    expect(actions.removeFeatures(sourceName, filter)).toEqual(expectedAction);
  });

  it('should create an action to change the layer title', () => {
    const layer_id = 'background';
    const title = 'new_title';
    const expectedAction = {
      type: MAP.SET_LAYER_METADATA,
      layerId: layer_id,
      key: 'bnd:title',
      value: title,
    };

    expect(actions.setLayerTitle(layer_id, title)).toEqual(expectedAction);
  });

  it('should issue an action to change the layer order', () => {
    const layer_a = {
      id: 'a',
      source: 'osm',
    };

    const layer_b = {
      id: 'b',
      source: 'osm',
    };

    const expectedAction = {
      type: MAP.ORDER_LAYER,
      layerId: layer_a.id,
      targetId: layer_b.id,
    };

    expect(actions.orderLayer(layer_a.id, layer_b.id)).toEqual(expectedAction);
  });

  it('should issue an action to put the layer on top', () => {
    const layer_id = 'a';
    const expectedAction = {
      type: MAP.ORDER_LAYER,
      layerId: layer_id,
      targetId: undefined,
    };

    expect(actions.orderLayer(layer_id)).toEqual(expectedAction);
  });
});

describe('async actions', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('creates RECEIVE_CONTEXT when fetching context has been done', () => {
    const body = {
      version: 8,
      name: 'states-wms',
      center: [-98.78906130124426, 37.92686191312036],
      zoom: 4,
      sources: {
        osm: {
          type: 'raster',
          attribution: '&copy; <a href=\'https://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors.',
          tileSize: 256,
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': 'rgba(0,0,0,0)',
          },
        },
        {
          id: 'osm',
          source: 'osm',
        },
      ],
    };
    nock('http://example.com/')
      .get('/context')
      .reply(200, body);

    const expectedAction = { type: MAP.RECEIVE_CONTEXT, context: body };
    const store = mockStore({});

    return store.dispatch(actions.setContext({ url: 'http://example.com/context' })).then(() => {
      // return of async actions
      expect(store.getActions()).toEqual([expectedAction]);
    });
  });
});
