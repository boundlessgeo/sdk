/** Provide an OpenLayers map which reflects the
 *  state of the  store.
 */

import uuid from 'uuid';

import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import getStyleFunction from 'mapbox-to-ol-style';

import OlMap from 'ol/map';
import View from 'ol/view';
import Overlay from 'ol/overlay';

import Proj from 'ol/proj';
import Coordinate from 'ol/coordinate';

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

import DrawInteraction from 'ol/interaction/draw';
import ModifyInteraction from 'ol/interaction/modify';
import SelectInteraction from 'ol/interaction/select';

import { setView } from '../actions/map';
import { INTERACTIONS, LAYER_VERSION_KEY, SOURCE_VERSION_KEY } from '../constants';
import { dataVersionKey } from '../reducers/map';

import ClusterSource from '../source/cluster';

import { jsonEquals, getLayerById, getMin, getMax } from '../util';


const GEOJSON_FORMAT = new GeoJsonFormat();

/** This variant of getVersion differs as it allows
 *  for undefined values to be returned.
 */
function getVersion(obj, key) {
  if (obj.metadata === undefined) {
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

  let vector_src = olSource;

  // if the source is clustered then
  //  the actual data is stored on the source's source.
  if (glSource.cluster) {
    vector_src = olSource.getSource();

    if (glSource.clusterRadius !== olSource.getDistance()) {
      olSource.setDistance(glSource.clusterRadius);
    }
  }
  // clear the layer WITHOUT dispatching remove events.
  vector_src.clear(true);
  // bulk load the feature data.
  vector_src.addFeatures(features);
}

/** Create a vector source based on a
 *  MapBox GL styles definition.
 *
 *  @param glSource a MapBox GL styles defintiion of the source.
 *
 * @returns ol.source.vector instance.
 */
function configureGeojsonSource(glSource) {
  const vector_src = new VectorSource({
    useSpatialIndex: true,
    wrapX: false,
  });

  // GeoJson sources can be clustered but OpenLayers
  // uses a special source type for that. This handles the
  // "switch" of source-class.
  let new_src = vector_src;
  if (glSource.cluster) {
    new_src = new ClusterSource({
      source: vector_src,
      // default the distance to 50 as that's what
      //  is specified by MapBox.
      distance: glSource.clusterRadius ? glSource.clusterRadius : 50,
    });
  }

  // seed the vector source with the first update
  //  before returning it.
  updateGeojsonSource(new_src, glSource);
  return new_src;
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
    return configureGeojsonSource(glSource);
  } else if (glSource.type === 'image') {
    return configureImageSource(glSource);
  } else if (glSource.type === 'vector') {
    return configureMvtSource(glSource);
  }
  return null;
}

function getResolutionForZoom(map, zoom) {
  const view = map.getView();
  const max_rez = view.getMaxResolution();
  return view.constrainResolution(max_rez, zoom - view.getMinZoom());
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

    // popups are stored as an ID managed hash.
    this.popups = {};

    // interactions are how the user can manipulate the map,
    //  this tracks any active interaction.
    this.activeInteractions = null;
  }

  componentDidMount() {
    // put the map into the DOM
    this.configureMap();

    // check to see if ther are any sprites in the state.
    this.configureSprites(this.props.map);
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

    // do a quick sweep to remove any popups
    //  that have been closed.
    this.updatePopups();

    // update the sprites, this could happen BEFORE the map
    if (this.props.map.sprites !== nextProps.map.sprites) {
      this.configureSprites(nextProps.map);
    }

    // change the current interaction as needed
    if (nextProps.drawing && (nextProps.drawing.interaction !== this.props.drawing.interaction
        || nextProps.drawing.sourceName !== this.props.drawing.sourceName)) {
      this.updateInteraction(nextProps.drawing);
    }

    // This should always return false to keep
    // render() from being called.
    return false;
  }

  /** Callback for finished drawings, converts the event's feature
   *  to GeoJSON and then passes the relevant information on to
   *  this.props.onFeatureDrawn.
   */
  onFeatureEvent(eventType, sourceName, feature) {
    if (feature !== undefined) {
      // convert the feature to GeoJson
      const proposed_geojson = GEOJSON_FORMAT.writeFeatureObject(feature, {
        dataProjection: 'EPSG:4326',
        featureProjection: this.map.getView().getProjection(),
      });

      // Pass on feature drawn this map object, the target source,
      //  and the drawn feature.
      if (eventType === 'drawn') {
        this.props.onFeatureDrawn(this, sourceName, proposed_geojson);
      } else if (eventType === 'modified') {
        this.props.onFeatureModified(this, sourceName, proposed_geojson);
      } else if (eventType === 'selected') {
        this.props.onFeatureSelected(this, sourceName, proposed_geojson);
      }
    }
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

      // Check to see if there was a clustering change.
      // Because OpenLayers requires a *different* source to handle clustering,
      // this handles update the named source and then subsequently updating
      // the layers.
      const src = this.props.map.sources[src_name];
      if (src.cluster !== sourcesDef[src_name].cluster
          || src.clusterRadius !== sourcesDef[src_name].clusterRadius) {
        // reconfigure the source for clustering.
        this.sources[src_name] = configureSource(sourcesDef[src_name]);
        // tell all the layers about it.
        this.updateLayerSource(src_name, this.props.map.layers);
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

  /** This is a small bit of trickery that fakes
   *  `getStyleFunction` into rendering only THIS layer.
   */
  fakeStyle(layer) {
    // getStyleFunction(glStyle, source, resolutions, spriteData, spriteImageUrl, fonts) {
    return getStyleFunction({
      version: 8,
      layers: [layer],
    }, layer.source, undefined, this.spriteData, this.spriteImageUrl);
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
          style: this.fakeStyle(layer),
        });
      case 'vector':
        return new VectorTileLayer({
          source: this.sources[layer.source],
          style: this.fakeStyle(layer),
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

  updateLayerSource(sourceName, layersDef) {
    for (let i = 0, ii = layersDef.length; i < ii; i++) {
      if (layersDef[i].source === sourceName) {
        this.layers[layersDef[i].id].setSource(this.sources[sourceName]);
      }
    }
  }

  cleanupLayers(layersDef) {
    const layer_exists = {};
    for (let i = 0, ii = layersDef.length; i < ii; i++) {
      layer_exists[layersDef[i].id] = true;
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

  configureLayers(sourcesDef, layersDef, layerVersion) {
    // update the internal version counter.
    this.layersVersion = layerVersion;

    // layers is an array.
    for (let i = 0, ii = layersDef.length; i < ii; i++) {
      let layer = layersDef[i];

      // check to see if this layer references another.
      if (layer.ref !== undefined) {
        // find the source layer
        let layer_def = null;
        for (let j = 0, jj = layersDef.length; j < jj && layer_def === null; j++) {
          if (layersDef[j].id === layer.ref) {
            // layersDef[j] will contain objects which need to be
            // copied by value and not by reference which is why
            // Object.assign is not used.
            const src_layer = JSON.parse(JSON.stringify(layersDef[j]));
            // now use Object.assign to do the mixin.
            // src_layer is a new object and the original layer
            //  is not being mutated here.
            layer_def = Object.assign(src_layer, layer);
          }
        }

        // change the working definition of the layer.
        layer = layer_def;
      }


      // if the layer is not on the map, create it.
      if (layer !== null && !(layer.id in this.layers)) {
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

      // handle updating the layer.
      if (layer !== null && layer.id in this.layers) {
        const ol_layer = this.layers[layer.id];
        const layer_src = sourcesDef[layer.source];

        // check for min/max zoom changes on sources and layers
        const maxzoom = getMin(layer_src.maxzoom, layer.maxzoom);
        if (maxzoom) {
          const minResolution = getResolutionForZoom(this.map, maxzoom);
          ol_layer.setMinResolution(minResolution);
        }

        const minzoom = getMax(layer_src.minzoom, layer.minzoom);
        if (minzoom) {
          const maxResolution = getResolutionForZoom(this.map, minzoom);
          ol_layer.setMaxResolution(maxResolution);
        }

        // check for style changes, the OL style
        // is defined by filter and paint elements.
        const current_layer = getLayerById(this.props.map.layers, layer.id);
        if (current_layer !== null) {
          const diff_filter = !jsonEquals(current_layer.filter, layer.filter);
          const diff_paint = !jsonEquals(current_layer.paint, layer.paint);
          if (diff_filter || diff_paint) {
            ol_layer.setStyle(this.fakeStyle(layer));
          }
        }

        // check for visibility changes.
        const is_visible = layer.layout ? layer.layout.visibility !== 'none' : true;
        ol_layer.setVisible(is_visible);

        // ensure the display order hasn't changed.
        ol_layer.setZIndex(i);
      }
    }

    // clean up layers which should be removed.
    this.cleanupLayers(layersDef);
  }

  configureSprites(map) {
    if (map.sprites === undefined) {
      // return a resolved promise.
      return (new Promise((resolve) => {
        resolve();
      }));
    }

    return fetch(`${map.sprites}.json`)
      .then(r => r.json())
      .then((spriteJson) => {
        // store the spite data for later styling.
        this.spriteData = spriteJson;
        this.spriteImageUrl = `${map.sprites}.png`;

        // restyle all the symbol layers.
        for (let i = 0, ii = map.layers.length; i < ii; i++) {
          const gl_layer = map.layers[i];
          if (gl_layer.type === 'symbol') {
            this.layers[gl_layer.id].setStyle(this.fakeStyle(gl_layer));
          }
        }
      });
  }

  updatePopups() {
    const overlays = this.map.getOverlays();
    const overlays_to_remove = [];

    overlays.forEach((overlay) => {
      const id = overlay.get('popupId');
      if (this.popups[id].state.closed !== false) {
        // mark this for removal
        overlays_to_remove.push(overlay);
        // umount the component from the DOM
        ReactDOM.unmountComponentAtNode(overlay.getElement());
        // remove the component from the popups hash
        delete this.popups[id];
      }
    });

    // remove the old/closed overlays from the map.
    for (let i = 0, ii = overlays_to_remove.length; i < ii; i++) {
      this.map.removeOverlay(overlays_to_remove[i]);
    }
  }

  removePopup(popupId) {
    this.popups[popupId].close();
    this.updatePopups();
  }

  /** Add a Popup to the map.
   *
   *  @param {SdkPopup} popup - Instance of SdkPopop or a subclass.
   *  @param {boolean}  [silent] - When true, do not call updatePopups after adding.
   *
   */
  addPopup(popup, silent = false) {
    // each popup uses a unique id to relate what is
    //  in openlayers vs what we have in the react world.
    const id = uuid.v4();

    const elem = document.createElement('div');

    const overlay = new Overlay({
      // create an empty div element for the Popup
      element: elem,
      // allow events to pass through, using the default stopevent
      // container does not allow react to check for events.
      stopEvent: false,
      // put the popup into view
      autoPan: true,
      autoPanAnimation: {
        duration: 250,
      },
    });

    // Editor's note:
    // I hate using the self = this construction but
    //  there were few options when needing to get the
    //  instance of the react component using the callback
    //  method recommened by eslint and the react team.
    // See here:
    // - https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-render-return-value.md
    const self = this;
    // render the element into the popup's DOM.
    ReactDOM.render(popup, elem, (function addInstance() {
      self.popups[id] = this;
    }));

    // move the element up a level to ensure
    //  the rects are calculated correctly.
    overlay.setElement(elem.firstChild);

    // set the popup id so we can match the component
    //  to the overlay.
    overlay.set('popupId', id);

    // Add the overlay to the map,
    this.map.addOverlay(overlay);

    // reset the position after the popup has been added to the map.
    // assumes the popups coordinate is 4326
    const wgs84 = [popup.props.coordinate[0], popup.props.coordinate[1]];
    const xy = Proj.transform(wgs84, 'EPSG:4326', this.map.getView().getProjection());
    overlay.setPosition(xy);

    // do not trigger an update if silent is
    //  set to true.  Useful for bulk popup additions.
    if (silent !== true) {
      this.updatePopups();
    }
  }

  /** Initialize the map */
  configureMap() {
    this.map = new OlMap({
      target: this.mapdiv,
      logo: false,
      view: new View({
        center: this.props.map.center,
        zoom: this.props.map.zoom,
      }),
    });


    // when the map moves update the location in the state
    this.map.on('moveend', () => {
      this.props.setView(this.map.getView());
    });

    // when the map is clicked, handle the event.
    this.map.on('singleclick', (evt) => {
      // React listens to events on the document, OpenLayers places their
      // event listeners on the element themselves. The only element
      // the map should care to listen to is the actual rendered map
      // content. This work-around allows the popups and React-based
      // controls to be placed on the ol-overlaycontainer instead of
      // ol-overlaycontainer-stop-event

      // eslint-disable-next-line no-underscore-dangle
      if (this.map.getRenderer().canvas_ === evt.originalEvent.target) {
        const map_prj = this.map.getView().getProjection();

        // if includeFeaturesOnClick is true then query for the
        //  features on the map.
        const click_features = [];
        if (this.props.includeFeaturesOnClick) {
          this.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
            // ship the working projection for the features back to the
            //  caller as 4326 for consistency sake.
            click_features.push(GEOJSON_FORMAT.writeFeatureObject(feature, {
              featureProjection: map_prj,
              dataProjection: 'EPSG:4326',
            }));
          });
        }

        // ensure the coordinate is also in 4326
        const pt = Proj.transform(evt.coordinate, map_prj, 'EPSG:4326');
        const coordinate = {
          0: pt[0],
          1: pt[1],
          xy: evt.coordinate,
          hms: Coordinate.toStringHDMS(pt),
        };

        // send the clicked-on coordinate and the list of features
        this.props.onClick(this, coordinate, click_features);
      }
    });


    // bootstrap the map with the current configuration.
    this.configureSources(this.props.map.sources, this.props.map.metadata[SOURCE_VERSION_KEY]);
    this.configureLayers(this.props.map.sources, this.props.map.layers,
                         this.props.map.metadata[LAYER_VERSION_KEY]);

    // this is done after the map composes itself for the first time.
    //  otherwise the map was not always ready for the initial popups.
    this.map.once('postcompose', () => {
      // add the initial popups from the user.
      for (let i = 0, ii = this.props.initialPopups.length; i < ii; i++) {
        // set silent to true since updatePopups is called after the loop
        this.addPopup(this.props.initialPopups[i], true);
      }

      this.updatePopups();
    });
  }

  updateInteraction(drawingProps) {
    // this assumes the interaction is different,
    //  so the first thing to do is clear out the old interaction
    if (this.activeInteractions !== null) {
      for (let i = 0, ii = this.activeInteractions.length; i < ii; i++) {
        this.map.removeInteraction(this.activeInteractions[i]);
      }
      this.activeInteractions = null;
    }

    if (drawingProps.interaction === INTERACTIONS.modify) {
      const select = new SelectInteraction({
        wrapX: false,
      });

      const modify = new ModifyInteraction({
        features: select.getFeatures(),
      });

      modify.on('modifyend', (evt) => {
        this.onFeatureEvent('modified', drawingProps.sourceName, evt.features.item(0));
      });

      this.activeInteractions = [select, modify];
    } else if (drawingProps.interaction === INTERACTIONS.select) {
      // TODO: Select is typically a single-feature affair but there
      //       should be support for multiple feature selections in the future.
      const select = new SelectInteraction({
        wrapX: false,
        layers: (layer) => {
          const layer_src = this.sources[drawingProps.sourceName];
          return (layer.getSource() === layer_src);
        },
      });

      select.on('select', () => {
        this.onFeatureEvent('selected', drawingProps.sourcename, select.getFeatures().item(0));
      });

      this.activeInteractions = [select];
    } else if (INTERACTIONS.drawing.includes(drawingProps.interaction)) {
      const draw = new DrawInteraction({
        type: drawingProps.interaction,
      });

      draw.on('drawend', (evt) => {
        this.onFeatureEvent('drawn', drawingProps.sourceName, evt.feature);
      });

      this.activeInteractions = [draw];
    }

    if (this.activeInteractions) {
      for (let i = 0, ii = this.activeInteractions.length; i < ii; i++) {
        this.map.addInteraction(this.activeInteractions[i]);
      }
    }
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
    sprites: PropTypes.string,
  }),
  drawing: PropTypes.shape({
    interaction: PropTypes.string,
    sourceName: PropTypes.string,
  }),
  initialPopups: PropTypes.arrayOf(PropTypes.object),
  setView: PropTypes.func,
  includeFeaturesOnClick: PropTypes.bool,
  onClick: PropTypes.func,
  onFeatureDrawn: PropTypes.func,
  onFeatureModified: PropTypes.func,
  onFeatureSelected: PropTypes.func,
};

Map.defaultProps = {
  map: {
    center: [0, 0],
    zoom: 2,
    metadata: {},
    layers: [],
    sources: {},
    sprites: undefined,
  },
  drawing: {
    interaction: null,
    source: null,
  },
  initialPopups: [],
  setView: () => {
    // swallow event.
  },
  includeFeaturesOnClick: false,
  onClick: () => {
  },
  onFeatureDrawn: () => {
  },
  onFeatureModified: () => {
  },
  onFeatureSelected: () => {
  },
};

function mapStateToProps(state) {
  return {
    map: state.map,
    drawing: state.drawing,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setView: (view) => {
      dispatch(setView(view.getCenter(), view.getZoom()));
    },
  };
}

// Ensure that withRef is set to true so getWrappedInstance will return the Map.
export default connect(mapStateToProps, mapDispatchToProps, undefined, { withRef: true })(Map);
