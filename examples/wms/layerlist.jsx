import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

/**
 * Layer list to toggle visibility and remove layers from the map.
 */
const LayerListContainer = (props) => {
  const layers = [];
  for (let i = 0, ii = props.layers.length; i < ii; ++i) {
    let visible = true;
    const layer = props.layers[i];
    if (layer.type !== 'background') {
      if (typeof layer.layout !== 'undefined') {
        visible = (layer.layout.visibility !== 'none');
      }
      layers.push(<li key={i}><input
        type="checkbox"
        onChange={() => { }}
        onClick={() => { let newVisible = 'none'; if (layer.layout && layer.layout.visibility && layer.layout.visibility === 'none') { newVisible = 'visible'; } props.setVisibility(layer.id, newVisible); }}
        checked={visible}
      />{(layer.metadata && layer.metadata['bnd:title']) ? layer.metadata['bnd:title'] : layer.id}<button onClick={() => { props.dispatch(mapActions.removeSource(layer.id)); props.dispatch(mapActions.removeLayer(layer.id)); }}>Remove</button></li>);
    }
  }
  return (
    <div>
      {layers}
    </div>
  );
};

LayerListContainer.propTypes = {
  dispatch: PropTypes.func.isRequired,
  layers: PropTypes.arrayOf(PropTypes.object),
  setVisibility: PropTypes.func,
};

LayerListContainer.defaultProps = {
  layers: [],
  setVisibility: () => { },
};

function mapStateLayers(state) {
  return {
    layers: state.map.layers,
  };
}

function mapDispatch(dispatch) {
  return {
    dispatch,
    setVisibility: (layerId, visible) => {
      dispatch(mapActions.setLayerVisibility(layerId, visible));
    },
  };
}

export default connect(mapStateLayers, mapDispatch)(LayerListContainer);
