// Enter your custom JavaScript code here

function beforeMapLoads(){
    tasks = ["DT", "VR", "RID", "CID"];
    aliases = ["Driving Test", "Vehicle Registration", "REAL ID", "Regular CA ID"];
    dmvConfig = {
        "id": "DMVs",
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
	          {"name": "address", "alias": "Address"}
        ],
        "hidden": true,
        "visible": false,
        "tooltipField": "name",
        "popup": true,
    };

    tasks.map((t,i) => {
        console.log(t,i);
        task_layer = Object.assign({}, dmvConfig);
        task_layer.id = t;
        task_layer.name = t;
        task_layer.label = {
            "name":t, "alias":aliases[i], "minZoom":9
        };
        config.layers.push(task_layer);
    });
    // Part of exclusive group, have only one be visible
    config.layers[0].visible = true;

    tasks.map((t,i) => dmvConfig.outFields.push({"name": t, "alias": aliases[i]}));
    dmvConfig.hidden = false;
    dmvConfig.visible = true;
    dmvConfig.hideFromTOC = true;
    config.layers.push(Object.assign({}, dmvConfig));
    // Must remove from ToC afterwards


    // // This function is called before the map loads, and is useful for manipulating the config object, eg
    // // to add a new custom layer.

    // // Create a layer which is based on a query string in the URL - this shows the US state based on the query
    // // value, eg bootleaf.html/?query=california
    // var statesConfig = {
    // 	"id": "us_states",
    // 	"name": "States",
    // 	"type": "agsDynamicLayer",
    // 	"url": "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/",
    // 	"layers": [5],
    // 	"useCors": false,
    // 	"visible": true
    // }

    // var query = getURLParameter('query');
    // if(query) {
    // 	statesConfig.layerDefs = "5: STATE_NAME = '" + query + "'";
    // 	statesConfig.name += " (" + query + ")";
    // }

    // // Add this layer to the TOC and map.
    // config.layers.push(statesConfig);
    // for (i in config.tocCategories){
    // 	if (config.tocCategories[i]['name'] === 'ArcGIS Layers') {
    // 		config.tocCategories[i]['layers'].push(statesConfig.id);
    // 	}
    // }

    // // If there are any layers defined in the URL, add this layer to the list so it draws by default
    // if(bootleaf.layerParams.length > 0){
    // 	bootleaf.layerParams.push(statesConfig.id);
    // }

}

function afterMapLoads(){
    bootleaf.layers.filter(l=>l.layerConfig.hideFromTOC)
        .map(l=>bootleaf.TOCcontrol.removeLayer(l));
    // This function is run after the map has loaded. It gives access to bootleaf.map, bootleaf.TOCcontrol, etc
}
