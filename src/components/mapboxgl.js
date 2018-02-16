/*
 * Copyright 2015-present Boundless Spatial Inc., http://boundlessgeo.com
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations
 * under the License.
 */

import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import uuid from 'uuid';
import {connect} from 'react-redux';
import {setView, setBearing} from '../actions/map';
import {setMapSize, setMousePosition, setMapExtent, setResolution, setProjection} from '../actions/mapinfo';
import {getResolutionForZoom, getKey} from '../util';

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {dataVersionKey} from '../reducers/map';
import {INTERACTIONS} from '../constants';
import area from '@turf/area';
import distance from '@turf/distance';
import {setMeasureFeature, clearMeasureFeature} from '../actions/drawing';
import {LAYER_VERSION_KEY, SOURCE_VERSION_KEY, MIN_ZOOM_KEY, MAX_ZOOM_KEY} from '../constants';

import 'mapbox-gl/dist/mapbox-gl.css';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';

const isBrowser = !(
  typeof process === 'object' &&
  String(process) === '[object process]' &&
  !process.browser
);

const mapboxgl = isBrowser ? require('mapbox-gl') : null;

const SIMPLE_SELECT_MODE = 'simple_select';
const DIRECT_SELECT_MODE = 'direct_select';
const STATIC_MODE = 'static';

/** @module components/map
 *
 * @desc Provide a Mapbox GL map which reflects the
 *       state of the Redux store.
 */

/** This variant of getVersion() differs as it allows
 *  for undefined values to be returned.
 * @param {Object} obj The state.map object
 * @param {Object} obj.metadata The state.map.metadata object
 * @param {string} key One of 'bnd:layer-version', 'bnd:source-version', or 'bnd:data-version'.
 *
 * @returns {(number|undefined)} The version number of the given metadata key.
 */
function getVersion(obj, key) {
  if (obj.metadata === undefined) {
    return undefined;
  }
  return obj.metadata[key];
}

export class MapboxGL extends React.Component {

  constructor(props) {
    super(props);
    this.onMapLoad = this.onMapLoad.bind(this);
    this.sourcesVersion = null;
    this.layersVersion = null;

    // popups and their elements are stored as an ID managed hash.
    this.popups = {};
    this.elems = {};
    this.overlays = [];

    this.draw = null;
    this.drawMode = StaticMode;
    this.currentMode = STATIC_MODE;
    this.afterMode = STATIC_MODE;

    // interactions are how the user can manipulate the map,
    //  this tracks any active interaction.
    this.activeInteractions = null;
  }

  componentDidMount() {
    // put the map into the DOM
    this.configureMap();
  }

  componentWillUnmount() {
    if (this.map) {
      this.map.remove();
    }
  }

  /** This will check nextProps and nextState to see
   *  what needs to be updated on the map.
   * @param {Object} nextProps The next properties of this component.
   *
   * @returns {boolean} should the component re-render?
   */
  shouldComponentUpdate(nextProps) {
    // This should always return false to keep
    // render() from being called.
    return false;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.drawing && nextProps.drawing.interaction) {
      this.addDrawIfNeeded();
    }
    // check if the sources or layers diff
    const next_sources_version = getVersion(nextProps.map, SOURCE_VERSION_KEY);
    const next_layer_version = getVersion(nextProps.map, LAYER_VERSION_KEY);
    if (this.sourcesVersion !== next_sources_version || this.layersVersion !== next_layer_version) {
      this.sourcesVersion = next_sources_version;
      this.layersVersion = next_layer_version;
      this.map && this.map.setStyle(nextProps.map);
    }
    // compare the centers
    if (nextProps.map.center !== undefined) {
      // center has not been set yet or differs
      if (this.props.map.center === undefined ||
        (nextProps.map.center[0] !== this.props.map.center[0]
        || nextProps.map.center[1] !== this.props.map.center[1])) {
        this.map && this.map.setCenter(nextProps.map.center);
      }
    }
    // compare the zoom
    if (nextProps.map.zoom !== undefined && (nextProps.map.zoom !== this.props.map.zoom) && this.map) {
      this.map.setZoom(nextProps.map.zoom);
    }
    // compare the rotation
    if (nextProps.map.bearing !== undefined && nextProps.map.bearing !== this.props.map.bearing && this.map) {
      this.map.setBearing(nextProps.map.bearing);
    }
    // check the vector sources for data changes
    const src_names = Object.keys(nextProps.map.sources);
    for (let i = 0, ii = src_names.length; i < ii; i++) {
      const src_name = src_names[i];
      const src = this.props.map.sources[src_name];
      if (src && src.type === 'geojson') {
        const version_key = dataVersionKey(src_name);
        if (this.props.map.metadata !== undefined &&
            this.props.map.metadata[version_key] !== nextProps.map.metadata[version_key] && this.map) {
          const source = this.map.getSource(src_name);
          if (source && typeof source !== 'undefined') {
            source.setData(nextProps.map.sources[src_name].data);
            if (this.draw) {
              if (nextProps.map.sources[src_name].type === 'geojson') {
                nextProps.map.sources[src_name].data.features.forEach((feature) => {
                  this.draw.add(feature);
                });
              }
            }
          }
        }
      }
    }
    // change the current interaction as needed
    if (nextProps.drawing && (nextProps.drawing.interaction !== this.props.drawing.interaction
        || nextProps.drawing.sourceName !== this.props.drawing.sourceName)) {
      this.updateInteraction(nextProps.drawing);
    }
  }

  onMapClick(e) {
    const bbox = [[e.point.x - 5, e.point.y - 5], [e.point.x + 5, e.point.y + 5]];
    const features = this.map.queryRenderedFeatures(bbox);
    const features_promise = new Promise((resolve) => {
      const features_by_layer = {};
      for (let i = 0, ii = features.length; i < ii; ++i) {
        const layer_name = features[i].layer.id;
        if (!features_by_layer[layer_name]) {
          features_by_layer[layer_name] = [];
        }
        features_by_layer[layer_name] = features[i];
      }
      resolve([features_by_layer]);
    });
    // no xy and hms properties here
    const coordinate = {
      0: e.lngLat.lng,
      1: e.lngLat.lat,
    };
    this.props.onClick(this, coordinate, features_promise);
  }

  onMapMoveEnd() {
    this.props.setView(this.map);
  }

  onMouseMove(e) {
    this.props.setMousePosition(e.lngLat);
  }

  onMapLoad() {
    // add the initial popups from the user.
    for (let i = 0, ii = this.props.initialPopups.length; i < ii; i++) {
      this.addPopup(this.props.initialPopups[i]);
    }
    this.updatePopups();
    this.map.off('click', this.onMapLoad);
  }

  addDrawIfNeeded() {
    if (!this.draw) {
      const modes = MapboxDraw.modes;
      if (this.props.drawingModes && this.props.drawingModes.length > 0) {
        this.props.drawingModes.forEach((mode) => {
          modes[mode.name] = mode.mode;
        });
      }
      modes.static = StaticMode;
      const drawOptions = {displayControlsDefault: false, modes: modes, defaultMode: STATIC_MODE};
      this.draw = new MapboxDraw(drawOptions);
      this.map.addControl(this.draw);
    }
  }

  /** Initialize the map */
  configureMap() {
    // initialize the map.
    if (mapboxgl) {
      mapboxgl.accessToken = this.props.mapbox.accessToken;
      this.map = new mapboxgl.Map({
        minZoom: getKey(this.props.map.metadata, MIN_ZOOM_KEY),
        maxZoom: getKey(this.props.map.metadata, MAX_ZOOM_KEY),
        renderWorldCopies: this.props.wrapX,
        container: this.mapdiv,
        style: this.props.map,
      });
    }
    this.sourcesVersion = getVersion(this.props.map, SOURCE_VERSION_KEY);
    this.layersVersion = getVersion(this.props.map, LAYER_VERSION_KEY);
    // when the map moves update the location in the state
    if (this.map) {
      this.props.setSize([this.mapdiv.offsetWidth, this.mapdiv.offsetHeight], this.map);

      this.props.setProjection('EPSG:3857');

      this.map.on('resize', () => {
        this.props.setSize([this.mapdiv.offsetWidth, this.mapdiv.offsetHeight], this.map);
      });

      if (this.props.hover) {
        this.map.on('mousemove', (e) => {
          this.onMouseMove(e);
        });
      }
      this.map.on('moveend', () => {
        this.onMapMoveEnd();
      });
      this.map.on('click', (e) => {
        this.onMapClick(e);
      });
      // this is done after the map loads itself for the first time.
      //  otherwise the map was not always ready for the initial popups.
      if (this.props.initialPopups.length > 0) {
        this.map.on('load', this.onMapLoad);
      }
    }
    // check for any interactions
    if (this.props.drawing && this.props.drawing.interaction && this.map) {
      this.addDrawIfNeeded();
      this.updateInteraction(this.props.drawing);
    }
  }

  /** Callback for finished drawings, converts the event's feature
   *  to GeoJSON and then passes the relevant information on to
   *  this.props.onFeatureDrawn, this.props.onFeatureModified.
   *
   *  @param {string} eventType One of 'drawn', 'modified'.
   *  @param {string} sourceName Name of the geojson source.
   *  @param {Object} collection GeoJSON feature collection.
   *
   */
  onFeatureEvent(eventType, sourceName, collection) {
    if (collection !== undefined) {
      // Pass on feature drawn this map object, the target source,
      //  and the drawn feature.
      if (eventType === 'drawn') {
        this.props.onFeatureDrawn(this, sourceName, collection);
      } else if (eventType === 'modified') {
        this.props.onFeatureModified(this, sourceName, collection);
      }
    }
  }

  getMode(type) {
    if (type === 'Point') {
      return 'draw_point';
    } else if (type === 'LineString') {
      return 'draw_line_string';
    } else if (type === 'Polygon') {
      return 'draw_polygon';
    }
  }

  onDrawCreate(evt, mode, options = {}) {
    this.onFeatureEvent('drawn', this.props.drawing.sourceName, {type: 'FeatureCollection', features: evt.features});
    const draw = this.draw;
    window.setTimeout(function() {
      // allow to draw more features
      draw.changeMode(mode, options);
    }, 0);
  }
  onDrawModify(evt, mode, options = {}) {
    this.onFeatureEvent('modified', this.props.drawing.sourceName, {type: 'FeatureCollection', features: evt.features});
    const draw = this.draw;
    window.setTimeout(function() {
      draw.changeMode(mode, options);
    }, 0);
  }

  onDrawRender(evt) {
    const collection = this.draw.getAll();
    if (collection.features.length > 0) {
      this.props.setMeasureGeometry(collection.features[0].geometry);
    }
  }

  setMode(defaultMode, customMode) {
    return customMode ? customMode : defaultMode;
  }

  optionsForMode(mode, evt) {
    if (mode === DIRECT_SELECT_MODE) {
      return {featureId: evt.features[0].id};
    }
    return {};
  }

  modeOptions(modeOptions) {
    return modeOptions ? modeOptions : {};
  }

  updateInteraction(drawingProps) {
    // this assumes the interaction is different,
    //  so the first thing to do is clear out the old interaction
    if (this.activeInteractions !== null) {
      for (let i = 0, ii = this.activeInteractions.length; i < ii; i++) {
        this.map.removeControl(this.activeInteractions[i]);
      }
      this.activeInteractions = null;
    }
    if (INTERACTIONS.drawing.includes(drawingProps.interaction)) {
      this.currentMode = this.setMode(this.getMode(drawingProps.interaction), drawingProps.currentMode);
      this.afterMode = this.setMode(this.currentMode, drawingProps.afterMode);
      this.draw.changeMode(this.currentMode, this.modeOptions(drawingProps.currentModeOptions));
    } else if (INTERACTIONS.modify === drawingProps.interaction || INTERACTIONS.select === drawingProps.interaction) {
      this.currentMode = this.setMode(SIMPLE_SELECT_MODE, drawingProps.currentMode);
      this.draw.changeMode(this.currentMode, this.modeOptions(drawingProps.currentModeOptions));
      this.afterMode = this.setMode(DIRECT_SELECT_MODE, drawingProps.afterMode);
    } else if (INTERACTIONS.measuring.includes(drawingProps.interaction)) {
      // clear the previous measure feature.
      this.props.clearMeasureFeature();
      // The measure interactions are the same as the drawing interactions
      // but are prefixed with "measure:"
      const measureType = drawingProps.interaction.split(':')[1];
      this.currentMode = this.setMode(this.getMode(measureType), drawingProps.currentMode);
      this.draw.changeMode(this.currentMode, this.modeOptions(drawingProps.currentModeOptions));
      if (!this.addedMeasurementListener) {
        this.map.on('draw.render', (evt) => {
          this.onDrawRender(evt);
        });
        this.addedMeasurementListener = true;
      }
    } else {
      this.draw.changeMode(STATIC_MODE);
    }
    if (drawingProps.sourceName) {
      const drawCreate = (evt) => {
        this.onDrawCreate(evt, this.afterMode, this.optionsForMode(this.afterMode, evt));
      };
      const drawModify =  (evt) => {
        this.onDrawModify(evt, this.afterMode, this.optionsForMode(this.afterMode, evt));
      };
      this.map.off('draw.create', drawCreate);
      this.map.on('draw.create', drawCreate);
      this.map.off('draw.update', drawModify);
      this.map.on('draw.update', drawModify);
    }

    if (this.activeInteractions) {
      for (let i = 0, ii = this.activeInteractions.length; i < ii; i++) {
        this.map.addControl(this.activeInteractions[i]);
      }
    }

  }

  addPopup(popup) {
    const id = uuid.v4();
    const elem = document.createElement('div');
    elem.setAttribute('class', 'sdk-mapbox-gl-popup');
    let overlay;
    if (mapboxgl) {
      overlay = new mapboxgl.Marker(elem);
      // set the popup id so we can match the component
      // to the overlay.
      overlay.popupId = id;
      const coord = popup.props.coordinate;
      const lngLat = new mapboxgl.LngLat(coord['0'], coord['1']);
      this.overlays.push(overlay.setLngLat(lngLat).addTo(this.map));
    }
    const self = this;
    // render the element into the popup's DOM.
    ReactDOM.render(popup, elem, (function addInstance() {
      self.popups[id] = this;
      self.elems[id] = elem;
      this.setMap(self);
    }));

    const size = ReactDOM.findDOMNode(elem).getBoundingClientRect();
    const yTransform = size.height / 2 + 11;
    const xTransform = size.width / 2 - 48;
    if (overlay) {
      overlay.setOffset([xTransform, -yTransform]);
    }
  }

  updatePopups() {
    const overlays = this.overlays;
    const overlays_to_remove = [];

    overlays.forEach((overlay) => {
      const id = overlay.popupId;
      if (this.popups[id] && this.popups[id].state.closed !== false) {
        this.popups[id].setMap(null);
        // mark this for removal
        overlays_to_remove.push(overlay);
        // umount the component from the DOM
        ReactDOM.unmountComponentAtNode(this.elems[id]);
        // remove the component from the popups hash
        delete this.popups[id];
        delete this.elems[id];
      }
    });

    // remove the old/closed overlays from the map.
    for (let i = 0, ii = overlays_to_remove.length; i < ii; i++) {
      overlays_to_remove[i].remove();
    }
  }

  render() {
    let className = 'sdk-map';
    if (this.props.className) {
      className = `${className} ${this.props.className}`;
    }
    return (
      <div style={this.props.style} ref={(c) => {
        this.mapdiv = c;
      }} className={className}>
        <div className="controls">
          {this.props.children}
        </div>
      </div>
    );
  }
}

MapboxGL.propTypes = {
  /** Should we wrap the world? If yes, data will be repeated in all worlds. */
  wrapX: PropTypes.bool,
  /** Should we handle map hover to show mouseposition? */
  hover: PropTypes.bool,
  /** Map configuration, modelled after the Mapbox Style specification. */
  map: PropTypes.shape({
    /** Center of the map. */
    center: PropTypes.array,
    /** Zoom level of the map. */
    zoom: PropTypes.number,
    /** Rotation of the map in degrees. */
    bearing: PropTypes.number,
    /** Extra information about the map. */
    metadata: PropTypes.object,
    /** List of map layers. */
    layers: PropTypes.array,
    /** List of layer sources. */
    sources: PropTypes.object,
    /** Sprite sheet to use. */
    sprite: PropTypes.string,
  }),
  /** Child components. */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  /** Mapbox specific configuration. */
  mapbox: PropTypes.shape({
    /** Base url to use for mapbox:// substitutions. */
    baseUrl: PropTypes.string,
    /** Access token for the Mapbox account to use. */
    accessToken: PropTypes.string,
  }),
  /** Style configuration object. */
  style: PropTypes.object,
  /** Css className. */
  className: PropTypes.string,
  /** Drawing specific configuration. */
  drawing: PropTypes.shape({
    /** Current interaction to use for drawing. */
    interaction: PropTypes.string,
    /** Current source name to use for drawing. */
    sourceName: PropTypes.string,
  }),
  /** Initial popups to display in the map. */
  initialPopups: PropTypes.arrayOf(PropTypes.object),
  /** Initial drawing modes that are available for drawing */
  drawingModes: PropTypes.arrayOf(PropTypes.object),
  /** setView callback function, triggered on moveend. */
  setView: PropTypes.func,
  /** setMousePosition callback function, triggered on mousemove. */
  setMousePosition: PropTypes.func,
  /** setProjection callback function. */
  setProjection: PropTypes.func,
  /** Should we include features when the map is clicked? */
  includeFeaturesOnClick: PropTypes.bool,
  /** onClick callback function, triggered on singleclick. */
  onClick: PropTypes.func,
  /** onFeatureDrawn callback, triggered on drawend of the draw interaction. */
  onFeatureDrawn: PropTypes.func,
  /** onFeatureModified callback, triggered on modifyend of the modify interaction. */
  onFeatureModified: PropTypes.func,
  /** setMeasureGeometry callback, called when the measure geometry changes. */
  setMeasureGeometry: PropTypes.func,
  /** clearMeasureFeature callback, called when the measure feature is cleared. */
  clearMeasureFeature: PropTypes.func,
};

MapboxGL.defaultProps = {
  wrapX: true,
  hover: true,
  map: {
    center: [0, 0],
    zoom: 2,
    bearing: 0,
    metadata: {},
    layers: [],
    sources: {},
    sprite: undefined,
  },
  drawing: {
    interaction: null,
    source: null,
  },
  mapbox: {
    baseUrl: '',
    accessToken: '',
  },
  initialPopups: [],
  setView: () => {
    // swallow event.
  },
  setSize: () => {},
  setMousePosition: () => {
    // swallow event.
  },
  setProjection: () => {},
  includeFeaturesOnClick: false,
  onClick: () => {
  },
  onFeatureDrawn: () => {
  },
  onFeatureModified: () => {
  },
  setMeasureGeometry: () => {
  },
  clearMeasureFeature: () => {
  },
};

function mapStateToProps(state) {
  return {
    map: state.map,
    drawing: state.drawing,
    print: state.print,
    mapbox: state.mapbox,
  };
}

export function getMapExtent(map) {
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return [sw.lng, sw.lat, ne.lng, ne.lat];
}

function mapDispatchToProps(dispatch) {
  return {
    updateLayer: (layerId, layerConfig) => {
    },
    setView: (map) => {
      const center = map.getCenter().toArray();
      const bearing = map.getBearing();
      const zoom = map.getZoom();
      dispatch(setView(center, zoom));
      dispatch(setBearing(bearing));
      dispatch(setMapExtent(getMapExtent(map)));
      dispatch(setResolution(getResolutionForZoom(zoom, 'EPSG:3857')));
    },
    setSize: (size, map) => {
      dispatch(setMapSize(size));
      dispatch(setMapExtent(getMapExtent(map)));
    },
    setProjection: (projection) => {
      dispatch(setProjection(projection));
    },
    setMeasureGeometry: (geom) => {
      const segments = [];
      if (geom.type === 'LineString') {
        for (let i = 0, ii = geom.coordinates.length - 1; i < ii; i++) {
          const a = geom.coordinates[i];
          const b = geom.coordinates[i + 1];
          segments.push(distance(a, b));
        }
      } else if (geom.type === 'Polygon' && geom.coordinates.length > 0) {
        segments.push(area(geom));
      }
      dispatch(setMeasureFeature({
        type: 'Feature',
        properties: {},
        geometry: geom,
      }, segments));
    },
    clearMeasureFeature: () => {
      dispatch(clearMeasureFeature());
    },
    setMousePosition(lngLat) {
      dispatch(setMousePosition(lngLat));
    },
  };
}

// Ensure that withRef is set to true so getWrappedInstance will return the Map.
export default connect(mapStateToProps, mapDispatchToProps, undefined, {withRef: true})(MapboxGL);
