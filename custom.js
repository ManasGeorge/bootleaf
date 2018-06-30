// Enter your custom JavaScript code here
tasks = ["DT", "VR", "RID", "CID"];
aliases = ["Driving Test", "Vehicle Registration", "REAL ID", "Regular CA ID"];

function beforeMapLoads(){
    officeUrl = "https://www.dmv.ca.gov/wasapp/foa/clear.do?goTo=officeVisit&localeName=en";
    dtUrl = "https://www.dmv.ca.gov/wasapp/foa/clear.do?goTo=driveTest&localeName=en";
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
            "fillOpacity": 1.0,
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
        "popup": false,
        "tooltipField": "name",
    };

    // Create the labels for each task, add them as label-only layers
    tasks.map((t,i) => {
        console.log(t,i);
        task_layer = Object.assign({}, dmvConfig);
        task_layer.id = aliases[i];
        task_layer.name = aliases[i];
        task_layer.label = {
            "name":t, "alias":aliases[i], "minZoom":10,
        };
        config.layers.push(task_layer);
    });

    // Part of exclusive group, have only one be visible
    config.layers[0].visible = true;
    config.tocCategories.push({
        "name": "Appointment Task",
        "layers" : aliases.map(a=>a+"_labels"),
        "exclusive": true
    });

    // Add actual visible layer with markers for the DMV locations + links
    var dmvMarker = L.AwesomeMarkers.icon({
        icon: 'car',
        prefix: 'fa',
        markerColor: 'red',
    });

    tasks.map((t,i) => dmvConfig.outFields.push(
        {"name": t, "alias": "<a href='"
         + ((t=="DT")?dtUrl:officeUrl)
         + "'>" + aliases[i] + "</a>"}));
    dmvConfig.hidden = false;
    dmvConfig.visible = true;
    dmvConfig.popup = true;
    dmvConfig.hideFromTOC = true;
    dmvConfig.icon = dmvMarker;
    config.layers.push(Object.assign({}, dmvConfig));
}

function afterMapLoads(){
    // Remove the DMV markers layer from the TOC 
    bootleaf.layers.filter(l=>l.layerConfig.hideFromTOC)
        .map(l=>bootleaf.TOCcontrol.removeLayer(l));
}
