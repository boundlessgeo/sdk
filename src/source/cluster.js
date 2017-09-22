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

import ClusterSource from 'ol/source/cluster';
/** @module source/cluster
 * @desc ClusterSource class for Boundless SDK,
 *  extends OpenLayers ClusterSource,
 *  {@link http://openlayers.org/en/latest/apidoc/ol.source.Cluster.html}
 */

class SdkClusterSource extends ClusterSource {

  /** Creates the cluster.
   *
   * @param {Object[]} features Features to be clustered.
   *
   * @returns {Object} The cluster feature.
   */
  createCluster(features) {
    // get the cluster back from the clustering algorithm.
    const cluster = super.createCluster(features);
    // add "point_count" to the features
    const n_features = cluster.get('features').length;
    cluster.set('point_count', n_features);
    cluster.set('point_count_abbreviated', n_features);
    return cluster;
  }
}

export default SdkClusterSource;
