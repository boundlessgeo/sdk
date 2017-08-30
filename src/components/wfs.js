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

/** Provides a components which will respond to WFS
 *  updates.
 */

import fetch from 'isomorphic-fetch';

import { PureComponent } from 'react';
import { connect } from 'react-redux';

import WfsFormat from 'ol/format/wfs';
import GeoJsonFormat from 'ol/format/geojson';

import { jsonClone } from '../util';
import { WFS } from '../action-types';

class WfsController extends PureComponent {
  constructor(props) {
    super(props);
    this.pendingActions = {};

    this.wfs_format = new WfsFormat();
    this.geojson_format = new GeoJsonFormat();
  }

  execute(props, id) {
    // only act if the action is not already pending.
    if (this.pendingActions[id] === undefined) {
      // copy the action
      const action = Object.assign({}, props.actions[id]);

      const working_srs = 'EPSG:3857';

      // add it to the queue
      this.pendingActions[id] = action;

      const src = props.sources[action.sourceName];


      // clone the feature, as GeoJSON features have a lot of
      //  depth this ensures all the sub-objects are cloned reasonably.
      const json_feature = jsonClone(action.feature);
      delete json_feature.properties['bbox'];

      const feature = this.geojson_format.readFeature(json_feature, {
        dataProjection: 'EPSG:4326',
        featureProjection: working_srs,
      });

      let geom_name = src.geometryName;

      const actions = {};
      actions[action.type] = [feature];

      const options = {
        featureNS: src.xmlNs,
        featurePrefix: src.featurePrefix,
        featureType: src.typeName,
        srsName: working_srs,
      }

      // convert this to a WFS call.
      const xml = this.wfs_format.writeTransaction(
        actions[WFS.INSERT],
        actions[WFS.UPDATE],
        actions[WFS.DELETE],
        options);

      // convert the XML to a string.
      let payload = (new XMLSerializer()).serializeToString(xml);

      // fix the geometry name...
      payload = payload.replace('<Name>geometry</Name>', `<Name>${geom_name}</Name>`);

      // get the target_url from the service
      const target_url = src.onlineResource;

      // attempt the action,
      //  if there is a failure (offline) then add the action back
      //   to the queue.
      //  if there is an error (bad request, etc.) then post an error
      //  if the request completes cleanly dispatch a refresh on that source.
      fetch(target_url, {
        method: 'POST',
        body: payload,
      }).then((response) => {
        return response.text();
      }).then((text) => {
        const wfs_response = this.wfs_format.readTransactionResponse(text);
        this.props.onFinishTransaction(wfs_response, action);
      });
    }
  }

  executeActions(props) {
    if (props && props.actions && props.sources) {
      const action_ids = Object.keys(props.actions);
      for (let i = 0, ii = action_ids.length; i < ii; i++) {
        this.execute(props, action_ids[i]);
      }
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

function mapStateToProps(state) {
  return {
    actions: state.wfs.actions,
    sources: state.wfs.sources,
  };
}

export default connect(mapStateToProps)(WfsController);
