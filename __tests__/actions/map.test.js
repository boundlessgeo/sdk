/* global describe, it, expect, afterEach, spyOn */

import configureMockStore from 'redux-mock-store';
import nock from 'nock';
import thunk from 'redux-thunk';

import * as actions from '../../src/actions/map';
import {MAP} from '../../src/action-types';
import {TITLE_KEY, TIME_KEY} from '../../src/constants';

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

  it('should create an action to set the zoom', () => {
    const zoom = 5;
    const expectedAction = {
      type: MAP.SET_ZOOM,
      zoom,
    };
    expect(actions.setZoom(zoom)).toEqual(expectedAction);
  });

  it('should create an action to zoom in', () => {
    const expectedAction = {
      type: MAP.ZOOM_IN,
    };
    expect(actions.zoomIn()).toEqual(expectedAction);
  });

  it('should create an action to zoom out', () => {
    const expectedAction = {
      type: MAP.ZOOM_OUT,
    };
    expect(actions.zoomOut()).toEqual(expectedAction);
  });

  it('should create an action to set the map name', () => {
    const name = 'New Name';
    const expectedAction = {
      type: MAP.SET_NAME,
      name,
    };
    expect(actions.setMapName(name)).toEqual(expectedAction);
  });

  it('should create an action to set the map rotation', () => {
    const degrees = 45;
    const expectedAction = {
      type: MAP.SET_ROTATION,
      degrees,
    };
    expect(actions.setRotation(degrees)).toEqual(expectedAction);
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

  it('should create an action to add a source of a bad type and error', () => {
    const sourceName = 'osm';
    const sourceDef = {
      type: 'xraster',
      attribution: '&copy; <a href=\'https://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors.',
      tileSize: 256,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
    };

    const errorMsg = 'Invalid source type: xraster.  Valid source types are vector,raster,geojson,image,video,canvas';
    expect(() => {
      actions.addSource(sourceName, sourceDef);
    }).toThrow(new Error(errorMsg));
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
    const position = -1;
    const expectedAction = {
      type: MAP.ADD_FEATURES,
      sourceName,
      features,
      position
    };
    expect(actions.addFeatures(sourceName, features)).toEqual(expectedAction);
  });
  it('should create an action to add features at select position', () => {
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
    const position = 4;
    const expectedAction = {
      type: MAP.ADD_FEATURES,
      sourceName,
      features,
      position
    };
    expect(actions.addFeatures(sourceName, features, position)).toEqual(expectedAction);
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

  it('should create an action to set layer visible in a group', () => {
    const layerId = 'osm';
    const groupId = 'basemaps';
    const expectedAction = {
      type: MAP.SET_LAYER_IN_GROUP_VISIBLE,
      layerId,
      groupId,
    };
    expect(actions.setLayerInGroupVisible(layerId, groupId)).toEqual(expectedAction);
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
      key: TITLE_KEY,
      value: title,
    };

    expect(actions.setLayerTitle(layer_id, title)).toEqual(expectedAction);
  });

  it('should create an action to set the layer time', () => {
    const layer_id = 'wms';
    const time = '1995-01-01/2017-12-31/PT5M';
    const expectedAction = {
      type: MAP.SET_LAYER_METADATA,
      layerId: layer_id,
      key: TIME_KEY,
      value: time,
    };

    expect(actions.setLayerTime(layer_id, time)).toEqual(expectedAction);
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

  it('should issue an action to change the sprite', () => {
    const spriteRoot = 'localSprite';
    const expectedAction = {
      type: MAP.SET_SPRITE,
      sprite: spriteRoot,
      targetId: undefined,
    };

    expect(actions.setSprite(spriteRoot)).toEqual(expectedAction);
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

    const expectedAction = {type: MAP.RECEIVE_CONTEXT, context: body};
    const store = mockStore({});

    return store.dispatch(actions.setContext({url: 'http://example.com/context'})).then(() => {
      // return of async actions
      expect(store.getActions()).toEqual([expectedAction]);
    });
  });

  it('setContext action prints error on FetchError', () => {
    spyOn(console, 'error');
    nock('http://example.com/')
      .get('/context')
      .replyWithError('something awful happened');

    const store = mockStore({});

    return store.dispatch(actions.setContext({url: 'http://example.com/context'})).then(() => {
      // return of async actions
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('creates RECEIVE_CONTEXT when promise object is resolved', () => {
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

    const expectedAction = {type: MAP.RECEIVE_CONTEXT, context: body};
    const store = mockStore({});

    return store.dispatch(actions.setContext({json: body})).then(() => {
      // return of async actions
      expect(store.getActions()).toEqual([expectedAction]);
    });
  });

  it('setContext action rejects argument not containing a url or json', () => {
    const store = mockStore({});

    return expect(store.dispatch(actions.setContext('foo'))).rejects.toEqual('Invalid option for setContext. Specify either json or url.');
  });

  it('should create an action to cluster points', () => {
    const sourceName = 'foo';
    const isClustered = false;
    const expectedAction = {
      type: MAP.CLUSTER_POINTS,
      sourceName,
      cluster: isClustered,
    };
    expect(actions.clusterPoints(sourceName, isClustered)).toEqual(expectedAction);
  });

  it('should create an action to set the cluster radius', () => {
    const sourceName = 'foo';
    const radius = 5;
    const expectedAction = {
      type: MAP.SET_CLUSTER_RADIUS,
      sourceName,
      radius,
    };
    expect(actions.setClusterRadius(sourceName, radius)).toEqual(expectedAction);
  });

  it('should create an action to update the metadata', () => {
    const metadata = {foo: 'bar'};
    const expectedAction = {
      type: MAP.UPDATE_METADATA,
      metadata,
    };
    expect(actions.updateMetadata(metadata)).toEqual(expectedAction);
  });

  it('should create an action to update a source', () => {
    const expected = {
      type: MAP.UPDATE_SOURCE,
      sourceName: 'points',
      sourceDef: {data: {}},
    };
    expect(actions.updateSource('points', {data: {}})).toEqual(expected);
  });

  it('should create an action to set the map time', () => {
    let metadata = {};
    const time = '2015-06-23T03:10:00Z';
    metadata[TIME_KEY] = time;
    const expectedAction = {
      type: MAP.UPDATE_METADATA,
      metadata,
    };
    expect(actions.setMapTime(time)).toEqual(expectedAction);
  });

  it('should create an action to move a group', () => {
    expect(actions.moveGroup('xyz', 'x')).toEqual({
      type: MAP.MOVE_GROUP,
      placeAt: 'x',
      group: 'xyz',
    });
  });

  it('should generate a WMS source when no options specified', () => {
    const sourceName = 'my-source';
    const sourceDef = {
      type: 'vector',
      url: 'http://localhost/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=application%2Fx-protobuf%3Btype%3Dmapbox-vector&TRANSPARENT=TRUE&LAYERS=my-layer&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}',
    };
    expect(actions.addWmsSource(sourceName, 'http://localhost/geoserver/wms', 'my-layer')).toEqual({
      type: MAP.ADD_SOURCE,
      sourceName,
      sourceDef,
    });
  });

  it('should generate a WMS source with tileSize, accessToken and projection specified', () => {
    const sourceName = 'my-source';
    const sourceDef = {
      type: 'vector',
      url: 'http://localhost/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=application%2Fx-protobuf%3Btype%3Dmapbox-vector&TRANSPARENT=TRUE&LAYERS=my-layer&WIDTH=512&HEIGHT=512&CRS=EPSG%3A4326&ACCESS_TOKEN=my-token&BBOX={bbox-epsg-3857}',
    };
    const options = {accessToken: 'my-token', projection: 'EPSG:4326', tileSize: 512};
    expect(actions.addWmsSource(sourceName, 'http://localhost/geoserver/wms', 'my-layer', options)).toEqual({
      type: MAP.ADD_SOURCE,
      sourceName,
      sourceDef,
    });
  });

  it('should generate the correct WMS source when asVector false', () => {
    const sourceName = 'my-source';
    const sourceDef = {
      type: 'raster',
      tileSize: 256,
      tiles: ['http://localhost/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=TRUE&LAYERS=my-layer&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'],
    };
    expect(actions.addWmsSource(sourceName, 'http://localhost/geoserver/wms', 'my-layer', {asVector: false})).toEqual({
      type: MAP.ADD_SOURCE,
      sourceName,
      sourceDef,
    });
  });

  it('should generate the correct WMS source when asVector false and tileSize, accessToken and projection specified', () => {
    const sourceName = 'my-source';
    const sourceDef = {
      type: 'raster',
      tileSize: 512,
      tiles: ['http://localhost/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=TRUE&LAYERS=my-layer&WIDTH=512&HEIGHT=512&CRS=EPSG%3A4326&ACCESS_TOKEN=my-token&BBOX={bbox-epsg-3857}'],
    };
    const options = {asVector: false, accessToken: 'my-token', projection: 'EPSG:4326', tileSize: 512};
    expect(actions.addWmsSource(sourceName, 'http://localhost/geoserver/wms', 'my-layer', options)).toEqual({
      type: MAP.ADD_SOURCE,
      sourceName,
      sourceDef,
    });
  });

  it('should generate the correct WFS source', () => {
    const sourceName = 'my-source';
    const url = 'http://localhost/geoserver/wfs';
    const featureType = 'topp:states';
    const options = {accessToken: 'my-token'};
    const sourceDef = {
      type: 'geojson',
      data: 'http://localhost/geoserver/wfs?SERVICE=WFS&VERSION=1.1.0&SRSNAME=EPSG%3A4326&REQUEST=GetFeature&TYPENAME=topp%3Astates&OUTPUTFORMAT=JSON&ACCESS_TOKEN=my-token',
    };
    expect(actions.addWfsSource(sourceName, url, featureType, options)).toEqual({
      type: MAP.ADD_SOURCE,
      sourceName,
      sourceDef,
    });
  });

  it('should generate the correct TMS source', () => {
    const sourceName = 'my-source';
    const url = 'http://localhost/geoserver';
    const layerName = 'topp:states';
    const options = {accessToken: 'my-token'};
    const sourceDef = {
      type: 'vector',
      url: 'http://localhost/geoserver/gwc/service/tms/1.0.0/topp:states@EPSG%3A3857@pbf/{z}/{x}/{-y}.pbf?access_token=my-token',
    };
    expect(actions.addTmsSource(sourceName, url, layerName, options)).toEqual({
      type: MAP.ADD_SOURCE,
      sourceName,
      sourceDef,
    });
  });
});
