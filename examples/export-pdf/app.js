/* global jsPDF */
/** Demo of using the drawing, modify, and select interactions.
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider, connect } from 'react-redux';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

// import PDFExporter from './pdf';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {

  class PDFExporter_ extends React.PureComponent {

    addText(doc, def) {
        // these are the subsitution strings for the map text elements
        const date = new Date();
        const printed = `Printed on ${date.getMonth() + 1} / ${date.getDate()} / ${date.getFullYear()}`;
        const map_title = this.props.mapName === 'default' ? 'Boundless Web SDK Map' : this.props.mapName;

        // def needs to define: x, y, text (if not title or printed date)
        const defaults = {
            size: 13,
            color: [0, 0, 0],
            font: 'Arial',
            fontStyle: 'normal'
        };

        if (def.type === 'title') {
          defaults.text = map_title;
        } else if (def.type === 'printed_on') {
          defaults.text = printed;
        }

        // create a new font definition object based on
        //  the combination of the defaults and the definition
        //  passed in by the user.
        const full_def = Object.assign({}, defaults, def);

        // set the size
        doc.setFontSize(full_def.size);
        // the color
        doc.setTextColor(full_def.color[0], full_def.color[1], full_def.color[2]);
        // and the font face.
        doc.setFont(full_def.font, full_def.fontStyle);
        // then mark the face.
        doc.text(full_def.x, full_def.y, full_def.text);
    }

    addImage(doc, def) {
        // optionally scale the image to fit the space.
        if(def.width && def.height) {
          doc.addImage(def.image_data, def.x, def.y, def.width, def.height);
        } else {
          doc.addImage(def.image_data, def.x, def.y);
        }

    }

    addMapImage(doc, def) {
        // this is not a smart component and it doesn't need to be,
        //  so sniffing the state for the current image is just fine.
        const image_data = document.getElementsByTagName('canvas')[0].toDataURL();
        this.addImage(doc, Object.assign({}, def, {image_data: image_data}));
    }

    addDrawing(doc, def) {
        // determine the style string
        let style = 'S';
        if(def.filled) {
            style = 'DF';
        }

        // set the colors
        const stroke = def.stroke ? def.stroke : [0, 0, 0];
        const fill = def.fill ? def.fill : [255, 255, 255];
        doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
        doc.setFillColor(fill[0], fill[1], fill[2]);

        // set the stroke width
        const stroke_width = def.strokeWidth ? def.strokeWidth : 1;
        doc.setLineWidth(stroke_width);

        // draw the shape.
        if(def.type === 'rect') {
            doc.rect(def.x, def.y, def.width, def.height, style);
        }
    }

    toPDF(layout) {
      // new PDF document
      const doc = new jsPDF(layout.orientation, layout.units, layout.page);

      // add some fonts
      doc.addFont('Arial', 'Arial', 'normal');
      doc.addFont('Arial-Bold', 'Arial', 'bold');

      // iterate through the elements of the layout
      //  and place them in the document.
      for(const element of layout.elements) {
        switch(element.type) {
          case 'text':
          case 'title':
          case 'printed_on':
            this.addText(doc, element);
            break;
          case 'map':
            this.addMapImage(doc, element);
            break;
          case 'rect':
            this.addDrawing(doc, element);
            break;
          default:
          // pass, do nothing.
        }
      }

      // kick it back out to the user.
      doc.save('print_' + ((new Date()).getTime()) + '.pdf');
    }

    render() {
      return (
        <button className="sdk-btn" title="Download as PDF" onClick={ () => { this.toPDF(this.props.layout); }} variant="flat">
          Export As PDF
        </button>
      );
    }
  }

  function mapStateToProps(state) {
    return {
      mapName: state.map.name,
    }
  }

  const PDFExporter = connect(mapStateToProps)(PDFExporter_);

  const url = 'https://raw.githubusercontent.com/boundlessgeo/ol-mapbox-style/master/example/data/wms.json';
  store.dispatch(mapActions.setContext({ url }));

  // place the map on the page.
  ReactDOM.render(<Provider store={store}>
    <SdkMap />
  </Provider>, document.getElementById('map'));

  const layout = {
      orientation: 'landscape',
      page: 'letter',
      units: 'in',
      elements: [
          {
              type: 'title',
              size: 18, fontStyle: 'bold',
              x: .5, y: .70
          },
          {
              type: 'map',
              x: .5, y: .75,
              width: 10, height: 4
          },
          {
              type: 'rect',
              x: .5, y: .75,
              width: 10, height: 4,
              strokeWidth: .01
          },
          {
              type: 'printed_on',
              x: .5, y: 5
          }
      ]
  };

  // add a button to demo the action.
  ReactDOM.render((
    <div>
      <h3>Try it out</h3>
      <PDFExporter store={store} layout={layout}/>
    </div>
  ), document.getElementById('controls'));
}

main();
