import ZoomToLatLonView from './ZoomToLatLonView';
import {connect} from 'react-redux';
import * as MapActions from '../actions/MapActions';

// Maps state from store to props
const mapStateToProps = (state) => {
  return {
    //open: state.zoomToLatLon.dialogIsOpen
    projection: state.mapState.view.projection
  }
};

// Maps actions to props
const mapDispatchToProps = (dispatch) => {
  return {
    setView: view => dispatch(MapActions.setView(view)),
    setLatLon: (lat, lon) => dispatch(MapActions.setLatLon(lat, lon)),
    lonLatToCenter: (lon, lat, proj) => dispatch(MapActions.lonLatToCenter(lon, lat, proj))
    //openDialog: () => dispatch(zoomToLatLonActions.openDialog()),
    //closeDialog: () => dispatch(zoomToLatLonActions.closeDialog())
  }
};
export default connect(mapStateToProps, mapDispatchToProps)(ZoomToLatLonView);
