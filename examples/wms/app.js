/** WMS Example.
 *
 *  Shows how to interact with a Web Mapping Service.
 *
 */

import {createStore, combineReducers} from 'redux';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import WMSCapabilitiesFormat from 'ol/format/WMSCapabilities';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import RendererSwitch from '../rendererswitch';
import SdkZoomControl from '@boundlessgeo/sdk/components/map/zoom-control';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';
import SdkLayerList from '@boundlessgeo/sdk/components/layer-list';

import '@boundlessgeo/sdk/stylesheet/sdk.scss';
import WMSPopup from './wmspopup';
import AddWMSLayer from './addwmslayer';

const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

function main() {
  // start in the middle of america
  store.dispatch(mapActions.setView([-98, 40], 4));

  // add the OSM source
  store.dispatch(mapActions.addOsmSource('osm'));

  // and an OSM layer.
  store.dispatch(mapActions.addLayer({
    id: 'osm',
    source: 'osm',
    type: 'raster',
  }));

  // retrieve GetCapabilities and give user ability to add a layer.
  const addWMS = () => {
    // this requires CORS headers on the geoserver instance.
    const url = 'https://demo.boundlessgeo.com/geoserver/wms?service=WMS&request=GetCapabilities';
    fetch(url).then(
      response => response.text(),
      error => console.error('An error occured.', error),
    )
      .then((xml) => {
        const info = new WMSCapabilitiesFormat().read(xml);
        const root = info.Capability.Layer;
        ReactDOM.render(<AddWMSLayer
          onAddLayer={(layer) => {
          // add a new source and layer
            const getMapUrl = `https://demo.boundlessgeo.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:900913&LAYERS=${layer.Name}&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
            store.dispatch(mapActions.addSource(layer.Name, {
              type: 'raster',
              tileSize: 256,
              tiles: [getMapUrl],
            }));
            store.dispatch(mapActions.addLayer({
              type: 'raster',
              metadata: {
                'bnd:title': layer.Title,
                'bnd:queryable': layer.queryable,
              },
              id: layer.Name,
              source: layer.Name,
            }));
          }
          }
          layers={root.Layer}
        />, document.getElementById('add-wms'));
      }).catch((exception) => {
        console.error('An error occurred.', exception);
      });
  };

  // place the map on the page.
  ReactDOM.render(<Provider store={store}>
    <RendererSwitch
      style={{position: 'relative'}}
      includeFeaturesOnClick
      onClick={(map, xy, featuresPromise) => {
        // show a popup containing WMS GetFeatureInfo.
        featuresPromise.then((featureGroups) => {
          // setup an array for all the features returned in the promise.
          let features = [];

          // featureGroups is an array of objects. The key of each object
          // is a layer from the map.
          for (let g = 0, gg = featureGroups.length; g < gg; g++) {
            // collect every feature from each layer.
            const layers = Object.keys(featureGroups[g]);
            for (let l = 0, ll = layers.length; l < ll; l++) {
              const layer = layers[l];
              features = features.concat(featureGroups[g][layer]);
            }
          }
          if (features.length > 0) {
            map.addPopup(<WMSPopup
              coordinate={xy}
              closeable
              features={features}
            />);
          }
        }).catch((exception) => {
          console.error('An error occurred.', exception);
        });
      }}>
      <SdkZoomControl style={{position: 'absolute', top: 20, left: 20}} />
    </RendererSwitch>
  </Provider>, document.getElementById('map'));

  // Add DND to the LayerList
  const DragDropLayerList = DragDropContext(HTML5Backend)(SdkLayerList);

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <h3>Try it out</h3>
      <h4>Layers</h4>
      <Provider store={store}>
        <DragDropLayerList />
      </Provider>
      <button onClick={addWMS}>Add WMS Layer</button>
    </div>
  ), document.getElementById('controls'));
}

main();
