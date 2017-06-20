import ZoomToLatLonView from './ZoomToLatLonView';
import {connect} from 'react-redux';
import * as MapActions from '../actions/MapActions';

// Maps state from store to props
const mapStateToProps = (state) => {
  return {
    projection: state.mapState.view.projection
  }
};

// Maps actions to props
const mapDispatchToProps = (dispatch) => {
  return {
    setView: view => dispatch(MapActions.setView(view)),
    lonLatToCenter: (lon, lat, proj) => dispatch(MapActions.lonLatToCenter(lon, lat, proj))
  }
};
export default connect(mapStateToProps, mapDispatchToProps)(ZoomToLatLonView);
