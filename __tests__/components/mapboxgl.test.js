/* global it, describe, expect, spyOn */

import React from 'react';
import {shallow, mount, configure} from 'enzyme';
import  Adapter from 'enzyme-adapter-react-16';
import {createStore, combineReducers} from 'redux';

import MapReducer from '../../src/reducers/map';
import MapInfoReducer from '../../src/reducers/mapinfo';
import DrawingReducer from '../../src/reducers/drawing';
import ConnectedMap, {MapboxGL, getMapExtent} from '../../src/components/mapboxgl';
import SdkPopup from '../../src/components/map/popup';

configure({adapter: new Adapter()});

const createMapDrawMock = () => {
  return {
    changeMode: () => {},
    getAll: () => {},
    add: () => {},
    deleteAll: () => {}
  };
};
const createMapMock = () => {
  return {
    getSource: () => {
      return {
        setData: () => {
        }
      };
    },
    setStyle: () => {},
    setCenter: () => {},
    setBearing: () => {},
    setZoom: () => {},
    addControl: () => {},
    on: () => {},
    off: () => {},
    resize: () => {},
    queryRenderedFeatures: () => {
      return [{
        layer: {
          id: 'foo',
        },
      }];
    }
  };
};

describe('MapboxGL component', () => {
  it('should render without throwing an error', () => {
    const wrapper = shallow(<MapboxGL />);
    expect(wrapper.find('.sdk-map').length).toBe(1);
  });

  it('should allow for custom className', () => {
    const wrapper = shallow(<MapboxGL className='foo' />);
    expect(wrapper.find('.foo').length).toBe(1);
  });

  it('should set layersVersion and sourcesVersion', () => {
    const sources = {};
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const wrapper = mount(<MapboxGL
      mapbox={{accessToken: apiKey}}
      map={{center, zoom, sources, layers, metadata}}
    />);
    const map = wrapper.instance();
    expect(map.sourcesVersion).toBe(0);
    expect(map.layersVersion).toBe(0);
  });

  it('should return the correct draw mode', () => {
    const wrapper = shallow(<MapboxGL className='foo' />);
    const map = wrapper.instance();
    expect(map.getMode('Point')).toBe('draw_point');
    expect(map.getMode('LineString')).toBe('draw_line_string');
    expect(map.getMode('Polygon')).toBe('draw_polygon');
  });

  it('shouldComponentUpdate works as expected', () => {
    const sources = {
      geojson: {
        type: 'geojson',
        data: {
          features: []
        }
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const wrapper = mount(<MapboxGL
      mapbox={{accessToken: apiKey}}
      map={{center, zoom, sources, layers, metadata}}
    />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.map.on = () => {};
    map.map.off = () => {};
    map.draw = createMapDrawMock();
    spyOn(map.map, 'setStyle');
    spyOn(map.map, 'setCenter');
    spyOn(map.map, 'setBearing');
    spyOn(map.map, 'setZoom');
    let newMetadata = Object.assign({}, metadata);
    newMetadata['bnd:source-version'] = 1;
    newMetadata['bnd:data-version:geojson'] = 1;
    let nextProps = {
      map: {
        center: [10, 10],
        bearing: 45,
        zoom: 3,
        sources: sources,
        metadata: newMetadata,
      },
      drawing: {
        interaction: 'Point',
        sourceName: 'geojson',
      },
    };
    const types = [];
    const on = (type) => {
      types.push(type);
    };
    map.map.on = on;
    const removeControl = () => {};
    map.map.removeControl = removeControl;
    spyOn(map.map, 'removeControl');
    map.componentWillReceiveProps(nextProps);
    expect(types).toEqual(['draw.create', 'draw.update']);
    expect(map.map.setStyle).toHaveBeenCalled();
    expect(map.map.setCenter).toHaveBeenCalled();
    expect(map.map.setBearing).toHaveBeenCalled();
    expect(map.map.setZoom).toHaveBeenCalled();
    expect(map.sourcesVersion).toBe(1);
    spyOn(map, 'updateInteraction').and.callThrough();
    nextProps.drawing = {
      interaction: 'Polygon',
      sourceName: 'geojson',
    };
    map.componentWillReceiveProps(nextProps);
    expect(map.updateInteraction).toHaveBeenCalled();
    delete nextProps.map.metadata;
    nextProps.map.sources = {};
    map.componentWillReceiveProps(nextProps);
    expect(map.sourcesVersion).not.toBeDefined();
    expect(map.layersVersion).not.toBeDefined();
  });

  it('onClick is triggered', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const onClick = () => {};
    const props = {
      onClick,
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    spyOn(props, 'onClick');
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.onMapClick({
      point: {x: 5, y: 10},
      lngLat: {
        lng: 50,
        lat: 45
      },
    });
    expect(props.onClick).toHaveBeenCalled();
  });

  it('unmount causes removal', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const props = {
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    const remove = () => {};
    map.map.remove = remove;
    spyOn(map.map, 'remove');
    map.componentWillUnmount();
    expect(map.map.remove).toHaveBeenCalled();
  });

  it('setView is triggered', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const setView = () => {};
    const props = {
      setView,
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    spyOn(props, 'setView');
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.onMapMoveEnd();
    expect(props.setView).toHaveBeenCalled();
  });

  it('draw event should be triggered', () => {
    const onFeatureDrawn = () => {};
    const props = {
      onFeatureDrawn,
    };
    spyOn(props, 'onFeatureDrawn');
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    const collection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
      }],
    };
    map.onFeatureEvent('drawn', 'foo', collection);
    expect(props.onFeatureDrawn).toHaveBeenCalled();
  });

  it('modified event should be triggered', () => {
    const onFeatureModified = () => {};
    const props = {
      onFeatureModified,
    };
    spyOn(props, 'onFeatureModified');
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    const collection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
      }],
    };
    map.onFeatureEvent('modified', 'foo', collection);
    expect(props.onFeatureModified).toHaveBeenCalled();
  });

  it('configureMap sets listeners', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const props = {
      hover: false,
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    const types = [];
    const on = (evt) => {
      types.push(evt);
    };
    map.map.on = on;
    spyOn(map.map, 'on').and.callThrough();
    map.configureMap();
    expect(map.map.on).toHaveBeenCalledTimes(3);
    expect(types).toEqual(['resize', 'moveend', 'click']);
  });

  it('hover for mouse position works correctly', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const props = {
      setMousePosition: (lngLat) => {
      },
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    spyOn(props, 'setMousePosition');
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    const types = [];
    const on = (evt) => {
      types.push(evt);
    };
    map.map.on = on;
    spyOn(map.map, 'on').and.callThrough();
    map.configureMap();
    expect(map.map.on).toHaveBeenCalledTimes(4);
    expect(types).toEqual(['resize', 'mousemove', 'moveend', 'click']);
    map.onMouseMove({lngLat: {lng: 50, lat: 45}});
    expect(props.setMousePosition).toHaveBeenCalledWith({lng: 50, lat: 45});
  });

  it('configureMap sets load listener', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const props = {
      hover: false,
      mapbox: {accessToken: apiKey},
      initialPopups: [(<SdkPopup coordinate={[0, 0]} closeable><div>foo</div></SdkPopup>)],
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    const types = [];
    const on = (evt) => {
      types.push(evt);
    };
    map.map.on = on;
    spyOn(map.map, 'on').and.callThrough();
    map.configureMap();
    expect(map.map.on).toHaveBeenCalledTimes(4);
    expect(types).toEqual(['resize', 'moveend', 'click', 'load']);
  });

  it('configureMap calls updateInteraction', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const drawing = {
      interaction: 'Point'
    };
    const props = {
      drawing,
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    spyOn(map, 'updateInteraction');
    // mock up our GL map
    map.map = createMapMock();
    const on = () => {};
    map.map.on = on;
    map.configureMap();
    expect(map.updateInteraction).toHaveBeenCalled();
  });

  it('updateInteraction works correctly', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const drawing = {
      interaction: 'Point'
    };
    const props = {
      drawing,
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    const on = () => {};
    map.map.on = on;
    spyOn(map.draw, 'changeMode');
    map.updateInteraction({interaction: 'Polygon'});
    expect(map.draw.changeMode).toHaveBeenCalled();
  });

  it('updateInteraction adds the features to draw', () => {
    const sources = {
      geojson: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{id: '1'}]
        }
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const drawing = {
      interaction: 'Point'
    };
    const props = {
      drawing,
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    const on = () => {};
    map.map.on = on;
    spyOn(map.draw, 'deleteAll');
    spyOn(map.draw, 'add');
    map.updateInteraction({interaction: 'Polygon', sourceName: 'geojson'});
    expect(map.draw.deleteAll).toHaveBeenCalled();
    expect(map.draw.add).toHaveBeenCalled();
  });

  it('changes the mode with options', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const drawing = {
      interaction: 'Point'
    };
    const props = {
      drawing,
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const modeOptions = {
      custom: true
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    const on = () => {};
    map.map.on = on;
    spyOn(map.draw, 'changeMode');
    map.updateInteraction({interaction: 'Polygon', currentMode: 'customMode', currentModeOptions: modeOptions});
    expect(map.draw.changeMode).toHaveBeenCalledWith('customMode', modeOptions);
  });

  it('updateInteraction with measure works correctly', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const drawing = {
      interaction: 'Point'
    };
    const props = {
      drawing,
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    const on = () => {};
    map.map.on = on;
    spyOn(map.draw, 'changeMode');
    map.updateInteraction({interaction: 'measure:LineString'});
    expect(map.draw.changeMode).toHaveBeenCalled();
  });

  it('should call setView', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
      mapinfo: MapInfoReducer,
    }));

    const props = {
      store,
    };

    const wrapper = mount(<ConnectedMap {...props} />);
    const map = wrapper.instance().getWrappedInstance();
    // mock up our GL map
    map.map = createMapMock();
    map.map.getCenter = () => {
      return {
        toArray: () => {
          return [50, 45];
        }
      };
    };
    map.map.getZoom = () => {
      return 3;
    };
    map.map.getBearing = () => {
      return 0;
    };
    map.map.getBounds = () => {
      return {
        getSouthWest: () => {
          return {
            lng: -45,
            lat: -50,
          };
        },
        getNorthEast: () => {
          return {
            lng: -25,
            lat: -20,
          };
        }
      };
    };
    map.onMapMoveEnd();
    expect(store.getState().mapinfo.extent).toEqual([-45, -50, -25, -20]);
    expect(store.getState().map.center).toEqual([50, 45]);
    expect(store.getState().map.bearing).toEqual(0);
    expect(store.getState().map.zoom).toEqual(3);
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
    const map = wrapper.instance().getWrappedInstance();
    // mock up our GL map
    map.map = createMapMock();
    let types = [];
    map.map.off = (eventType) => {
      types.push(eventType);
    };

    expect(Object.keys(map.popups).length).toBe(0);

    map.onMapLoad();

    expect(Object.keys(map.popups).length).toBe(1);
    expect(types[0]).toBe('click');
  });

  it('addPopup works correctly', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const props = {
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.addPopup(<SdkPopup coordinate={[0, 0]} closeable><div>foo</div></SdkPopup>);
    expect(Object.keys(map.popups).length).toBe(1);
    expect(Object.keys(map.elems).length).toBe(1);
  });

  it('updatePopups works correctly', () => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const props = {
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    const popupId = 'foo';
    // mock overlay and popup
    const setMap = (map) => {};
    const popup = {
      setMap,
      state: {
        closed: true,
      },
    };
    spyOn(popup, 'setMap');
    map.popups[popupId] = popup;
    const overlay = {
      popupId,
      remove: () => {},
    };
    map.overlays = [overlay];
    map.elems[popupId] = mount(<div/>).instance();
    spyOn(overlay, 'remove');
    map.updatePopups();
    expect(map.elems[popupId]).not.toBeDefined();
    expect(map.popups[popupId]).not.toBeDefined();
    expect(popup.setMap).toHaveBeenCalledWith(null);
    expect(overlay.remove).toHaveBeenCalled();
  });

  it('onDrawCreate works correctly', (done) => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const props = {
      onFeatureDrawn: () => {},
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.map.on = () => {};
    map.map.off = () => {};
    spyOn(props, 'onFeatureDrawn');
    const draw = {
      changeMode: (mode) => {}
    };
    spyOn(draw, 'changeMode');
    map.draw = draw;
    map.componentWillReceiveProps({map: {sources: {}, metadata: {}, layers: []}, drawing: {sourceName: 'geosjon'}});
    map.onDrawCreate({
      features: [{}]
    }, 'draw_polygon');
    window.setTimeout(function() {
      expect(draw.changeMode).toHaveBeenCalled();
      done();
    }, 0);
  });

  it('onDrawRender works correctly', (done) => {
    const sources = {
      geojson: {
        type: 'geojson',
      },
    };
    const layers = [];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:data-version:geojson': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const props = {
      setMeasureGeometry: () => {},
      mapbox: {accessToken: apiKey},
      map: {center, zoom, sources, layers, metadata}
    };
    spyOn(props, 'setMeasureGeometry');
    const wrapper = mount(<MapboxGL {...props} />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    map.draw.getAll = () => {
      return {features: [{geometry: {}}]};
    };
    map.onDrawRender({});
    window.setTimeout(function() {
      expect(props.setMeasureGeometry).toHaveBeenCalled();
      done();
    }, 0);
  });

  it('optionsForMode returns featureId object', () => {
    const wrapper = shallow(<MapboxGL />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    expect(map.optionsForMode('direct_select', {features: [{id: 1}]})).toEqual({featureId: 1});
  });

  it('setMode returns the currentMode if afterMode is not set', () => {
    const wrapper = shallow(<MapboxGL />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    expect(map.setMode('direct_select')).toEqual('direct_select');
  });

  it('setMode returns after if afterMode is set', () => {
    const wrapper = shallow(<MapboxGL />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    expect(map.setMode('direct_select', 'simple_select')).toEqual('simple_select');
  });

  it('default modes are simple_select and direct_select for modify interaction', () => {
    const wrapper = shallow(<MapboxGL />);
    const map = wrapper.instance();
    // mock up our GL map
    map.map = createMapMock();
    map.map.on = () => {};
    map.map.off = () => {};
    map.draw = createMapDrawMock();
    map.addedDrawListener = true;
    const drawingProps = {
      interaction: 'Modify',
      sourceName: 'geojson',
    };
    map.updateInteraction(drawingProps);
    expect(map.currentMode).toEqual('simple_select');
    expect(map.afterMode).toEqual('direct_select');
  });

  it('setMeasureGeometry works correctly for LineString', (done) => {
    const store = createStore(combineReducers({
      map: MapReducer,
      draw: DrawingReducer,
    }));
    const wrapper = mount(<ConnectedMap store={store} />);
    const map = wrapper.instance().getWrappedInstance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    map.draw.getAll = () => {
      return {features: [{geometry: {type: 'LineString', coordinates: [[0, 10], [0, 20]]}}]};
    };
    map.onDrawRender({});
    window.setTimeout(function() {
      expect(store.getState().draw.measureSegments).toEqual([1111.9508023353287]);
      done();
    }, 0);
  });

  it('setMeasureGeometry works correctly for Polygon', (done) => {
    const store = createStore(combineReducers({
      map: MapReducer,
      draw: DrawingReducer,
    }));
    const wrapper = mount(<ConnectedMap store={store} />);
    const map = wrapper.instance().getWrappedInstance();
    // mock up our GL map
    map.map = createMapMock();
    map.draw = createMapDrawMock();
    map.draw.getAll = () => {
      return {features: [{geometry: {type: 'Polygon', coordinates: [[[0, 10], [0, 20], [10, 10], [10, 20], [0, 10]]]}}]};
    };
    map.onDrawRender({});
    window.setTimeout(function() {
      expect(store.getState().draw.measureSegments).toEqual([0.00014113929327614141]);
      done();
    }, 0);
  });

  it('should create a connected map', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));
    mount(<ConnectedMap store={store} />);
  });

  it('getMapExtent should work correctly', () => {
    const map = createMapMock();
    map.getBounds = () => {
      return {
        getSouthWest: () => {
          return {
            lng: -45,
            lat: -50,
          };
        },
        getNorthEast: () => {
          return {
            lng: -25,
            lat: -20,
          };
        }
      };
    };
    const extent = getMapExtent(map);
    expect(extent).toEqual([-45, -50, -25, -20]);
  });

});
