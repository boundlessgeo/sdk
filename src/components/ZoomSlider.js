import ZoomSliderView from './ZoomSliderView';
import {connect} from 'react-redux';
import * as MapActions from '../actions/MapActions';


// Maps state from store to props
const mapStateToProps = (state) => {
  return {
    map: state.mapState
  }
};

// Maps actions to props
const mapDispatchToProps = (dispatch) => {
  return {
    setView: view => dispatch(MapActions.setView(view))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(ZoomSliderView);
