var config = {
    "title": "CA DMV Appointment Finder",
    "start": {
        "center": [37.3861, -122.0839],
        "zoom": 7,
        "attributionControl": false,
        "zoomControl": false
    },
    "about": {
        "title": "CA DMV Finder",
        "contents": "This tool maps California DMVs with the earliest available appointment times for a behind-the wheel driving test, commercial driving test, or an office visit (REAL ID application/renewal, Driver's License application/renewal, or Title/Registration of a vessel or vehicle)."
    },
    "controls": {
        "zoom": {
            "position": "topleft"
        },
        "leafletGeocoder": {
            //https://github.com/perliedman/leaflet-control-geocoder
            "collapsed": true,
            "position": "topleft",
            "placeholder": "Search for a location",
            "type": "Google", // OpenStreetMap, Google, ArcGIS
        },
        "TOC": {
            //http://leafletjs.com/reference-1.0.2.html#control-layers-option
            "collapsed": false,
            "uncategorisedLabel": "Layers",
            "position": "topright",
            "toggleAll": true
        },
        "history": {
            "position": "bottomleft"
        },
    },
    "basemaps": ['esriStreets', 'OpenStreetMap', 'esriGray', 'esriDarkGray'],
    "defaultIcon": {
        "imagePath": "http://leafletjs.com/examples/custom-icons/",
        "iconUrl": "leaf-green.png",
        "shadowUrl": "leaf-shadow.png",
        "iconSize":     [38, 95],
        "shadowSize":   [50, 64],
        "iconAnchor":   [22, 94],
        "shadowAnchor": [4, 62],
        "popupAnchor":  [-3, -76]
    },
    "projections": [
        {4269: '+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs '}
    ],
    "highlightStyle": {
        "weight": 2,
        "opacity": 1,
        "color": 'white',
        "dashArray": '3',
        "fillOpacity": 0.5,
        "fillColor": '#E31A1C',
        "stroke": true
    },
    "layers": [
        {
            "id": "dmvs",
            "name": "DMVs",
            "type": "geoJSON",
            "cluster": false,
            "showCoverageOnHover": true,
            "minZoom": 1,
            "url": "./data/dmvs.geojson",
            "style": {
                "stroke": true,
                "fillColor": "#00FFFF",
                "fillOpacity": 0.5,
                "radius": 10,
                "weight": 0.5,
                "opacity": 1,
                "color": '#727272',
            },
            "outFields": [
	              {"name": "name", "alias": "Name"},
	              {"name": "address", "alias": "Address"},
	              {"name": "earliest", "alias": "Earliest Appointment"},
            ],
	          "visible": true,
	          "label": {
	  	          "name": "earliest",
	  	          "minZoom": 8,
	          },
            "tooltipField": "name",
            "popup": true,
        }
    ]
};
