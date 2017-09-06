import React from 'react';
import { connect } from 'react-redux';

import * as bookmarkAction from './action';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

// Custom Bookmark Component
class addBookmarkComponenet extends React.PureComponent{
	constructor(props) {
    super(props);
    this.state = {
			name: '',
			address: '',
			phone: '',
			website: '',
			lat: '',
			long: ''
		};

    this.handleChange = this.handleChange.bind(this);
  }
	// Change handler to keep track of state
  handleChange(event) {
    this.setState({[event.target.name]: event.target.value});
  }
	//
	close() {
		this.props.addBookmark(false);
	}
  save() {
		const feature = {
			type:'Feature',
			properties:{
				title: this.state.title,
				name:this.state.name,
				address:this.state.address,
				telephone:this.state.phone,
				website:this.state.website
			},
			geometry: {
				type:'Point',
				coordinates : [parseFloat(this.state.long), parseFloat(this.state.lat)]
			}
		}
		this.props.addFeature(this.props.bookmark.source, feature);
		this.close();
  }

  render() {
		if(this.props.bookmark.isAdding){
      return (
        <div className='modal-window'>
          <div className='interior'>
						<div className="bookmarkItem">
						<div className="form-group">
		         	<label>Name: </label>
		          <input className="input-control" type="text" name='name' value={this.state.name} onChange={this.handleChange} />
						</div>
						<div className="form-group">
		         	<label>Title: </label>
		          <input className="input-control" type="text" name='title' value={this.state.title} onChange={this.handleChange} />
						</div>
						<div className="form-group">
		         <label>Address:</label>
		         <input className="input-control" type="text" name='address' value={this.state.address} onChange={this.handleChange} />
					 </div>
					 <div className="form-group">
		         <label>Phone:</label>
		          <input className="input-control" type="number" name='phone' value={this.state.phone} onChange={this.handleChange} />
						</div>
						<div className="form-group">
		        	<label>Web Site:</label>
		        	<input className="input-control" type="text" name='website' value={this.state.website} onChange={this.handleChange} />
						</div>
						<div className="form-group">
		        	<label>Latitude:</label>
		        	<input className="input-control" type="number" name='lat' value={this.state.lat} onChange={this.handleChange} />
						</div>
						<div className="form-group">
	         		<label>Longitude:</label>
		        	<input className="input-control" type="number" name='long' value={this.state.long} onChange={this.handleChange} />
						</div>
						<div className="form-group">
		         <button className="sdk-btn" onClick={() => {this.save()}} >Save</button>
		         <button className="sdk-btn" onClick={() => {this.close()}} >Cancel</button>
						</div>
					</div>
				</div>
      </div>
    )
  } else {
		return (<div></div>)
	}

}
}
// Getting the bookmark and map stores
function mapStateToProps(state) {
  return {
    bookmark: state.bookmark,
    map: state.map,
  };
}
function mapDispatchToProps(dispatch) {
  return {
		addFeature: (sourceName, features) => {
			dispatch(mapActions.addFeatures(sourceName, features));
		},
		addBookmark: (isAdding) => {
			dispatch(bookmarkAction.addBookmark(isAdding));
		}
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(addBookmarkComponenet);
