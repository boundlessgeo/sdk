

import { WFS } from '../action-types';

function wfsAction(type, sourceName, feature) {
  return { type, sourceName, feature };
}

export function insertFeature(sourceName, feature) {
  return wfsAction(WFS.INSERT, sourceName, feature);
}

export function updateFeature(sourceName, feature) {
  return wfsAction(WFS.UPDATE, sourceName, feature);
}

export function deleteFeature(sourceName, feature) {
  return wfsAction(WFS.DELETE, sourceName, feature);
}

export function addSource(sourceName, onlineResource, xmlNs, prefix, typeName, geometryName = 'geometry') {
  return {
    type: WFS.ADD_SOURCE,
    sourceName,
    sourceDef: {
      onlineResource,
      xmlNs,
      typeName,
      featurePrefix: prefix,
      geometryName,
    },
  };
}

export function removeSource(sourceName) {
  return {
    type: WFS.REMOVE_SOURCE,
    sourceName,
  }
}

export function finishedAction(actionId) {
  return {
    type: WFS.FINISHED,
    id: actionId
  };
}
