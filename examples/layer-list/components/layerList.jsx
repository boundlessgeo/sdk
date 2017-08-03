/** SDK Example Layerlist Component
 */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import * as mapActions from '@boundlessgeo/sdk/actions/map';

class layerList extends React.PureComponent {

  static isLayerVisible(layer) {
    if (typeof layer.layout !== 'undefined') {
      return layer.layout.visibility !== 'none';
    }
    return true;
  }

  buildListOfLayers(layers) {
    const list = [];
    for (let i = layers.length - 1, ii = 0; i >= ii; i--) {
      const layer = layers[i];
      const is_checked = this.isLayerVisible(layer);

      const checkbox = (<input
        type="checkbox"
        onChange={() => { }}
        onClick={() => { this.props.toggleVisibility(layer.id, is_checked); }}
        checked={is_checked}
      />);
      const moveButtons = (<span>
        <button className="sdk-btn" onClick={() => { this.props.moveLayer(layer.id, layers[i + 1].id); }}>Move Up</button>
        <button className="sdk-btn" onClick={() => { this.props.moveLayer(layer.id, layers[i - 1].id); }}>move down</button>
      </span>);

      list.push(<li key={i}>{layer.id}{checkbox}{moveButtons}</li>);
    }
    return (<ul>{list}</ul>);
  }

  render() {
    return this.buildListOfLayers(this.props.map.layers);
  }
}

layerList.propTypes = {
  toggleVisibility: PropTypes.func.isRequired,
  moveLayer: PropTypes.func.isRequired,
  map: PropTypes.shape.isRequired,
};

layerList.defaultProps = {

};

// export default layerList;

function mapStateToProps(state) {
  return {
    map: state.map,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    toggleVisibility: (layerId, shown) => {
      dispatch(mapActions.setLayerVisibility(layerId, shown ? 'none' : 'visible'));
    },
    moveLayer: (layerId, targetId) => {
      dispatch(mapActions.orderLayer(layerId, targetId));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(layerList);
