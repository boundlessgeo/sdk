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

import fetch from 'isomorphic-fetch';

import { Component } from 'react';
import { connect } from 'react-redux';

import WfsFormat from 'ol/format/wfs';
import GeoJsonFormat from 'ol/format/geojson';
import Projection from 'ol/proj/projection';
import Proj from 'ol/proj';

import { finishedAction } from '../actions/wfs';

import { jsonClone } from '../util';
import { WFS } from '../action-types';

/** @module components/wfs
 * @desc Provides a component which will respond to WFS updates.
 */
class WfsController extends Component {
  constructor(props) {
    super(props);
    this.pendingActions = {};

    this.wfs_format = new WfsFormat();

    this.wfs_proj = new Projection({
      code: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
      axisOrientation: 'enu',
    });
    Proj.addEquivalentProjections([Proj.get('EPSG:4326'), this.wfs_proj]);
  }

  /** Runs the WFS request.
   * @param {Object} props WfsController component's props.
   * @param {string} id The WFS action to run.
   */
  execute(props, id) {
    // only act if the action is not already pending.
    if (this.pendingActions[id] === undefined) {
      // copy the action
      const action = Object.assign({}, props.actions[id]);

      // add it to the queue
      this.pendingActions[id] = action;

      const src = props.sources[action.sourceName];

      // clone the feature, as GeoJSON features have a lot of
      //  depth this ensures all the sub-objects are cloned reasonably.
      const json_feature = jsonClone(action.feature);
      delete json_feature.properties['bbox'];

      let geom_name = src.geometryName ? src.geometryName : 'geometry';
      const geojson_format = new GeoJsonFormat({geometryName: geom_name});
      const feature = geojson_format.readFeature(json_feature, {
        dataProjection: 'EPSG:4326',
        featureProjection: this.wfs_proj,
      });

      const actions = {};
      actions[action.type] = [feature];

      const options = {
        featureNS: src.featureNS,
        featurePrefix: src.featurePrefix,
        featureType: src.typeName,
        srsName: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
      };

      // convert this to a WFS call.
      const xml = this.wfs_format.writeTransaction(
        actions[WFS.INSERT],
        actions[WFS.UPDATE],
        actions[WFS.DELETE],
        options);

      // convert the XML to a string.
      let payload = (new XMLSerializer()).serializeToString(xml);

      // get the target_url from the service
      const target_url = src.onlineResource;

      // attempt the action,
      fetch(target_url, {
        method: 'POST',
        body: payload,
      }).then((response) => {
        if (response.ok) {
          return response.text();
        } else {
          throw Error(response.statusText);
        }
      }).then(text => (new window.DOMParser()).parseFromString(text, 'text/xml'))
        .then(data  => {
        // A 200 does not necessarily mean the
        //  request was successful.  This attempts to
        //  parse the transaction response and then passes
        //  it to onFinishTransaction. Handling is left to the
        //  user.
        if (data.documentElement.localName === 'ExceptionReport') {
          const exceptionNode = data.getElementsByTagNameNS('http://www.opengis.net/ows', 'ExceptionText');
          throw Error(exceptionNode.item(0).textContent);
        } else {
          const wfs_response = this.wfs_format.readTransactionResponse(data);

          // ensure the action is removed from the state
          this.props.dispatch(finishedAction(id));
          // remove it from the pending actions
          delete this.pendingActions[id];

          this.props.onFinishTransaction(wfs_response, action);
        }
      }).catch((error) => {
        // ensure the action is removed from the state
        this.props.dispatch(finishedAction(id));
        // remove it from the pending actions
        delete this.pendingActions[id];
        // let the caller know the request has errored.
        this.props.onRequestError(error, action, id);
      });
    }
  }

  /** Loop through the WFS actions in state and run execute() for each.
   * @param {Object} props WfsController component's props.
   */
  executeActions(props) {
    const action_ids = Object.keys(props.actions);
    for (let i = 0, ii = action_ids.length; i < ii; i++) {
      this.execute(props, action_ids[i]);
    }
  }

  shouldComponentUpdate(nextProps) {
    // execute all the actions in the state.
    this.executeActions(nextProps);
    // no update
    return false;
  }

  componentDidMount() {
    this.executeActions(this.props);
  }

  render() {
    // never render anything.
    return false;
  }
}


WfsController.defaultProps = {
  actions: {},
  sources: {},
  onFinishTransaction: () => {},
  onRequestError: () => {},
}

function mapStateToProps(state) {
  return {
    actions: state.wfs.actions,
    sources: state.wfs.sources,
  };
}

export default connect(mapStateToProps)(WfsController);
