import React from 'react';
import { connect } from 'react-redux';

import * as bookmarkAction from './action';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

// Custom Bookmark Component
class MoveButtonComponent extends React.PureComponent{
	// This is the where action really happens, update state and move the map
	moveBookmark(count){
		this.props.moveSlide(count);
		if (this.props.map.sources[this.props.bookmark.source]) {
			const feature = this.props.map.sources[this.props.bookmark.source].data.features[count];
			this.props.zoomTo(feature.geometry.coordinates, 18);
		}

	}
	// Logic for handling next button
	nextBookmark(){
		const featureCount = this.props.map.sources[this.props.bookmark.source].data.features.length;
		const currentCount = this.props.bookmark.count;
		const newCount  = currentCount >= featureCount - 1 ? 0 : currentCount + 1;
		this.moveBookmark(newCount);
	}
	// Logic for handling previous button
	previousBookmark(){
		const featureCount = this.props.map.sources[this.props.bookmark.source].data.features.length;
		const currentCount = this.props.bookmark.count;
		const newCount = currentCount <= 0 ? featureCount - 1 : currentCount - 1;
		this.moveBookmark(newCount);
	}
	componentDidUpdate(nextProps, nextState)
	{
		if(nextProps.bookmark.source !== this.props.bookmark.source)
		{
			this.moveBookmark(this.props.bookmark.count)
		}
	}
	// Render the buttons
	render() {
		return (
			<span className="buttons">
				<button className="sdk-btn" onClick={() => { this.previousBookmark() }}  >Previous</button> <button className="sdk-btn" onClick={() => {this.nextBookmark()}}>Next</button>
			</span>
		)
	}
}
// Getting the bookmark and map stores
function mapStateToProps(state) {
  return {
    bookmark: state.bookmark,
    map: state.map,
  };
}
// Need the moveSlide function from bookmark reducer
// Need setView function from map reducer
function mapDispatchToProps(dispatch) {
  return {
    moveSlide: (count) => {
      dispatch(bookmarkAction.moveSlide(count));
    },
		zoomTo: (coords, zoomLevel) => {
			dispatch(mapActions.setView(coords, zoomLevel));
		}
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(MoveButtonComponent);
