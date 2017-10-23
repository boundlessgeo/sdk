import React from 'react';
// import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import { getLayerById } from '@boundlessgeo/sdk/util';

class Table extends React.Component {
  constructor(props) {
    super(props);
    // this.features = [];
    this.state = {
      selectedSource: '',
      editRow: -1,
      editRecord: {}
    };
    //this.getFeatures(this.props.sources.airports_src.data);
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

// Build the body of the table based on list of properties and source store in redux store
buildTableBody (properties, sourceName) {
  const body = [];
  let row = [];
  // Get all the features from the Redux store
  if(sourceName === ''){
    return;
  }
  const features = this.props.map.sources[sourceName].data.features;
  // Loop over features
  for (let i = 0, ii = features.length; i < ii; i++) {
    // Loop over properties
    for (let j = 0, jj = properties.length; j < jj; j++) {
      // Build list of properties for each feature
      const featureValue = features[i].properties[properties[j]];
      let value = '';
      row.push(
        <td key={j}>
          {this.state.editRow === i || featureValue}
          {this.state.editRow !== i || <input type="text" value={value} placeholder={featureValue} onChange={(value) => this.setState({editRecord : value})}/>}
        </td>);
    }
    const editControls = (
       <div>
          <a className='actionButton'>
            <i className="fa fa-check" onClick={() => this.setState({editRow:i})}></i>
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
  // This would be a good point to filter out any
  // unwanted properties such as GUID from the propertyList

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
  });

  let key = '';
  return (
    <div className="feature-table">
      <div className='table-header'>
  			<select className="input-control" name='key' value={key} onChange={(key) => this.setState({selectedSource : key.target.value})}>
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
export default connect(mapStateToProps, null)(Table);
