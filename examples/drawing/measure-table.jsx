import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

class MeasureTable extends React.PureComponent {

  render() {
    // no feature, no measurement table.
    if (this.props.feature === null) {
      return null;
    }

    const rows = [];

    if (this.props.feature.geometry.type === 'Point') {
      // Let the user know where they clicked on the map.
      // This could be extended to describe the coordinate in
      // other projections.
      const coords = this.props.feature.geometry.coordinates;
      rows.push((
        <tr>
          <td><b>Point @</b></td>
          <td>{coords[0]}, {coords[1]}</td>
        </tr>
      ));
    } else if (this.props.feature.geometry.type === 'Polygon') {
      // the first segment contains the area as the SDK does
      // not currently publish incremental areas.
      let area = this.props.segments[0];
      let units = 'm';
      if (area > 1000000) {
        units = 'km';
        area /= 1000000;
      }

      rows.push((
        <tr>
          <td><b>Polygon area:</b></td>
          <td>{ area } { units }<super>2</super></td>
        </tr>
      ));
    } else {
      // It's not a point, it's not a polygon, BETTER BE A LINE!
      let total = 0;
      let units = 'm';

      // if the first segment looks pretty long,
      //  switch to using km instead of m.
      let modifier = 1;
      if (this.props.segments[0] > 5000) {
        modifier = 1000;
        units = 'km';
      }

      for (let i = this.props.segments.length - 1; i >= 0; i--) {
        // do the conversion to km as necessary.
        const value = this.props.segments[i] / modifier;
        // put this segment value onto the total.
        total += value;
        // make a row.
        rows.push((
          <tr key={i}>
            <td>{ i + 1 }</td><td>{ value } { units }</td>
          </tr>
        ));
      }

      // this puts the total at the top of the list.
      rows.unshift((
        <tr key="total">
          <td><b>Total</b></td><td>{ total } { units }</td>
        </tr>
      ));
    }

    return (
      <div>
        <h4>Measure results</h4>
        <table>
          <tbody>
            { rows }
          </tbody>
        </table>
      </div>
    );
  }
}

MeasureTable.propTypes = {
  feature: PropTypes.shape({
    type: PropTypes.string,
    geometry: PropTypes.object,
  }),
  segments: PropTypes.arrayOf(PropTypes.number),
};

MeasureTable.defaultProps = {
  feature: null,
  segments: null,
};


function mapStateToProps(state) {
  return {
    feature: state.drawing.measureFeature,
    segments: state.drawing.measureSegments,
  };
}

export default connect(mapStateToProps)(MeasureTable);
