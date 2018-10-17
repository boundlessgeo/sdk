/* global it, describe, expect, beforeEach, spyOn */

import React from 'react';
import {mount, configure} from 'enzyme';
import  Adapter from 'enzyme-adapter-react-16';

import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import {createStore, combineReducers} from 'redux';
import {Provider} from 'react-redux';

import MapReducer from '@boundlessgeo/sdk/reducers/map';
import * as MapActions from '@boundlessgeo/sdk/actions/map';

import MapInfoReducer from '@boundlessgeo/sdk/reducers/mapinfo';
import {setSourceError} from '@boundlessgeo/sdk/actions/mapinfo';

import {isLayerVisible} from '@boundlessgeo/sdk/util';

import LayerList from '@boundlessgeo/sdk/components/layer-list';
import SdkLayerListItem from  '@boundlessgeo/sdk/components/layer-list-item';
import {layerListItemTarget} from '@boundlessgeo/sdk/components/layer-list-item';

configure({adapter: new Adapter()});

const SdkLayerList = DragDropContext(HTML5Backend)(LayerList);

class TestLayerListItem extends SdkLayerListItem {
  render() {
    return (
      <div>
        <button className='btn-up' onClick={() => {
          this.moveLayerUp();
        }}></button>
        <button className='btn-down' onClick={() => {
          this.moveLayerDown();
        }}></button>
        <button className='btn-remove' onClick={() => {
          this.removeLayer();
        }}></button>
      </div>
    );
  }
}

// uses ol instead of ul
class TestList extends React.Component {
  render() {
    return (
      <ol>
        {this.props.children}
      </ol>
    );
  }
}

class TestListGroup extends React.Component {
  render() {
    const children = [];
    let text;
    if (this.props.group.collapsed) {
      text = this.props.group.name;
    } else {
      text = (<b>{this.props.group.name}</b>);
    }
    for (let i = 0, ii = this.props.childLayers.length; i < ii; i++) {
      children.push(
        <this.props.layerClass
          exclusive={this.props.group.exclusive}
          key={i}
          groupLayers={this.props.childLayers}
          layers={this.props.layers}
          layer={this.props.childLayers[i]}
          groupId={this.props.groupId}
        />
      );
    }
    return (<li>{text}<ol>{children}</ol></li>);
  }
}


describe('test the LayerList component', () => {
  let store = null;

  // this is the same setup as used in legends but instead
  //  of listing legends this lists the layers in a list.
  beforeEach(() => {
    store = createStore(combineReducers({
      map: MapReducer,
      mapinfo: MapInfoReducer,
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

  it('should allow for custom className', () => {
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} className='foo' /></Provider>);
    expect(wrapper.html()).toMatchSnapshot();
  });

  function getCustomLayerList() {
    return mount(<Provider store={store}><SdkLayerList enableDD={false} layerClass={TestLayerListItem} /></Provider>);
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
    checkbox.simulate('change', {target: {checked: false}});

    expect(isLayerVisible(store.getState().map.layers[0])).toBe(false);
    checkbox.simulate('change', {target: {checked: true}});
    expect(isLayerVisible(store.getState().map.layers[0])).toBe(true);
  });

  function setupGroups() {
    store.dispatch(MapActions.updateMetadata({
      'mapbox:groups': {
        'background': {
          name: 'Base Maps',
        },
        'overlays': {
          name: 'Overlays',
        },
      }
    }));
    store.dispatch(MapActions.updateLayer('osm', {
      metadata: {
        'mapbox:group': 'background'
      }
    }));
    store.dispatch(MapActions.updateLayer('wms-test', {
      metadata: {
        'mapbox:group': 'overlays'
      }
    }));
    store.dispatch(MapActions.updateLayer('html-test', {
      metadata: {
        'mapbox:group': 'overlays'
      }
    }));

  }

  it('should handle basic grouping', () => {
    setupGroups();
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} /></Provider>);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should handle rendering an error on a group', () => {
    setupGroups();

    // add chaos to the wms layer.
    store.dispatch(setSourceError('wms'));
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} /></Provider>);
    expect(wrapper.find('.sdk-layer-error').length).toBe(3);
  });

  it('should handle hiding layers', () => {
    store.dispatch(MapActions.updateLayer('osm', {
      metadata: {
        'bnd:hide-layerlist': true
      }
    }));
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} /></Provider>);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should handle rendering a layer with an error', () => {
    store.dispatch(setSourceError('wms'));
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} /></Provider>);
    expect(wrapper.find('.sdk-layer-error').length).toBe(1);
  });

  it('should handle a custom list class', () => {
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} listClass={TestList} /></Provider>);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should handle a custom list and listgroup class', () => {
    store.dispatch(MapActions.updateMetadata({
      'mapbox:groups': {
        'background': {
          name: 'Base Maps',
          collapsed: true
        },
        'overlays': {
          name: 'Overlays',
          collapsed: false
        },
      }
    }));
    store.dispatch(MapActions.updateLayer('osm', {
      metadata: {
        'mapbox:group': 'background'
      }
    }));
    store.dispatch(MapActions.updateLayer('wms-test', {
      metadata: {
        'mapbox:group': 'overlays'
      }
    }));
    store.dispatch(MapActions.updateLayer('html-test', {
      metadata: {
        'mapbox:group': 'overlays'
      }
    }));
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} groupClass={TestListGroup} listClass={TestList} /></Provider>);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should handle hiding layers in a group', () => {
    store.dispatch(MapActions.updateMetadata({
      'mapbox:groups': {
        'background': {
          name: 'Base Maps',
        },
        'overlays': {
          name: 'Overlays',
        },
      }
    }));
    store.dispatch(MapActions.updateLayer('osm', {
      metadata: {
        'mapbox:group': 'background'
      }
    }));
    store.dispatch(MapActions.updateLayer('wms-test', {
      metadata: {
        'mapbox:group': 'overlays',
        'bnd:hide-layerlist': true
      }
    }));
    store.dispatch(MapActions.updateLayer('html-test', {
      metadata: {
        'mapbox:group': 'overlays'
      }
    }));
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} /></Provider>);
    expect(wrapper.html()).toMatchSnapshot();
  });
});

describe('test drag and drop', () => {
  let drop, layers, props, monitor, item;
  beforeEach(() => {
    drop = layerListItemTarget.drop;
    layers = [{
      id: 'foo',
      index: 0,
    }, {
      id: 'bar',
      index: 1,
    }, {
      id: 'baz',
      index: 2,
    }];
    const dispatch = function() {};
    props = {index: 2, layers, dispatch};
    item = {
      index: 1,
      layer: layers[1],
    };
    monitor = {
      getItem() {
        return item;
      }
    };
  });
  it('should dispatch on drop', () => {
    spyOn(props, 'dispatch');
    drop(props, monitor);
    expect(props.dispatch).toHaveBeenCalledWith({'layerId': 'bar', 'targetId': 'baz', 'type': 'MAP_ORDER_LAYER'});
  });
  it('should not dispatch if source and target are the same', () => {
    props.index = 1;
    spyOn(props, 'dispatch');
    drop(props, monitor);
    expect(props.dispatch).not.toHaveBeenCalled();
  });
  it('should not dispatch if no source item layer', () => {
    delete item.layer;
    spyOn(props, 'dispatch');
    drop(props, monitor);
    expect(props.dispatch).not.toHaveBeenCalled();
  });
  it('should not dispatch if hover index out of bounds', () => {
    props.index = 10;
    spyOn(props, 'dispatch');
    drop(props, monitor);
    expect(props.dispatch).not.toHaveBeenCalled();
  });
});

describe('test the exclusive grouping of the LayerList component', () => {
  let store = null;

  beforeEach(() => {
    store = createStore(combineReducers({
      map: MapReducer,
    }), {
      map: {
        version: 8,
        sources: {},
        metadata: {
          'mapbox:groups': {
            'baselayers': {
              name: 'Base Layers',
              exclusive: true,
            },
          }
        },
        layers: [
          {
            id: 'osm',
            source: 'osm',
            metadata: {
              'mapbox:group': 'baselayers',
            },
          }, {
            id: 'carto',
            source: 'carto',
            metadata: {
              'mapbox:group': 'baselayers',
            },
            layout: {
              visibility: 'none',
            },
          }, {
            id: 'esri',
            source: 'esri',
            metadata: {
              'mapbox:group': 'baselayers',
            },
            layout: {
              visibility: 'none',
            },
          },
        ],
      },
    });
  });

  it('should handle exclusive groups', () => {
    const wrapper = mount(<Provider store={store}><SdkLayerList enableDD={false} /></Provider>);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should toggle layer visibility', () => {
    const wrapper = mount(<Provider store={store}><SdkLayerList /></Provider>);

    expect(isLayerVisible(store.getState().map.layers[0])).toBe(true);

    const checkbox = wrapper.find('input').first();
    checkbox.simulate('change', {target: {checked: true}});

    expect(isLayerVisible(store.getState().map.layers[0])).toBe(false);
    expect(isLayerVisible(store.getState().map.layers[1])).toBe(false);
    expect(isLayerVisible(store.getState().map.layers[2])).toBe(true);
  });
});
