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
  measure_point: 'measure:Point',
  measure_line: 'measure:LineString',
  measure_polygon: 'measure:Polygon',
};

// useful for deciding what is or is not a drawing interaction
INTERACTIONS.drawing = [INTERACTIONS.point, INTERACTIONS.line, INTERACTIONS.polygon];

// determine which is a measuring interaction
INTERACTIONS.measuring = [
  INTERACTIONS.measure_point,
  INTERACTIONS.measure_line,
  INTERACTIONS.measure_polygon,
];

export default {
  LAYER_VERSION_KEY,
  SOURCE_VERSION_KEY,
  TITLE_KEY,
  DATA_VERSION_KEY,
  INTERACTIONS,
};
