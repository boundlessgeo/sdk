import React from 'react';
import { connect } from 'react-redux';

import * as mapActions from '@boundlessgeo/sdk/actions/map';

export class EditField extends React.Component {
  constructor(props) {
    super(props);
  }
  render(){
    // If row is edited return input
    if(this.props.editRow){
      return (<input type="text" placeholder={this.props.value} onBlur={this.props.onBlur}/>)
    } else {
      return (<span>{this.props.value}</span>);
    }
  }
}

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedSource: '',
      editRow: -1,
      editRecord: {}
    };
  }

// Next few functions are all about building the feature Table
// Read the source and get all the possible properties
getTableHeaders (sourceName) {
  if(sourceName === ''){
    return [];
  }
  const features = this.props.map.sources[sourceName].data.features;
  const headers = [];
  // Loop over features
  for (let i = 0, ii = features.length; i < ii; i++) {
    // Build a list of unique properties for the header list
    const temp = Object.keys(features[i].properties);
    for (let j = 0, jj = temp.length; j < jj; j++) {
      // if the feature.properties is new add it to headers
      if (headers.indexOf(temp[j]) < 0) {
        headers.push(temp[j]);
      }
    }
  }
  return headers;
};

// Build out the headers based on supplied list of properties
buildTableHeader (properties) {
  const th = [];
  if(properties.length === 0){
    return;
  }
  for (let i = 0, ii = properties.length; i < ii; i++) {
    th.push(<th key={properties[i]}>{properties[i]}</th>);
  }
  return (<thead><tr>{th}</tr></thead>);
};

updateRow(rowNumber){
  // Get feature from State using rowNumber
  const feature = this.props.map.sources[this.state.selectedSource].data.features[rowNumber];

  // Get properties of the features and editted properties from local state
  const properties = Object.assign({}, feature.properties, this.state.editRecord);

  // Build a new feature using the properties
  const newFeature = Object.assign({}, feature, {properties});

  // Get the keys from properties
  var keys = Object.keys(feature.properties);

  // Build a filter for feature to remove
  var filter = keys.map((key) => ['==' , key, feature.properties[key]]);

  // Add all to begining of filter to test all CONDITIONS
  // See https://www.mapbox.com/mapbox-gl-js/style-spec/#types-filter.
  filter.unshift('all');

  // Remove the old feature
  this.props.removeFeature(this.state.selectedSource, filter);

  // Add a new feature, function take an array of features
  this.props.addFeature(this.state.selectedSource, [newFeature], rowNumber);

  // Reset local state
  this.setState({editRow:-1, editRecord: {}})
}

updateFeature(value, key){
  if(value !== ''){
    this.setState({editRecord:
      Object.assign({}, this.state.editRecord, {[key]:value}) });
  }
}
// Build the body of the table based on list of properties and source store in redux store
buildTableBody (properties, sourceName) {
  const body = [];
  let row = [];
  // Get all the features from the Redux store
  if(sourceName === ''){
    return false;
  }
  const features = this.props.map.sources[sourceName].data.features;
  // Loop over features
  for (let i = 0, ii = features.length; i < ii; i++) {
    // Loop over properties
    for (let j = 0, jj = properties.length; j < jj; j++) {
      // Build list of properties for each feature
      const featureValue = features[i].properties[properties[j]];
      row.push(
        <td key={j}>
          <EditField editRow={this.state.editRow === i} value={featureValue} onBlur={(evt) => this.updateFeature(evt.target.value, properties[j])}/>
        </td>);
    }
    const editControls = (
       <div>
          <a className='actionButton'>
            <i className="fa fa-check" onClick={() => this.updateRow(i)}></i>
          </a>
          <a className='actionButton red'>
            <i className="fa fa-times" onClick={() => this.setState({editRow:-1})}></i>
          </a>
        </div>
    );
    row.push(<td key={properties.length+1}>
      {this.state.editRow !== -1 || <i className="fa fa-pencil" onClick={() => this.setState({editRow:i})}></i>}
      {this.state.editRow !== i || editControls}
    </td>);
    // add the features properties to the list
    body.push(<tr key={i}>{row}</tr>);
    // Reset the row
    row = [];
  }
  // Return the body
  return (<tbody>{body}</tbody>);
};

render(){

  // Get full list of properties
  const propertyList = this.getTableHeaders(this.state.selectedSource);

  // // Build table header
  const tableHeader = this.buildTableHeader(propertyList);
  // // Build table body
  const tableBody = this.buildTableBody(propertyList, this.state.selectedSource);

  const layerIds = this.props.map.layers.map( (value, key) => {
    const source = this.props.map.sources[value.source];
    // Check for a source related to layer, and if source is of type geojson
    // Example can only render table data for geojson sources
    if(source && source.type === 'geojson'){
      return ( <option key={key} value={ value.source }>{ value.id }</option> );
    }
    return null;
  });

  let key = '';
  return (
    <div className="feature-table">
      <div className='table-header'>
  			<select className="input-control" name='key' value={this.state.selectedSource} onChange={(key) => this.setState({selectedSource : key.target.value})}>
  				<option value="">Select Source</option>
  				{layerIds}
        </select>
      </div>
      <div className='table-content'>
        <table>
          {tableHeader}
          {tableBody}
        </table>
      </div>
		</div>
  );
}
}
function mapStateToProps(state) {
  return {
    map: state.map,
  };
}
function mapDispatchToProps(dispatch) {
	return {
		removeFeature: (sourceName, filter) => {
			dispatch(mapActions.removeFeatures(sourceName, filter));
		},
    addFeature: (sourceName, filter, position) => {
			dispatch(mapActions.addFeatures(sourceName, filter, position));
		}
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(Table);
