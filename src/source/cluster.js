

import ClusterSource from 'ol/source/cluster';


class SdkClusterSource extends ClusterSource {

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
