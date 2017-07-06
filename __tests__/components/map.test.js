import React from 'react';
import { shallow, mount, render } from 'enzyme';


import { Map } from '../../src/components/map';
import olMap from 'ol/map';
import TileLayer from 'ol/layer/tile';
import ImageLayer from 'ol/layer/image';
import ImageStaticSource from 'ol/source/imagestatic';
import TileJSONSource from 'ol/source/tilejson';

import { createStore, combineReducers } from 'redux'
import ConnectedMap from '../../src/components/map';
import MapReducer from '../../src/reducers/map';

describe('Map component', () => {

  it('should render without throwing an error', function() {
    expect(shallow(<Map />).contains(<div className="map"></div>)).toBe(true);
  });

  it('should create a map', function() {
    const sources = {
      "osm": {
        "type": "raster",
        "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors.",
        "tileSize": 256,
        "tiles": [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ]
      },
      "states-wms": {
        "type": "raster",
        "tileSize": 256,
        "tiles": ["https://ahocevar.com/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}"]
      }
    };
    const layers = [{
      "id": "osm",
      "source": "osm"
    }, {
      "id": "states",
      "source": "states-wms",
    }];
    const center = [0, 0];
    const zoom = 2;
    const _sourcesVersion = 0, _layersVersion = 0;
    const wrapper = shallow(<Map map={{center, zoom, sources, layers, _sourcesVersion, _layersVersion}} />);
    wrapper.instance().componentDidMount();
    const map = wrapper.instance().map;
    expect(map).toBeDefined();
    expect(map).toBeInstanceOf(olMap);
    expect(map.getLayers().item(0)).toBeInstanceOf(TileLayer);

    // move the map.
    wrapper.setProps({
      zoom: 4
    });
  });

  it('should create a static image', function() {
    const sources = {
      "overlay": {
        "type": "image",
        "url": "https://www.mapbox.com/mapbox-gl-js/assets/radar.gif",
        "coordinates": [
          [-80.425, 46.437],
          [-71.516, 46.437],
          [-71.516, 37.936],
          [-80.425, 37.936]
        ]
      }
    };
    const layers = [{
      "id": "overlay",
      "source": "overlay",
      "type": "raster",
      "paint": {"raster-opacity": 0.85}
    }];
    const center = [0, 0];
    const zoom = 2;
    const _sourcesVersion = 0, _layersVersion = 0;
    const wrapper = shallow(<Map map={{center, zoom, sources, layers, _sourcesVersion, _layersVersion}} />);
    wrapper.instance().componentDidMount();
    const map = wrapper.instance().map;
    const layer = map.getLayers().item(0);
    expect(layer).toBeInstanceOf(ImageLayer);
    expect(layer.getOpacity()).toEqual(layers[0].paint['raster-opacity']);
    const source = layer.getSource();
    expect(source).toBeInstanceOf(ImageStaticSource);
  });

  it('should create a raster tilejson', function() {
    const sources = {
      "tilejson": {
        "type": "raster",
        "url": "https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure"
      }
    };
    const layers = [{
      "id": "tilejson-layer",
      "source": "tilejson"
    }];
    const center = [0, 0];
    const zoom = 2;
    const _sourcesVersion = 0, _layersVersion = 0;
    const wrapper = shallow(<Map map={{center, zoom, sources, layers, _sourcesVersion, _layersVersion}} />);
    wrapper.instance().componentDidMount();
    const map = wrapper.instance().map;
    const layer = map.getLayers().item(0);
    expect(layer).toBeInstanceOf(TileLayer);
    const source = layer.getSource();
    expect(source).toBeInstanceOf(TileJSONSource);
  });

  it('should handle visibility changes', function() {
    const sources = {
      "tilejson": {
        "type": "raster",
        "url": "https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure"
      }
    };
    const layers = [{
      "id": "tilejson-layer",
      "source": "tilejson"
    }];
    const center = [0, 0];
    const zoom = 2;
    const _sourcesVersion = 0, _layersVersion = 0;
    const wrapper = shallow(<Map map={{center, zoom, sources, layers, _sourcesVersion, _layersVersion}} />);
    const instance = wrapper.instance();
    instance.componentDidMount();
    const map = instance.map;
    const layer = map.getLayers().item(0);
    expect(layer.getVisible()).toBe(true);
    const nextProps = {
      map: {
        center,
        zoom,
        _sourcesVersion: 0,
        _layersVersion: 1,
        sources,
        layers: [{
          "id": "tilejson-layer",
          "source": "tilejson",
          "layout": {
            visibility: "none"
          }
        }]
      }
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(layer.getVisible()).toBe(false);
  });

  it('should handle layer removal and re-adding', function() {
    const sources = {
      "tilejson": {
        "type": "raster",
        "url": "https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure"
      }
    };
    const layers = [{
      "id": "tilejson-layer",
      "source": "tilejson"
    }];
    const center = [0, 0];
    const zoom = 2;
    const _sourcesVersion = 0, _layersVersion = 0;
    const wrapper = shallow(<Map map={{center, zoom, sources, layers, _sourcesVersion, _layersVersion}} />);
    const instance = wrapper.instance();
    instance.componentDidMount();
    const map = instance.map;
    const layer = map.getLayers().item(0);
    let nextProps = {
      map: {
        center,
        zoom,
        _sourcesVersion: 0,
        _layersVersion: 1,
        sources,
        layers: []
      }
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(map.getLayers().getLength()).toBe(0);
    nextProps = {
      map: {
        center,
        zoom,
        _sourcesVersion: 0,
        _layersVersion: 2,
        sources,
        layers: layers
      }
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(map.getLayers().getLength()).toBe(1);
  });

  it('should created a connected map', function() {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<ConnectedMap store={store}/>);
  });

});
