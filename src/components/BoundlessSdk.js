import React from 'react';
import {Provider} from 'react-redux';
import ol from 'openlayers';

import configureStore from '../stores/Store';

export class BoundlessSdk extends React.PureComponent {
  static propTypes = {
    /**
     * @ignore
     */
    children: React.PropTypes.node,
    /**
     * OpenLayers Map
     */
    map: React.PropTypes.instanceOf(ol.Map)
  }
  constructor(props) {
    super(props);
    this.store = props.store ? props.store : configureStore();
  }
  getChildContext() {
    return {
      map: this.props.map
    };
  }
  render() {
    return (
      <Provider store={this.store}>
        {this.props.children}
      </Provider>
    );
  }

}
BoundlessSdk.childContextTypes = {
  map: React.PropTypes.instanceOf(ol.Map)
}
export default BoundlessSdk;
