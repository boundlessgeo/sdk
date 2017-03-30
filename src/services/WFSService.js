/*
 * Copyright 2015-present Boundless Spatial Inc., http://boundlessgeo.com
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import ol from 'openlayers';
import util from '../util';
import {Jsonix} from 'jsonix';
import URL from 'url-parse';
import {XSD_1_0} from 'w3c-schemas/lib/XSD_1_0';
import {XLink_1_0} from 'w3c-schemas/lib/XLink_1_0';
import {OWS_1_0_0} from 'ogc-schemas/lib/OWS_1_0_0';
import {Filter_1_1_0} from 'ogc-schemas/lib/Filter_1_1_0';
import {SMIL_2_0} from 'ogc-schemas/lib/SMIL_2_0';
import {SMIL_2_0_Language} from 'ogc-schemas/lib/SMIL_2_0_Language';
import {GML_3_1_1} from 'ogc-schemas/lib/GML_3_1_1';
import {WFS_1_1_0} from 'ogc-schemas/lib/WFS_1_1_0';

const wfsFormat = new ol.format.WFS();
const geojsonFormat = new ol.format.GeoJSON();
const xmlSerializer = new XMLSerializer();
const wfsContext = new Jsonix.Context([OWS_1_0_0, Filter_1_1_0, SMIL_2_0, SMIL_2_0_Language, XLink_1_0, GML_3_1_1, WFS_1_1_0]);
const wfsUnmarshaller = wfsContext.createUnmarshaller();
const xsdContext = new Jsonix.Context([XSD_1_0]);
const xsdUnmarshaller = xsdContext.createUnmarshaller();

const proj4326 = new ol.proj.Projection({
  code: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
  axis: 'enu'
});
ol.proj.addEquivalentProjections([ol.proj.get('EPSG:4326'), proj4326]);

class WFSService {
  createSource(url, projection, typeName, opt_proxy) {
    return new ol.source.Vector({
      wrapX: false,
      url: function(extent) {
        var urlObj = new URL(url);
        urlObj.set('query', {
          service: 'WFS',
          request: 'GetFeature',
          version: '1.1.0',
          typename: typeName,
          outputFormat: 'application/json',
          srsname: projection.getCode(),
          bbox: extent.join(',') + ',' + projection.getCode()
        });
        return util.getProxiedUrl(urlObj.toString(), opt_proxy);
      },
      format: geojsonFormat,
      strategy: ol.loadingstrategy.bbox
    });
  }
  createLayer(layer, url, titleObj, projection, opt_proxy) {
    return new ol.layer.Vector({
      title: titleObj.title,
      emptyTitle: titleObj.empty,
      id: layer.Name,
      name: layer.Name,
      isWFST: true,
      timeInfo: util.getTimeInfo(layer),
      isRemovable: true,
      isSelectable: true,
      popupInfo: '#AllAttributes',
      url: url,
      source: this.createSource(url, projection, layer.Name, opt_proxy)
    });
  }
  parseCapabilities(xmlhttp) {
    var layers = [];
    var info = wfsUnmarshaller.unmarshalDocument(xmlhttp.responseXML).value;
    if (info && info.featureTypeList && info.featureTypeList.featureType) {
      for (var i = 0, ii = info.featureTypeList.featureType.length; i < ii; ++i) {
        var ft = info.featureTypeList.featureType[i];
        var layer = {};
        layer.Name = ft.name.prefix + ':' + ft.name.localPart;
        if (ft.keywords) {
          layer.KeywordList = ft.keywords[0].keyword;
        }
        layer.Title = ft.title;
        layer.Abstract = ft._abstract;
        layer.EX_GeographicBoundingBox = [
          ft.wgs84BoundingBox[0].lowerCorner[0],
          ft.wgs84BoundingBox[0].lowerCorner[1],
          ft.wgs84BoundingBox[0].upperCorner[0],
          ft.wgs84BoundingBox[0].upperCorner[1]
        ];
        layers.push(layer);
      }
    }
    return {
      layers: layers,
      title: info.serviceIdentification.title
    };
  }
  getCapabilitiesUrl(url, opt_proxy) {
    var urlObj = new URL(url);
    urlObj.set('query', {
      service: 'WFS',
      version: '1.1.0',
      request: 'GetCapabilities'
    });
    return util.getProxiedUrl(urlObj.toString(), opt_proxy);
  }
  getCapabilities(url, onSuccess, onFailure, opt_proxy, opt_requestHeaders) {
    return util.doGET(this.getCapabilitiesUrl(url, opt_proxy), function(xmlhttp) {
      var info = this.parseCapabilities(xmlhttp);
      onSuccess.call(this, {Title: info.title, Layer: info.layers});
    }, function(xmlhttp) {
      onFailure.call(this, xmlhttp);
    }, this, opt_requestHeaders);
  }
  describeFeatureType(url, layerName, onSuccess, onFailure, scope, opt_proxy, opt_requestHeaders) {
    var dftUrl = new URL(url);
    dftUrl.set('query', {
      service: 'WFS',
      request: 'DescribeFeatureType',
      version: '1.0.0',
      typename: layerName
    });
    util.doGET(util.getProxiedUrl(dftUrl.toString(), opt_proxy), function(xmlhttp) {
      if (xmlhttp.responseText.indexOf('ServiceExceptionReport') === -1) {
        var schema = xsdUnmarshaller.unmarshalString(xmlhttp.responseText).value;
        var element = schema.complexType[0].complexContent.extension.sequence.element;
        var geometryType, geometryName;
        var attributes = [];
        for (var i = 0, ii = element.length; i < ii; ++i) {
          var el = element[i];
          if (el.type.namespaceURI === 'http://www.opengis.net/gml') {
            geometryName = el.name;
            var lp = el.type.localPart;
            geometryType = lp.replace('PropertyType', '');
          } else if (el.name !== 'boundedBy') {
            // TODO if needed, use attribute type as well
            attributes.push(el.name);
          }
        }
        attributes.sort(function(a, b) {
          return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        onSuccess.call(scope || this, {
          featureNS: schema.targetNamespace,
          featurePrefix: layerName.split(':').shift(),
          featureType: schema.element[0].name,
          geometryType: geometryType,
          geometryName: geometryName,
          attributes: attributes,
          url: url
        });
      } else {
        onFailure.call(scope || this, xmlhttp);
      }
    }, function(xmlhttp) {
      onFailure.call(scope || this, xmlhttp);
    }, this, opt_requestHeaders);
  }
  loadFeatures(layer, startIndex, maxFeatures, sortingInfo, srsName, onSuccess, onFailure, opt_proxy, opt_requestHeaders) {
    var wfsInfo = layer.get('wfsInfo');
    var url = wfsInfo.url;
    var urlObj = new URL(url);
    var params = {
      service: 'WFS',
      request: 'GetFeature',
      startIndex: startIndex,
      maxFeatures: maxFeatures,
      version: '1.1.0',
      typename: wfsInfo.featureType,
      srsname: 'EPSG:4326'
    };
    if (sortingInfo.length === 1) {
      params.sortBy = sortingInfo[0].id + ' ' + (sortingInfo[0].asc ? 'A' : 'D');
    }
    urlObj.set('query', params);
    util.doGET(util.getProxiedUrl(urlObj.toString(), opt_proxy), function(xmlhttp) {
      var data = xmlhttp.responseXML;
      if (data !== null) {
        this.readResponse(data, xmlhttp, function(data) {
          var features = wfsFormat.readFeatures(data, {dataProjection: proj4326, featureProjection: srsName});
          onSuccess.call(this, features);
        }, onFailure);
      } else {
        onFailure.call(this, xmlhttp);
      }
    }, function(xmlhttp) {
      onFailure.call(this, xmlhttp);
    }, this, opt_requestHeaders);
  }
  getNumberOfFeatures(layer, callback, opt_proxy, opt_requestHeaders) {
    if (layer.get('numberOfFeatures') === undefined) {
      var wfsInfo = layer.get('wfsInfo');
      var url = wfsInfo.url;
      var urlObj = new URL(url);
      urlObj.set('query', {
        service: 'WFS',
        request: 'GetFeature',
        resultType: 'hits',
        version: '1.1.0',
        typename: wfsInfo.featureType
      });
      util.doGET(util.getProxiedUrl(urlObj.toString(), opt_proxy), function(xmlhttp) {
        var info = wfsFormat.readFeatureCollectionMetadata(xmlhttp.responseXML);
        callback.call(this, info.numberOfFeatures);
      }, undefined, opt_requestHeaders);
    }
  }
  bboxFilter(layer, view, extent, onSuccess, onFailure, opt_proxy, opt_requestHeaders) {
    var wfsInfo = layer.get('wfsInfo');
    var url = new URL(wfsInfo.url);
    var srs = view.getProjection().getCode();
    url.set('query', {
      service: 'WFS',
      request: 'GetFeature',
      version : '1.1.0',
      srsName: srs,
      typename: wfsInfo.featureType,
      bbox: extent.join(',') + ',' + srs
    });
    return util.doGET(util.getProxiedUrl(url.toString(), opt_proxy), function(xmlhttp) {
      var features = wfsFormat.readFeatures(xmlhttp.responseXML);
      onSuccess.call(this, features);
    }, onFailure, this, opt_requestHeaders);
  }
  generateDistanceWithinUrl(layer, view, coord) {
    var point = ol.proj.toLonLat(coord);
    var wfsInfo = layer.get('wfsInfo');
    var url = new URL(wfsInfo.url);
    url.set('query', {
      service: 'WFS',
      request: 'GetFeature',
      version : '1.1.0',
      srsName: view.getProjection().getCode(),
      typename: wfsInfo.featureType,
      cql_filter: 'DWITHIN(' + wfsInfo.geometryName + ', Point(' + point[1] + ' ' + point[0] + '), 0.1, meters)'
    });
    return url.toString();
  }
  distanceWithin(layer, view, coord, onSuccess, onFailure, opt_proxy, opt_requestHeaders) {
    return util.doGET(util.getProxiedUrl(this.generateDistanceWithinUrl(layer, view, coord), opt_proxy), function(xmlhttp) {
      var features = wfsFormat.readFeatures(xmlhttp.responseXML);
      if (features.length > 0) {
        onSuccess.call(this, features[0]);
      } else if (onFailure) {
        onFailure.call(this, xmlhttp);
      }
    }, onFailure, this, opt_requestHeaders);
  }
  readResponse(data, xmlhttp, onSuccess, onFailure) {
    if (global.Document && data instanceof global.Document && data.documentElement &&
      data.documentElement.localName == 'ExceptionReport') {
      if (onFailure) {
        onFailure.call(this, xmlhttp, data.getElementsByTagNameNS('http://www.opengis.net/ows', 'ExceptionText').item(0).textContent);
      }
    } else {
      onSuccess(data);
    }
  }
  getDeletePayload(wfsInfo, feature) {
    var node = wfsFormat.writeTransaction(null, null, [feature], {
      featureNS: wfsInfo.featureNS,
      featureType: wfsInfo.featureType
    });
    return xmlSerializer.serializeToString(node);
  }
  deleteFeature(layer, feature, onSuccess, onFailure) {
    var wfsInfo = layer.get('wfsInfo');
    return util.doPOST(wfsInfo.url, this.getDeletePayload(wfsInfo, feature),
      function(xmlhttp) {
        this.handleDeleteResponse(xmlhttp, onSuccess, onFailure);
      },
      onFailure,
      this
    );
  }
  handleDeleteResponse(xmlhttp, onSuccess, onFailure) {
    var data = xmlhttp.responseXML;
    this.readResponse(data, xmlhttp, function(data) {
      var result = wfsFormat.readTransactionResponse(data);
      if (result && result.transactionSummary.totalDeleted === 1) {
        onSuccess.call(this);
      } else {
        onFailure.call(this, xmlhttp);
      }
    }, onFailure);
  }
  getUpdatePayload(wfsInfo, view, feature, values) {
    var fid = feature.getId();
    var clone;
    var featureGeometryName = feature.getGeometryName();
    if (values !== null) {
      clone = new ol.Feature(values);
    } else {
      var properties = feature.getProperties();
      // get rid of boundedBy which is not a real property
      // get rid of bbox (in the case of GeoJSON)
      delete properties.boundedBy;
      delete properties.bbox;
      if (wfsInfo.geometryName !== featureGeometryName) {
        properties[wfsInfo.geometryName] = properties[featureGeometryName];
        delete properties[featureGeometryName];
      }
      clone = new ol.Feature(properties);
    }
    clone.setId(fid);
    if (view !== null && wfsInfo.geometryName !== featureGeometryName) {
      clone.setGeometryName(wfsInfo.geometryName);
    }
    var node = wfsFormat.writeTransaction(null, [clone], null, {
      gmlOptions: view !== null ? {
        srsName: view.getProjection().getCode()
      } : undefined,
      featureNS: wfsInfo.featureNS,
      featureType: wfsInfo.featureType
    });
    return xmlSerializer.serializeToString(node);
  }
  handleUpdateResponse(xmlhttp, onSuccess, onFailure) {
    var data = xmlhttp.responseXML;
    this.readResponse(data, xmlhttp, function(data) {
      var result = wfsFormat.readTransactionResponse(data);
      if (result) {
        onSuccess.call(this, result);
      } else {
        onFailure.call(this, xmlhttp);
      }
    }, onFailure);
  }
  updateFeature(layer, view, feature, values, onSuccess, onFailure, opt_proxy, opt_requestHeaders) {
    var wfsInfo = layer.get('wfsInfo');
    return util.doPOST(util.getProxiedUrl(wfsInfo.url, opt_proxy), this.getUpdatePayload(wfsInfo, view, feature, values),
      function(xmlhttp) {
        this.handleUpdateResponse(xmlhttp, onSuccess, onFailure);
      },
      onFailure,
      this,
      undefined,
      false,
      opt_requestHeaders
    );
  }
  getInsertPayload(wfsInfo, view, feature) {
    var node = wfsFormat.writeTransaction([feature], null, null, {
      gmlOptions: {
        srsName: view.getProjection().getCode()
      },
      featureNS: wfsInfo.featureNS,
      featureType: wfsInfo.featureType
    });
    return xmlSerializer.serializeToString(node);
  }
  handleInsertResponse(xmlhttp, onSuccess, onFailure) {
    var data = xmlhttp.responseXML;
    this.readResponse(data, xmlhttp, function(data) {
      var result = wfsFormat.readTransactionResponse(data);
      if (result) {
        var insertId = result.insertIds[0];
        onSuccess.call(this, insertId);
      } else {
        onFailure.call(this, xmlhttp);
      }
    }, onFailure);
  }
  insertFeature(layer, view, feature, onSuccess, onFailure, opt_proxy, opt_requestHeaders) {
    var wfsInfo = layer.get('wfsInfo');
    return util.doPOST(util.getProxiedUrl(wfsInfo.url, opt_proxy), this.getInsertPayload(wfsInfo, view, feature),
      function(xmlhttp) {
        this.handleInsertResponse(xmlhttp, onSuccess, onFailure);
      },
      onFailure,
      this,
      undefined,
      false,
      opt_requestHeaders
    );
  }
}

export default new WFSService();
