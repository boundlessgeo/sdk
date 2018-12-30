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
import {getResolutionForZoom, getKey, optionalEquals} from '../util';
import MapCommon, {MapRender} from './map-common';

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

/** @module components/mapboxgl
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

/** MapboxGL based renderer class.
 */
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

    this.render = MapRender.bind(this);
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

  componentDidUpdate(prevProps) {
    if (this.props.drawing && this.props.drawing.interaction) {
      this.addDrawIfNeeded();
    }
    // check if the sources or layers diff
    const next_sources_version = getVersion(this.props.map, SOURCE_VERSION_KEY);
    const next_layer_version = getVersion(this.props.map, LAYER_VERSION_KEY);
    if (this.sourcesVersion !== next_sources_version || this.layersVersion !== next_layer_version) {
      this.sourcesVersion = next_sources_version;
      this.layersVersion = next_layer_version;
      this.map && this.map.setStyle(this.props.map);
    }
    // compare the centers
    if (this.props.map.center !== undefined) {
      // center has not been set yet or differs
      if (prevProps.map.center === undefined ||
        (this.props.map.center[0] !== prevProps.map.center[0]
        || this.props.map.center[1] !== prevProps.map.center[1])) {
        this.map && this.map.setCenter(this.props.map.center);
      }
    }
    // compare the zoom
    if (this.props.map.zoom !== undefined && (this.props.map.zoom !== prevProps.map.zoom) && this.map) {
      this.map.setZoom(this.props.map.zoom);
    }
    // compare the rotation
    if (this.props.map.bearing !== undefined && this.props.map.bearing !== prevProps.map.bearing && this.map) {
      this.map.setBearing(this.props.map.bearing);
    }
    // check the vector sources for data changes
    const src_names = Object.keys(this.props.map.sources);
    for (let i = 0, ii = src_names.length; i < ii; i++) {
      const src_name = src_names[i];
      const src = prevProps.map.sources[src_name];
      if (src && src.type === 'geojson') {
        const version_key = dataVersionKey(src_name);
        if (prevProps.map.metadata !== undefined &&
            prevProps.map.metadata[version_key] !== this.props.map.metadata[version_key] && this.map) {
          const source = this.map.getSource(src_name);
          if (source !== undefined) {
            source.setData(this.props.map.sources[src_name].data);
          }
        }
      }
    }
    // trigger a resize event when the size has changed or a redraw is requested.
    if (!optionalEquals(this.props, prevProps, 'mapinfo', 'size')
        || !optionalEquals(this.props, prevProps, 'mapinfo', 'requestedRedraws')) {
      this.map.resize();
    }

    // change the current interaction as needed
    if (this.props.drawing && (this.props.drawing.interaction !== prevProps.drawing.interaction
        || this.props.drawing.sourceName !== prevProps.drawing.sourceName)) {
      this.updateInteraction(this.props.drawing);
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
    const center = this.map.getCenter().toArray();
    const bearing = this.map.getBearing();
    const zoom = this.map.getZoom();

    const view = {
      center,
      zoom,
      bearing,
      extent: getMapExtent(this.map),
      resolution: getResolutionForZoom(zoom, this.props.projection),
    };

    this.props.setView(view);
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
        interactive: this.props.interactive,
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

      this.props.setProjection(this.props.projection);

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

  addFeaturesToDrawForSource(sourceName) {
    if (this.draw) {
      this.draw.deleteAll();
      if (this.props.map.sources[sourceName] && this.props.map.sources[sourceName].data && this.props.map.sources[sourceName].data.features) {
        this.props.map.sources[sourceName].data.features.forEach((feature) => {
          this.draw.add(feature);
        });
      }
    }
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
      this.addFeaturesToDrawForSource(drawingProps.sourceName);
      this.currentMode = this.setMode(this.getMode(drawingProps.interaction), drawingProps.currentMode);
      this.afterMode = this.setMode(this.currentMode, drawingProps.afterMode);
      this.draw.changeMode(this.currentMode, this.modeOptions(drawingProps.currentModeOptions));
    } else if (INTERACTIONS.modify === drawingProps.interaction || INTERACTIONS.select === drawingProps.interaction) {
      this.addFeaturesToDrawForSource(drawingProps.sourceName);
      this.currentMode = this.setMode(SIMPLE_SELECT_MODE, drawingProps.currentMode);
      this.draw.changeMode(this.currentMode, this.modeOptions(drawingProps.currentModeOptions));
      this.afterMode = this.setMode(DIRECT_SELECT_MODE, drawingProps.afterMode);
    } else if (INTERACTIONS.measuring.includes(drawingProps.interaction)) {
      this.addFeaturesToDrawForSource(drawingProps.sourceName);
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
      if (this.draw) {
        this.draw.changeMode(STATIC_MODE);
      }
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
}

MapboxGL.propTypes = {
  ...MapCommon.propTypes,
  /** Initial drawing modes that are available for drawing */
  drawingModes: PropTypes.arrayOf(PropTypes.object),
};

MapboxGL.defaultProps = {
  ...MapCommon.defaultProps,
};

function mapStateToProps(state) {
  return {
    map: state.map,
    drawing: state.drawing,
    print: state.print,
    mapbox: state.mapbox,
  };
}

/** Get the extent for the map.
 *
 *  @param {MapboxGLMap} map - The MapboxGL Map instance.
 *
 *  @return {Array} of minx, miny, maxx, maxy
 */
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
    setView: (view) => {
      dispatch(setView(view.center, view.zoom));
      dispatch(setBearing(view.bearing));
      dispatch(setMapExtent(view.extent));
      dispatch(setResolution(view.resolution));
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

/** Export the connected class by default.
 */
export default connect(mapStateToProps, mapDispatchToProps, undefined, {forwardRef: true})(MapboxGL);
