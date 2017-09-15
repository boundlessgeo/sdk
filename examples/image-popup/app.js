/** Image Popup application.
 *
 *  Contains a Map and demonstrates displaying a
 *  popup containing an image on the map.
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkPopup from '@boundlessgeo/sdk/components/map/popup';

import * as mapActions from '@boundlessgeo/sdk/actions/map';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

/** A popup containing an image.
 */
class ImagePopup extends SdkPopup {

  render() {
    const feature_ids = this.props.features.map(f => f.properties.id);
    const feature_imgs = this.props.features.map(f => f.properties.image);
    const feature_titles = this.props.features.map(f => f.properties.title);

    return this.renderPopup((
      <div className="sdk-popup-content">
        <p>
          Breed from here: { feature_titles.join(', ') }
        <br />
        <img src={feature_imgs} alt={feature_ids} />
      </p>
    </div>
  ));
  }
}

function addDogs(sourceName, data) {
  for (let i = 0; i < data.length; i++) {
    const dog = data[i];
    const id = dog.id;
    const title = dog.title;
    const coordinates = dog.coordinates;
    const image = dog.image;
    // the feature.properties.image contains the image path
    store.dispatch(mapActions.addFeatures(sourceName, [{
      type: 'Feature',
      properties: {
        id,
        title,
        image
      },
      geometry: {
        type: 'Point',
        coordinates,
      },
    }]));
  }
};

function main() {
  // Start with a reasonable global view of the map.
  store.dispatch(mapActions.setView([-15, 30], 2));

  // add the OSM source
  store.dispatch(mapActions.addSource('osm', {
    type: 'raster',
    tileSize: 256,
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
  }));

  // and an OSM layer.
  // Raster layers need not have any paint styles.
  store.dispatch(mapActions.addLayer({
    id: 'osm',
    source: 'osm',
  }));

  // Add a geojson source to the map.
  store.dispatch(mapActions.addSource('dogs', {
    type: 'geojson',
    data: {},
  }));

  // add a layer for the dogs.
  store.dispatch(mapActions.addLayer({
    id: 'dog-layer',
    source: 'dogs',
    type: 'circle',
    paint: {
      'circle-radius': 5,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    },
  }));

  const dog_data = [
    {id:'dog-1', title:'Akita', coordinates: [140.1024, 39.7186], image:'dogs/akita.jpg'},
    {id:'dog-2', title:'Basenji', coordinates: [21.7587, 4.0383], image:'dogs/basenji.jpg'},
    {id:'dog-3', title:'Cairn Terrier', coordinates: [-4.71, 57.12], image:'dogs/cairn.jpg'},
    {id:'dog-4', title:'Xoloitzcuintli', coordinates: [-99.89, 16.86], image:'dogs/xoloitzcuintli.jpg'},
    {id:'dog-5', title:'Mucuchí', coordinates: [-71.0126, 8.5702], image:'dogs/mucuchi.jpg'},
    {id:'dog-6', title:'Malamute', coordinates: [-149.4937, 64.2008], image:'dogs/malamute.jpg'},
    {id:'dog-7', title:'Cavapoo', coordinates: [133.7751, -25.2744], image:'dogs/cavapoo.jpg'},
  ];

  addDogs('dogs', dog_data);

  ReactDOM.render((
    <SdkMap
      store={store}
      includeFeaturesOnClick
      onClick={(map, xy, featuresPromise) => {
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

          if (features.length === 0) {
            // no features, :( Let the user know nothing was there.
            map.addPopup(<SdkPopup coordinate={xy} closeable><i>No dogs here.</i></SdkPopup>);
          } else {
            // Show the super advanced fun popup!
            const img = new Image();
            img.onload = () => {
              map.addPopup(<ImagePopup coordinate={xy} features={features} closeable />);
            };
            img.src = features[0].properties.image;
          }
        });
      }}
    />
  ), document.getElementById('map'));
}

main();
