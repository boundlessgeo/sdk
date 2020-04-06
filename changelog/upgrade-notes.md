## Upgrade notes

### Next Release

### v2.6.0

#### redux-thunk has been replaced with redux-saga
If you were using the setContext map action, before, you needed to have your store setup with the redux-thunk middleware:

```
import thunkMiddleware from 'redux-thunk';

const store = createStore(combineReducers({
  map: SdkMapReducer, 
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  applyMiddleware(thunkMiddleware)
);

store.dispatch(mapActions.setContext({url: './bookmarks.json'}));
```

In the new situation, this code needs to be replaced with:

```
import createSagaMiddleware from 'redux-saga';
import * as ContextSagas from 'webmap-sdk/sagas/context';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(ContextSagas.handleContext);

store.dispatch(mapActions.fetchContext({url: './bookmarks.json'}));
```

Also note that the action has been renamed to fetchContext from setContext.

### v2.3.1

#### onFeatureDrawn, onFeatureModified
To sync with the behaviour of the Map component, the MapboxGL component has also been adapted so that the onFeatureDrawn and onFeatureModified callbacks now get a collection of features instead of a single feature.

### v2.3.0

#### onFeatureDrawn, onFeatureModified, onFeatureSelected
The exisiting callback functions of the Map component, onFeatureDrawn, onFeatureModified and onFeatureSelected now get a collection of features instead of a single feature.
The onFeatureDeselected callback function has been added to deal with deselection of features.

#### Mininum and maximum zoom levels
Metadata has been added to restrict zoom levels on the map, and the zoom-slider component will also respect these (the minZoom and maxZoom props have been removed):

```
  map: {
    metadata: {
      'bnd:minzoom': 10,
      'bnd:maxzoom': 15,
    },
  },
```
You can set the map metadata for instance by using the updateMetadata map action.

The default max zoom level was changed from 24 to 22 as this is more inline with the Mapbox style specification and Mapbox GL JS.

#### Client-side time filtering
The name of the metadata key for filtering time-based datasets on the client has been changed from ```bnd:timeattribute``` to ```bnd:start-time``` and ```bnd:end-time``` where the last one is optional.

### v2.2.0

#### ol package
The version of the ```ol``` package was updated to 4.4.2.

#### Custom layer list items
If you were using a custom layer list item for the layer list, the imports for the base class were moved from:
```
import { SdkLayerListItem } from 'webmap-sdk/components/layer-list';
```
to:
```
import SdkLayerListItem from 'webmap-sdk/components/layer-list-item';
```
