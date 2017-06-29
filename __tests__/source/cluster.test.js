/* global it, describe, expect */

import VectorSource from 'ol/source/vector';
import Feature from 'ol/feature';
import PointGeom from 'ol/geom/point';

import SdkClusterSource from '../../src/source/cluster';

describe('Cluster source', () => {
  it('should set cluster count', () => {
    const features = [
      new Feature(new PointGeom([0, 0])),
      new Feature(new PointGeom([1, 1])),
      new Feature(new PointGeom([-1, -1])),
    ];
    const vector = new VectorSource();
    const source = new SdkClusterSource({ source: vector });
    const cluster = source.createCluster(features);
    expect(cluster.get('point_count')).toEqual(3);
    expect(cluster.get('point_count_abbreviated')).toEqual(3);
  });
});
