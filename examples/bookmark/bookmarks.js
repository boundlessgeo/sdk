import React from 'react';
import { connect } from 'react-redux';

import MoveButtonComponent from './moveButton';

// Custom Bookmark Component
class BookmarkComponent extends React.PureComponent{
  render() {
    // Get the feature selected by the count in state
    // Render the modal window using style from app.css
    const count = this.props.bookmark.count
    if (this.props.map.sources[this.props.bookmark.source] &&
      this.props.map.sources[this.props.bookmark.source].data.features.length > 0) {
      const feature = this.props.map.sources[this.props.bookmark.source].data.features[count];
      return (
        <div className='modal-window'>
          <div className='interior'>
            <h3>{feature.properties.title}</h3>
            <div className="bookmarkItem">
              <div>
                <span className="label">Name:</span> <span className="value">{feature.properties.name}</span>
              </div>
              <div>
                <span className="label">Address:</span> <span className="value">{feature.properties.address}</span>
              </div>
              <div>
                <span className="label">Phone:</span> <span className="value">{feature.properties.telephone}</span>
              </div>
              <div>
                <span className="label">Web Site:</span> <span className="value"><a href={feature.properties.website}>{feature.properties.website}</a></span>
              </div>
              <div>
                <span className="label">Lat/Long:</span> <span className="value">
                  <span className='coords'>{feature.geometry.coordinates[1]}</span>, <span className='coords'>{feature.geometry.coordinates[0]}</span>
                </span>
              </div>
            </div>
            <MoveButtonComponent store={this.props.store} />
          </div>
        </div>
      )
    } else {
      return (
      <div> </div>
      )
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

export default connect(mapStateToProps, null)(BookmarkComponent);
