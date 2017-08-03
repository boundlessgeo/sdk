/** SDK Example Layerlist Component
 */
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as mapActions from '@boundlessgeo/sdk/actions/map';



class layerList extends React.PureComponent {
  constructor(props) {
    super(props);
  }

	isLayerVisible(layer){
		if (typeof layer.layout !== 'undefined') {
			return layer.layout.visibility !== 'none';
		}
		return true
	}
	moveLayerUp (layer){
		console.log('up ' + layer)
	}
	moveLayerDown (layer){
		console.log('down' + layer)
	}
	buildListOfLayers(layers) {
		let list = [];
		for (let i = layers.length-1, ii = 0; i >= ii; i--) {
			const layer = layers[i];
			const is_checked = this.isLayerVisible(layer);

			let checkbox = (<input
				type="checkbox"
				onChange={() => { }}
				onClick={() => { this.props.toggleVisibility(layer.id, is_checked); }}
				checked={is_checked}
			/>)
			let moveButtons = (<span>
					<button className="sdk-btn" onClick={() => {this.props.moveLayer(layer.id, layers[i+1].id); }}>Move Up</button>
					<button className="sdk-btn" onClick={() => {this.props.moveLayer(layer.id, layers[i-1].id); }}>move down</button>
				</span>
			)

			list.push(<li key={i}>{layer.id}{checkbox}{moveButtons}</li>)


		}
		return(<ul>{list}</ul>)
	}

  render() {
    return this.buildListOfLayers(this.props.map.layers);
  }
}

layerList.propTypes = {
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
