import ZoomSliderView from './ZoomSliderView';
import {connect} from 'react-redux';
import * as MapActions from '../actions/MapActions';


// Maps state from store to props
const mapStateToProps = (state) => {
  return {
    maxResolution: state.mapState.view.maxResolution || 0,
    minResolution: state.mapState.view.minResolution || 0,
    resolution: state.mapState.view.resolution || 0
  }
};

// Maps actions to props
const mapDispatchToProps = (dispatch) => {
  return {
    setView: view => dispatch(MapActions.setView(view))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(ZoomSliderView);
