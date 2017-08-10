import React from 'react';
import PropTypes from 'prop-types';

/**
 * Render a list of layers available on the WMS, and a button to add them to the map.
 */
const AddWMSLayer = (props) => {
  const children = [];
  const layers = props.layers.slice();
  layers.sort((a, b) => {
    const upperA = a.Title.toUpperCase();
    const upperB = b.Title.toUpperCase();
    return (upperA > upperB) - (upperA < upperB);
  });
  for (let i = 0, ii = layers.length; i < ii; ++i) {
    const layer = layers[i];
    const button = (<button onClick={() => { props.onAddLayer(layer); }}>Add</button>);
    children.push(<li key={i}>{layer.Title}{button}</li>);
  }
  return (<ul>{children}</ul>);
};

AddWMSLayer.propTypes = {
  layers: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddLayer: PropTypes.func,
};

AddWMSLayer.defaultProps = {
  onAddLayer: () => {},
};

export default AddWMSLayer;
