/* global it, describe, expect, spyOn */

import React from 'react';
import { shallow, mount } from 'enzyme';

import olMap from 'ol/map';
import TileLayer from 'ol/layer/tile';
import VectorLayer from 'ol/layer/vector';
import ImageLayer from 'ol/layer/image';
import VectorTileLayer from 'ol/layer/vectortile';
import ImageStaticSource from 'ol/source/imagestatic';
import TileJSONSource from 'ol/source/tilejson';

import { createStore, combineReducers } from 'redux';

import ConnectedMap, { Map } from '../../src/components/map';
import SdkPopup from '../../src/components/map/popup';
import MapReducer from '../../src/reducers/map';
import PrintReducer from '../../src/reducers/print';
import * as MapActions from '../../src/actions/map';
import * as PrintActions from '../../src/actions/print';

describe('Map component', () => {
  it('should render without throwing an error', () => {
    expect(shallow(<Map />).contains(<div className="map" />)).toBe(true);
  });

  it('should create a map', () => {
    const sources = {
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
      'states-wms': {
        type: 'raster',
        tileSize: 256,
        tiles: ['https://ahocevar.com/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
      },
      points: {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0],
          },
          properties: {
            title: 'Null Island',
          },
        },
      },
      mvt: {
        type: 'vector',
        url: 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=test_key',
      },
    };
    const layers = [
      {
        id: 'osm',
        source: 'osm',
      }, {
        id: 'states',
        source: 'states-wms',
      }, {
        id: 'sample-points',
        source: 'points',
        type: 'circle',
        paint: {
          'circle-radius': 5,
          'circle-color': '#feb24c',
          'circle-stroke-color': '#f03b20',
        },
      }, {
        id: 'mvt-layer',
        source: 'mvt',
      }, {
        id: 'purple-points',
        ref: 'sample-points',
        paint: {
          'circle-radius': 5,
          'circle-color': '#cc00cc',
        },
        filter: ['==', 'isPurple', true],
      },
    ];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const wrapper = shallow(<Map map={{ center, zoom, sources, layers, metadata }} />);
    wrapper.instance().componentDidMount();
    const map = wrapper.instance().map;
    expect(map).toBeDefined();
    expect(map).toBeInstanceOf(olMap);
    expect(map.getLayers().item(0)).toBeInstanceOf(TileLayer);
    expect(map.getLayers().item(2)).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().item(3)).toBeInstanceOf(VectorTileLayer);

    // move the map.
    wrapper.setProps({
      zoom: 4,
    });
  });

  it('should create a static image', () => {
    const sources = {
      overlay: {
        type: 'image',
        url: 'https://www.mapbox.com/mapbox-gl-js/assets/radar.gif',
        coordinates: [
          [-80.425, 46.437],
          [-71.516, 46.437],
          [-71.516, 37.936],
          [-80.425, 37.936],
        ],
      },
    };
    const layers = [
      {
        id: 'overlay',
        source: 'overlay',
        type: 'raster',
        paint: { 'raster-opacity': 0.85 },
      },
    ];
    const center = [0, 0];
    const zoom = 2;
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = shallow(<Map map={{ center, zoom, sources, layers, metadata }} />);
    wrapper.instance().componentDidMount();
    const map = wrapper.instance().map;
    const layer = map.getLayers().item(0);
    expect(layer).toBeInstanceOf(ImageLayer);
    expect(layer.getOpacity()).toEqual(layers[0].paint['raster-opacity']);
    const source = layer.getSource();
    expect(source).toBeInstanceOf(ImageStaticSource);
  });

  it('should create a raster tilejson', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];

    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const wrapper = shallow(<Map map={{ center, zoom, sources, layers, metadata }} />);
    wrapper.instance().componentDidMount();
    const map = wrapper.instance().map;
    const layer = map.getLayers().item(0);
    expect(layer).toBeInstanceOf(TileLayer);
    const source = layer.getSource();
    expect(source).toBeInstanceOf(TileJSONSource);
  });

  it('should handle visibility changes', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];

    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const wrapper = shallow(<Map map={{ center, zoom, sources, layers, metadata }} />);

    const instance = wrapper.instance();
    instance.componentDidMount();
    const map = instance.map;
    const layer = map.getLayers().item(0);
    expect(layer.getVisible()).toBe(true);
    const nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 0,
          'bnd:layer-version': 1,
        },
        sources,
        layers: [{
          id: 'tilejson-layer',
          source: 'tilejson',
          layout: {
            visibility: 'none',
          },
        }],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(layer.getVisible()).toBe(false);
  });

  it('handles updates to source and layer min/maxzoom values', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
      minzoom: 2,
      maxzoom: 5,
    }];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const wrapper = shallow(<Map map={{ center, zoom, sources, layers, metadata }} />);

    const instance = wrapper.instance();
    instance.componentDidMount();
    const map = instance.map;
    const layer = map.getLayers().item(0);
    const view = map.getView();
    let max_rez = view.constrainResolution(
      view.getMaxResolution(), layers[0].minzoom - view.getMinZoom());
    expect(layer.getMaxResolution()).toEqual(max_rez);
    let min_rez = view.constrainResolution(
      view.getMinResolution(), layers[0].maxzoom - view.getMaxZoom());
    expect(layer.getMinResolution()).toEqual(min_rez);
    // min/max zoom values change on layer def
    let nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 0,
          'bnd:layer-version': 1,
        },
        sources,
        layers: [{
          id: 'tilejson-layer',
          source: 'tilejson',
          minzoom: 3,
          maxzoom: 4,
        }],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    max_rez = view.constrainResolution(
      view.getMaxResolution(), nextProps.map.layers[0].minzoom - view.getMinZoom());
    expect(layer.getMaxResolution()).toEqual(max_rez);
    min_rez = view.constrainResolution(
      view.getMinResolution(), nextProps.map.layers[0].maxzoom - view.getMaxZoom());
    expect(layer.getMinResolution()).toEqual(min_rez);
    // min/max zoom values defined on source only
    nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 1,
          'bnd:layer-version': 2,
        },
        sources: {
          tilejson: {
            type: 'raster',
            url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
            minzoom: 4,
            maxzoom: 8,
          },
        },
        layers: [{
          id: 'tilejson-layer',
          source: 'tilejson',
        }],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    max_rez = view.constrainResolution(
      view.getMaxResolution(), nextProps.map.sources.tilejson.minzoom - view.getMinZoom());
    expect(layer.getMaxResolution()).toEqual(max_rez);
    min_rez = view.constrainResolution(
      view.getMinResolution(), nextProps.map.sources.tilejson.maxzoom - view.getMaxZoom());
    expect(layer.getMinResolution()).toEqual(min_rez);
    // min.max zoom values defined on both source and layer def
    nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 2,
          'bnd:layer-version': 3,
        },
        sources: {
          tilejson: {
            type: 'raster',
            url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
            minzoom: 1,
            maxzoom: 7,
          },
        },
        layers: [{
          id: 'tilejson-layer',
          source: 'tilejson',
          minzoom: 2,
          maxzoom: 9,
        }],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    max_rez = view.constrainResolution(
      view.getMaxResolution(), nextProps.map.layers[0].minzoom - view.getMinZoom());
    expect(layer.getMaxResolution()).toEqual(max_rez);
    min_rez = view.constrainResolution(
      view.getMinResolution(), nextProps.map.sources.tilejson.maxzoom - view.getMaxZoom());
    expect(layer.getMinResolution()).toEqual(min_rez);
  });

  it('should handle layer removal and re-adding', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];
    const center = [0, 0];
    const zoom = 2;
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = shallow(<Map map={{ center, zoom, sources, layers, metadata }} />);
    const instance = wrapper.instance();
    instance.componentDidMount();
    const map = instance.map;
    expect(map.getLayers().item(0)).not.toBe(undefined);
    let nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 0,
          'bnd:layer-version': 1,
        },
        sources,
        layers: [],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(map.getLayers().getLength()).toBe(0);
    nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 0,
          'bnd:layer-version': 2,
        },
        sources,
        layers,
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(map.getLayers().getLength()).toBe(1);
  });

  it('removes sources version definition when excluded from map spec', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];
    const center = [0, 0];
    const zoom = 2;
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = shallow(<Map map={{ sources, layers, center, zoom, metadata }} />);
    const instance = wrapper.instance();
    instance.componentDidMount();
    expect(instance.sourcesVersion).toEqual(0);
    const nextProps = {
      map: {
        center,
        zoom,
        sources,
        layers: [],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(instance.sourcesVersion).toEqual(undefined);
  });

  it('should create a connected map', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));
    mount(<ConnectedMap store={store} />);
  });

  it('should trigger the setView callback', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<ConnectedMap store={store} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    store.dispatch(MapActions.setView([-45, -45], 11));

    sdk_map.map.getView().setCenter([0, 0]);
    sdk_map.map.dispatchEvent({
      type: 'moveend',
    });

    expect(store.getState().map.center).toEqual([0, 0]);
  });

  it('should trigger renderSync on export image', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
      print: PrintReducer,
    }));
    const props = {
      store,
    };

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();
    spyOn(sdk_map.map, 'renderSync');
    store.dispatch(PrintActions.exportMapImage());

    // renderSync should get called.
    expect(sdk_map.map.renderSync).toHaveBeenCalled();
  });

  it('should trigger the popup-related callbacks', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));
    const onClick = (map, xy, featuresPromise) => {
      // check that something looking like a promise
      // was returned.
      expect(typeof featuresPromise.then).toBe('function');
    };

    // create a props dictionary which
    //  can include a spy.
    const props = {
      store,
      onClick,
      includeFeaturesOnClick: true,
    };
    spyOn(props, 'onClick');

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();
    sdk_map.map.dispatchEvent({
      type: 'postcompose',
    });

    sdk_map.map.dispatchEvent({
      type: 'singleclick',
      coordinate: [0, 0],
      // this fakes the clicking of the canvas.
      originalEvent: {
        // eslint-disable-next-line no-underscore-dangle
        target: sdk_map.map.getRenderer().canvas_,
      },
    });

    // onclick should get called when the map is clicked.
    expect(props.onClick).toHaveBeenCalled();
  });

  it('should create an overlay for the initialPopups', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const props = {
      store,
      initialPopups: [(<SdkPopup coordinate={[0, 0]}><div>foo</div></SdkPopup>)],
    };


    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    expect(sdk_map.map.getOverlays().getLength()).toEqual(0);

    sdk_map.map.dispatchEvent({
      type: 'postcompose',
    });

    expect(sdk_map.map.getOverlays().getLength()).toEqual(1);
  });

  it('should change the sprites and redraw the layer', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<ConnectedMap store={store} />);
    const map = wrapper.instance().getWrappedInstance();

    spyOn(map, 'configureSprites');
    store.dispatch(MapActions.setSprites('./sprites'));

    expect(map.configureSprites).toHaveBeenCalled();
  });
});
