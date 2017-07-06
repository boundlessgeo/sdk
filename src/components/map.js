/** Provide an OpenLayers map which reflects the
 *  state of the  store.
 */

import React from 'react';

import { connect } from 'react-redux';

import { setView } from '../actions/map';

import getStyleFunction from 'mapbox-to-ol-style';

import olMap from 'ol/map';
import View from 'ol/view';

import TileLayer from 'ol/layer/tile';
import XyzSource from 'ol/source/xyz';
import TileJSON from 'ol/source/tilejson';

import ImageLayer from 'ol/layer/image';
import ImageStaticSource from 'ol/source/imagestatic';

import VectorLayer from 'ol/layer/vector';
import VectorSource from 'ol/source/vector';

import GeoJsonFormat from 'ol/format/geojson';


const GEOJSON_FORMAT = new GeoJsonFormat();

function configureXyzSource(glSource) {
  const source = new XyzSource({
      attributions: glSource.attribution,
      minZoom: glSource.minzoom,
      maxZoom: 'maxzoom' in glSource ? glSource.maxzoom : 22,
      tileSize: glSource.tileSize || 512,
      //url: url,
      urls: glSource.tiles,
      crossOrigin: 'crossOrigin' in glSource ? glSource.crossOrigin : 'anonymous',
    });

  source.setTileLoadFunction(function(tile, src) {
    if (src.indexOf('{bbox-epsg-3857}') != -1) {
      var bbox = source.getTileGrid().getTileCoordExtent(tile.getTileCoord());
      src = src.replace('{bbox-epsg-3857}', bbox.toString());
    }
    tile.getImage().src = src;
  });

  return source;
}

function configureTileJSONSource(glSource) {
  return new TileJSON({
    url: glSource.url,
    crossOrigin: 'anonymous'
  });
}

function configureImageSource(glSource) {
  const coords = glSource.coordinates;
  const source = new ImageStaticSource({
    url: glSource.url,
    imageExtent: [coords[0][0], coords[3][1], coords[1][0], coords[0][1]],
    projection: 'EPSG:4326'
  });
  return source;
}

/** Create a vector source based on a
 *  MapBox GL styles definition.
 *
 *  @param glSource a MapBox GL styles defintiion of the source.
 *
 * @returns ol.source.vector instance.
 */
function configureVectorSource(glSource) {
  const vector_src = new VectorSource({
    useSpatialIndex: false,
    wrapX: false
  });

  // see the vector source with the first update
  //  before returning it.
  updateVectorSource(vector_src, glSource);

  return vector_src;
}

function updateVectorSource(olSource, glSource) {
  // this indicates the data version has changed.
  if (olSource.get('dataVersion') !== glSource._dataVersion) {
    // parse the new features,
    // TODO: This should really check the map for the correct projection.
    const features = GEOJSON_FORMAT.readFeatures(glSource.data, {featureProjection: 'EPSG:3857'});

    // clear the layer WITHOUT dispatching remove events.
    olSource.clear(true);
    // bulk load the feature data.
    olSource.addFeatures(features);

    // update the data version in the layer.
    olSource.set('dataVersion', glSource._dataVersion);
  }
}


function configureSource(glSource) {
  // tiled raster layer.
  if(glSource.type === 'raster') {
    if ('tiles' in glSource) {
      return configureXyzSource(glSource);
    } else if (glSource.url) {
      return configureTileJSONSource(glSource);
    }
  } else if(glSource.type === 'geojson') {
    return configureVectorSource(glSource);
  } else if (glSource.type === 'image') {
    return configureImageSource(glSource);
  }
  return null;
}

export class Map extends React.Component {


  constructor(props) {
    super(props);

    this.sourcesVersion = null;
    this.layersVersion = null;
    // keep a version of the sources in
    //  their OpenLayers source definition.
    this.sources = {};

    // hash of the openlayers layers in the map.
    this.layers = [];
  }

  /** Initialize the map */
  configureMap() {
    this.map = new olMap({
      target: this.refs.mapdiv,
      view: new View({
        center: this.props.map.center,
        zoom: this.props.map.zoom,
      })
    });

    // when the map moves update the location in the state
    this.map.on('moveend', (evt) => {
      this.props.setView(this.map.getView());
    });

    // bootstrap the map with the current configuration.
    this.configureSources(this.props.map.sources, this.props.map._sourcesVersion);
    this.configureLayers(this.props.map.sources, this.props.map.layers, this.props.map._layersVersion);
  }

  /** Convert the GL source definitions into internal
   *  OpenLayers source definitions.
   */
  configureSources(sourcesDef, sourceVersion) {
    this.sourcesVersion = sourceVersion;
    // TODO: Update this to check "diff" configurations
    //       of sources.  Currently, this will only detect
    //       additions and removals.
    for(const source_name in sourcesDef) {
      // Add the source because it's not in the current
      //  list of sources.
      if(!(source_name in this.sources)) {
        this.sources[source_name] = configureSource(sourcesDef[source_name]);
      }
    }

    // remove sources no longer there.
    for(const source_name in this.sources) {
      if(!(source_name in sourcesDef)) {
        // TODO: Remove all layers that are using this source.
        delete this.sources[source_name];
      }
    }
  }

  configureLayers(sourcesDef, layersDef, layerVersion) {
    const layer_exists = {};

    this.layersVersion = layerVersion;
    // layers is an array.
    for(let i = 0, ii = layersDef.length; i < ii; i++) {
      const layer = layersDef[i];
      const is_visible = layer.layout ? layer.layout.visibility !== 'none' : true;
      layer_exists[layer.id] = true;

      if(!(layer.id in this.layers)) {
        if (layer.type === 'background') {
          // TODO handle background
        } else {
          const layer_src = sourcesDef[layer.source];
          let new_layer = null;
          if(layer_src.type === 'raster') {
            new_layer = new TileLayer({
              source: this.sources[layer.source],
            });
          } else if (layer_src.type === 'geojson') {
            new_layer = new VectorLayer({
              source: this.sources[layer.source],
              // this is a small bit of trickery that fakes
              // `getStyleFunction` into rendering only THIS layer.
              style: getStyleFunction({
                version: 8,
                layers: [layer],
              }, layer.source)
            })
          } else if (layer_src.type === 'image') {
            new_layer = new ImageLayer({
              source: this.sources[layer.source],
              opacity: layer.paint ? layer.paint["raster-opacity"] : undefined,
            });
          }
          // if the new layer has been defined, add it to the map.
          if(new_layer !== null) {
            this.layers[layer.id] = new_layer;
            this.map.addLayer(this.layers[layer.id]);
          }
        }
      }

      // handle visibility and z-ordering.
      if(layer.id in this.layers) {
        this.layers[layer.id].setVisible(is_visible);
        this.layers[layer.id].setZIndex(i);
      }
    }

    // check for layers which should be removed.
    for(const layer_id in this.layers) {
      // if the layer_id was not set to true then
      //  it has been removed the state and needs to be removed
      //  from the map.
      if(layer_exists[layer_id] !== true) {
        this.map.removeLayer(this.layers[layer_id]);
        delete this.layers[layer_id];
      }
    }
  }

  componentDidMount() {
    // put the map into the DOM
    this.configureMap();
  }

  /** This will check nextProps and nextState to see
   *  what needs to be updated on the map.
   */
  shouldComponentUpdate(nextProps, nextState) {
    // compare the centers
    if(nextProps.map.center[0] !== this.props.map.center[0]
      || nextProps.map.center[1] !== this.props.map.center[1]
      || nextProps.map.zoom !== this.props.zoom) {
      this.map.getView().setCenter(nextProps.map.center);
      this.map.getView().setZoom(nextProps.map.zoom);
    }

    // check the sources diff
    if(this.sourcesVersion !== nextProps.map._sourcesVersion) {
      // go through and update the sources.
      this.configureSources(nextProps.map.sources, nextProps.map._sourcesVersion);
    }
    if(this.layersVersion !== nextProps.map._layersVersion) {
      // go through and update the layers.
      this.configureLayers(nextProps.map.sources, nextProps.map.layers, nextProps.map._layersVersion);
    }

    // check the vector sources for data changes
    for (const src_name in nextProps.map.sources) {
      const src = this.props.map.sources[src_name];
      if (src && src.type === 'geojson') {
        const next_src = nextProps.map.sources[src_name];
        if (src._dataVersion !== next_src._dataVersion) {
          updateVectorSource(this.sources[src_name], next_src);
        }
      }
    }

    // This should always return false to keep
    // render() from being called.
    return false;
  }

  render() {
    return (
      <div ref="mapdiv" className="map">
      </div>
    );
  }
}


const mapStateToProps = (state) => {
  return {
    map: state.map
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setView: (view) => {
      dispatch(setView(view.getCenter(), view.getZoom()));
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Map);
