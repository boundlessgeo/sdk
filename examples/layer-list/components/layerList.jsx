/** SDK Example Layerlist Component
 */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import * as mapActions from '@boundlessgeo/sdk/actions/map';

const isLayerVisible = (layer) => {
  if (typeof layer.layout !== 'undefined') {
    return layer.layout.visibility !== 'none';
  }
  return true;
};

class layerList extends React.PureComponent {
  getLayerIndexById(id) {
    const layers = this.props.layers;
    for (let i = layers.length - 1, ii = 0; i >= ii; i--) {
      if (layers[i].id === id) {
        return i;
      }
    }
    return -1;
  }
  moveLayerUp(id) {
    const index = this.getLayerIndexById(id);
    if (index < this.props.layers.length - 1) {
      this.props.moveLayer(this.props.layers[index + 1].id, id);
    }
  }
  moveLayerDown(id) {
    const index = this.getLayerIndexById(id);
    if (index > 0) {
      this.props.moveLayer(id, this.props.layers[index - 1].id);
    }
  }
  buildListOfLayers(layers) {
    const list = [];
    for (let i = layers.length - 1, ii = 0; i >= ii; i--) {
      const layer = layers[i];
      const is_checked = isLayerVisible(layer);

      const checkbox = (<input
        type="checkbox"
        onChange={() => { }}
        onClick={() => { this.props.toggleVisibility(layer.id, is_checked); }}
        checked={is_checked}
      />);
      const moveButtons = (<span>
        <button className="sdk-btn" onClick={() => { this.moveLayerUp(layer.id); }}>Move Up</button>
        <button className="sdk-btn" onClick={() => { this.moveLayerDown(layer.id); }}>Move down</button>
      </span>);

      list.push(<li className="layer" key={i}><span className="checkbox">{checkbox}</span> <span className="name">{layer.id}</span><span className="btn-container">{moveButtons}</span></li>);
    }
    return (<ul className="sdk-layerlist">{list}</ul>);
  }

  moveLayerUp(id) {
    const index = this.getLayerIndexById(id);
    if(index < this.props.layers.length - 1){
      this.props.moveLayer(this.props.layers[index + 1].id, id);
    }
  }
  moveLayerDown(id) {
    const index = this.getLayerIndexById(id);
    if(index > 0){
      this.props.moveLayer(id, this.props.layers[index - 1].id);
    }
  }
  getLayerIndexById(id){
    const layers = this.props.layers;
    for (let i = layers.length - 1, ii = 0; i >= ii; i--) {
      if (layers[i].id === id){
        return i;
      }
    }
  }
  render() {
    return this.buildListOfLayers(this.props.layers);
  }
}

layerList.propTypes = {
  toggleVisibility: PropTypes.func.isRequired,
  moveLayer: PropTypes.func.isRequired,
  layers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    source: PropTypes.string,
  })).isRequired,
};

layerList.defaultProps = {

};

// export default layerList;

function mapStateToProps(state) {
  return {
    layers: state.map.layers,
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
