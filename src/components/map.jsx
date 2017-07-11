/** Provide an OpenLayers map which reflects the
 *  state of the  store.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import getStyleFunction from 'mapbox-to-ol-style';

import OlMap from 'ol/map';
import View from 'ol/view';

import TileLayer from 'ol/layer/tile';
import XyzSource from 'ol/source/xyz';
import TileJSON from 'ol/source/tilejson';
import TileGrid from 'ol/tilegrid';

import VectorTileLayer from 'ol/layer/vectortile';
import VectorTileSource from 'ol/source/vectortile';
import MvtFormat from 'ol/format/mvt';

import ImageLayer from 'ol/layer/image';
import ImageStaticSource from 'ol/source/imagestatic';

import VectorLayer from 'ol/layer/vector';
import VectorSource from 'ol/source/vector';

import GeoJsonFormat from 'ol/format/geojson';

import { setView } from '../actions/map';
import { LAYER_VERSION_KEY, SOURCE_VERSION_KEY } from '../constants';
import { dataVersionKey } from '../reducers/map';


const GEOJSON_FORMAT = new GeoJsonFormat();

/** This variant of getVersion differs as it allows
 *  for undefined values to be returned.
 */
function getVersion(obj, key) {
  if (typeof obj.metadata === 'undefined') {
    return undefined;
  }
  return obj.metadata[key];
}

function configureXyzSource(glSource) {
  const source = new XyzSource({
    attributions: glSource.attribution,
    minZoom: glSource.minzoom,
    maxZoom: 'maxzoom' in glSource ? glSource.maxzoom : 22,
    tileSize: glSource.tileSize || 512,
    urls: glSource.tiles,
    crossOrigin: 'crossOrigin' in glSource ? glSource.crossOrigin : 'anonymous',
  });

  source.setTileLoadFunction((tile, src) => {
    // copy the src string.
    let img_src = src.slice();
    if (src.indexOf('{bbox-epsg-3857}') !== -1) {
      const bbox = source.getTileGrid().getTileCoordExtent(tile.getTileCoord());
      img_src = src.replace('{bbox-epsg-3857}', bbox.toString());
    }
    // disabled the linter below as this is how
    //  OpenLayers documents this operation.
    // eslint-disable-next-line
    tile.getImage().src = img_src; 
  });

  return source;
}

function configureTileJSONSource(glSource) {
  return new TileJSON({
    url: glSource.url,
    crossOrigin: 'anonymous',
  });
}

function configureImageSource(glSource) {
  const coords = glSource.coordinates;
  const source = new ImageStaticSource({
    url: glSource.url,
    imageExtent: [coords[0][0], coords[3][1], coords[1][0], coords[0][1]],
    projection: 'EPSG:4326',
  });
  return source;
}

function configureMvtSource(glSource) {
  const source = new VectorTileSource({
    url: glSource.url,
    tileGrid: TileGrid.createXYZ({ maxZoom: 22 }),
    tilePixelRatio: 16,
    format: new MvtFormat(),
    crossOrigin: 'crossOrigin' in glSource ? glSource.crossOrigin : 'anonymous',
  });

  return source;
}

function updateGeojsonSource(olSource, glSource) {
  // parse the new features,
  // TODO: This should really check the map for the correct projection.
  const features = GEOJSON_FORMAT.readFeatures(glSource.data, { featureProjection: 'EPSG:3857' });

  // clear the layer WITHOUT dispatching remove events.
  olSource.clear(true);
  // bulk load the feature data.
  olSource.addFeatures(features);
}

/** Create a vector source based on a
 *  MapBox GL styles definition.
 *
 *  @param glSource a MapBox GL styles defintiion of the source.
 *
 * @returns ol.source.vector instance.
 */
function configureGeojsonSouce(glSource) {
  const vector_src = new VectorSource({
    useSpatialIndex: false,
    wrapX: false,
  });

  // see the vector source with the first update
  //  before returning it.
  updateGeojsonSource(vector_src, glSource);

  return vector_src;
}

function configureSource(glSource) {
  // tiled raster layer.
  if (glSource.type === 'raster') {
    if ('tiles' in glSource) {
      return configureXyzSource(glSource);
    } else if (glSource.url) {
      return configureTileJSONSource(glSource);
    }
  } else if (glSource.type === 'geojson') {
    return configureGeojsonSouce(glSource);
  } else if (glSource.type === 'image') {
    return configureImageSource(glSource);
  } else if (glSource.type === 'vector') {
    return configureMvtSource(glSource);
  }
  return null;
}

/** This is a small bit of trickery that fakes
 *  `getStyleFunction` into rendering only THIS layer.
 */
function fakeStyle(layer) {
  return getStyleFunction({
    version: 8,
    layers: [layer],
  }, layer.source);
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

  componentDidMount() {
    // put the map into the DOM
    this.configureMap();
  }

  /** This will check nextProps and nextState to see
   *  what needs to be updated on the map.
   */
  shouldComponentUpdate(nextProps) {
    // compare the centers
    if (nextProps.map.center[0] !== this.props.map.center[0]
      || nextProps.map.center[1] !== this.props.map.center[1]
      || nextProps.map.zoom !== this.props.map.zoom) {
      this.map.getView().setCenter(nextProps.map.center);
      this.map.getView().setZoom(nextProps.map.zoom);
    }

    // check the sources diff
    const next_sources_version = getVersion(nextProps.map, SOURCE_VERSION_KEY);
    if (this.sourcesVersion !== next_sources_version) {
      // go through and update the sources.
      this.configureSources(nextProps.map.sources, next_sources_version);
    }
    const next_layer_version = getVersion(nextProps.map, LAYER_VERSION_KEY);
    if (this.layersVersion !== next_layer_version) {
      // go through and update the layers.
      this.configureLayers(nextProps.map.sources, nextProps.map.layers, next_layer_version);
    }

    // check the vector sources for data changes
    const src_names = Object.keys(nextProps.map.sources);
    for (let i = 0, ii = src_names.length; i < ii; i++) {
      const src_name = src_names[i];
      const src = this.props.map.sources[src_name];
      if (src && src.type === 'geojson') {
        const version_key = dataVersionKey(src_name);

        if (this.props.map.metadata[version_key] !== nextProps.map.metadata[version_key]) {
          const next_src = nextProps.map.sources[src_name];
          updateGeojsonSource(this.sources[src_name], next_src);
        }
      }
    }

    // This should always return false to keep
    // render() from being called.
    return false;
  }

  /** Convert the GL source definitions into internal
   *  OpenLayers source definitions.
   */
  configureSources(sourcesDef, sourceVersion) {
    this.sourcesVersion = sourceVersion;
    // TODO: Update this to check "diff" configurations
    //       of sources.  Currently, this will only detect
    //       additions and removals.
    let src_names = Object.keys(sourcesDef);
    for (let i = 0, ii = src_names.length; i < ii; i++) {
      const src_name = src_names[i];
      // Add the source because it's not in the current
      //  list of sources.
      if (!(src_name in this.sources)) {
        this.sources[src_name] = configureSource(sourcesDef[src_name]);
      }
    }

    // remove sources no longer there.
    src_names = Object.keys(this.sources);
    for (let i = 0, ii = src_names.length; i < ii; i++) {
      const src_name = src_names[i];
      if (!(src_name in sourcesDef)) {
        // TODO: Remove all layers that are using this source.
        delete this.sources[src_name];
      }
    }
  }

  /** Style the background.
   */
  configureBackground(layer) {
    // TODO: Right now there is not a good way of using
    //       the background-opacity attribute, there is no
    //       DOM-based backgroundOpacity CSS style and applying
    //       opacity to the element makes it all "fade".
    if (layer.paint['background-pattern']) {
      // TODO: We cannot implement the background pattern
      //       until glyphs/symbology has been implemented.
    } else {
      this.mapdiv.style.backgroundColor = layer.paint['background-color'];
    }
  }

  /** Convert a GL-defined to an OpenLayers' layer.
   */
  configureLayer(sourcesDef, layer) {
    const layer_src = sourcesDef[layer.source];

    switch (layer_src.type) {
      case 'raster':
        return new TileLayer({
          source: this.sources[layer.source],
        });
      case 'geojson':
        return new VectorLayer({
          source: this.sources[layer.source],
          style: fakeStyle(layer),
        });
      case 'vector':
        return new VectorTileLayer({
          source: this.sources[layer.source],
          style: fakeStyle(layer),
        });
      case 'image':
        return new ImageLayer({
          source: this.sources[layer.source],
          opacity: layer.paint ? layer.paint['raster-opacity'] : undefined,
        });
      default:
        // pass, let the function return null
    }

    // this didn't work out.
    return null;
  }

  configureLayers(sourcesDef, layersDef, layerVersion) {
    const layer_exists = {};

    // update the internal version counter.
    this.layersVersion = layerVersion;

    // layers is an array.
    for (let i = 0, ii = layersDef.length; i < ii; i++) {
      const layer = layersDef[i];
      const is_visible = layer.layout ? layer.layout.visibility !== 'none' : true;
      layer_exists[layer.id] = true;

      // if the layer is not on the map, create it.
      if (!(layer.id in this.layers)) {
        if (layer.type === 'background') {
          this.configureBackground(layer);
        } else {
          const new_layer = this.configureLayer(sourcesDef, layer);
          new_layer.set('name', layer.id);

          // if the new layer has been defined, add it to the map.
          if (new_layer !== null) {
            this.layers[layer.id] = new_layer;
            this.map.addLayer(this.layers[layer.id]);
          }
        }
      }

      // handle visibility and z-ordering.
      if (layer.id in this.layers) {
        this.layers[layer.id].setVisible(is_visible);
        this.layers[layer.id].setZIndex(i);
      }
    }

    // check for layers which should be removed.
    const layer_ids = Object.keys(this.layers);
    for (let i = 0, ii = layer_ids.length; i < ii; i++) {
      const layer_id = layer_ids[i];
      // if the layer_id was not set to true then
      //  it has been removed the state and needs to be removed
      //  from the map.
      if (layer_exists[layer_id] !== true) {
        this.map.removeLayer(this.layers[layer_id]);
        delete this.layers[layer_id];
      }
    }
  }

  /** Initialize the map */
  configureMap() {
    this.map = new OlMap({
      target: this.mapdiv,
      view: new View({
        center: this.props.map.center,
        zoom: this.props.map.zoom,
      }),
    });

    // when the map moves update the location in the state
    this.map.on('moveend', () => {
      this.props.setView(this.map.getView());
    });

    // bootstrap the map with the current configuration.
    this.configureSources(this.props.map.sources, this.props.map.metadata[SOURCE_VERSION_KEY]);
    this.configureLayers(this.props.map.sources, this.props.map.layers,
                         this.props.map.metadata[LAYER_VERSION_KEY]);
  }

  render() {
    return (
      <div ref={(c) => { this.mapdiv = c; }} className="map" />
    );
  }
}

Map.propTypes = {
  map: PropTypes.shape({
    center: PropTypes.array,
    zoom: PropTypes.number,
    metadata: PropTypes.object,
    layers: PropTypes.array,
    sources: PropTypes.object,
  }),
  setView: PropTypes.func,
};

Map.defaultProps = {
  map: {
    center: [0, 0],
    zoom: 2,
    metadata: {},
    layers: [],
    sources: {},
  },
  setView: () => {
    // swallow event.
  },
};

function mapStateToProps(state) {
  return {
    map: state.map,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setView: (view) => {
      dispatch(setView(view.getCenter(), view.getZoom()));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Map);
