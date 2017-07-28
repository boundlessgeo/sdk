/** Collection of useful constants.
 */
export const LAYER_VERSION_KEY = 'bnd:layer-version';
export const SOURCE_VERSION_KEY = 'bnd:source-version';
export const TITLE_KEY = 'bnd:title';
export const DATA_VERSION_KEY = 'bnd:data-version';

export const INTERACTIONS = {
  modify: 'Modify',
  select: 'Select',
  point: 'Point',
  line: 'LineString',
  polygon: 'Polygon',
};

// useful for deciding what is or is not a drawing interaction
INTERACTIONS.drawing = [INTERACTIONS.point, INTERACTIONS.line, INTERACTIONS.polygon];

export default {
  LAYER_VERSION_KEY,
  SOURCE_VERSION_KEY,
  TITLE_KEY,
  DATA_VERSION_KEY,
  INTERACTIONS,
};
