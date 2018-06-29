var config = {
    "title": "CA DMV Appointment Finder",
    "start": {
        "center": [37.3861, -122.0839],
        "zoom": 10,
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
            "uncategorisedLabel": false,
            "position": "topright",
            "toggleAll": false
        },
        "history": {
            "position": "bottomleft"
        },
    },
    "tocCategories": [
    ],
    "basemaps": ['esriNationalGeographic', 'esriStreets', 'OpenStreetMap', 'esriShadedRelief', 'esriTerrain'],
    "defaultIcon": L.AwesomeMarkers.icon({
        icon: 'home',
        prefix: 'fa',
        markerColor: 'red'
    }),
    "projections": [
        {4269: '+proj=longlat +ellps=GRS80 +datum=NAD83 +no_defs '}
    ],
    "highlightStyle": {
        "weight": 2,
        "opacity": 1,
        "color": 'white',
        "dashArray": '3',
        "fillOpacity": 0.8,
        "fillColor": '#E31A1C',
        "stroke": true
    },
    "layers": [
    ]
};
