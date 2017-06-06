Chart to show feature info.


Allow for the creation of charts based on selected features of a layer. Features of a given layer may be selected with the [QueryBuilder](../QueryBuilder.html) component.


```javascript
var charts = [{
  title: 'Airports count per use category',
  categoryField: 'USE',
  layer: 'lyr03',
  valueFields: [],
  displayMode: 2,
  operation: 2
}, {
  title: 'Forest area total surface',
  categoryField: 'VEGDESC',
  layer: 'lyr01',
  valueFields: ['AREA_KM2'],
  displayMode: 1,
  operation: 2
}];
```

```xml
<Chart charts={charts}/>
```

##### Chart 1:

![Chart](../Chart.png)

This image implements the first chart in the list above. All of the features in the layer used have been selected via a QueryBuilder component and are styled as yellow circles.

##### Chart 2:

![Chart](../Chart2.png)

This image implements the second chart in the list above. All of the features in the layer used have been selected via a QueryBuilder component and are styled as yellow polygons.
