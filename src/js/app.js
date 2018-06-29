var bootleaf = {
    "mapWkid": 4326,
    "layerTOC": {},
    "tocOptions": {
        "exclusiveGroups": [],
        "groupCheckboxes": false
    },
    "activeTool": null,
    "identifyLayers": [],
    "layers": [],
    "wfsLayers": [],
    "labelLayers": [],
    "identifyLayerHeadings": [],
    "clickTolerance": 5,
    "currentTool": null,
    "queryTasks": [],
    "queryReults": {},
    "visibleLayers": [],
    "basemaps": [
        {"id": "MapboxStreets", "type": "mapbox", "theme": "streets", "label": "Streets (MapBox)"},
        {"id": "MapboxLight", "type": "mapbox", "theme": "light", "label": "Light (MapBox)"},
        {"id": "MapboxDark", "type": "mapbox", "theme": "dark", "label": "Dark (MapBox)"},
        {"id": "MapboxSatellite", "type": "mapbox", "theme": "satellite", "label": "Satellite (MapBox)"},
        {"id": "MapboxSatelliteStreets", "type": "mapbox", "theme": "streets-satellite", "label": "Streets with Satellite (MapBox)"},
        {"id": "MapboxHighContrast", "type": "mapbox", "theme": "high-contrast", "label": "High-contrast (MapBox)"},
        {"id": "esriStreets", "type": "esri", "theme": "Streets", "label": "Streets (ArcGIS)"},
        {"id": "esriGray", "type": "esri", "theme": "Gray", "label": "Light gray (ArcGIS)"}, 
        {"id": "esriTopographic", "type": "esri", "theme": "Topograhic", "label": "Topographics (ArcGIS)"},
        {"id": "esriImagery", "type": "esri", "theme": "Imagery", "label": "Satellite (ArcGIS)"},
        {"id": "esriShadedRelief", "type": "esri", "theme": "ShadedRelief", "label": "Shaded relief (ArcGIS)"},
        {"id": "esriTerrain", "type": "esri", "theme": "Terrain", "label": "Terrain (ArcGIS"},
        {"id": "esriDarkGray", "type": "esri", "theme": "DarkGray", "label": "Dark gray (ArcGIS)"},
        {"id": "esriNationalGeographic", "type": "esri", "theme": "NationalGeographic", "label": "National Geographic (ArcGIS)"},
        {"id": "esriOceans", "type": "esri", "theme": "Oceans", "label": "Oceans (ArcGIS)"},
        {"id": "OpenStreetMap", "type": "tiled", "label": "OpenStreetMap", "url": "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
    ]
};

$(document).ready(function(){
    if (typeof config === 'undefined') {
        $.growl.error({message: "Error - the configuration file is not found!", fixed: true});
        return null
    }

    // Get parameters passed via the URL. Overwrite the config file's start parameter
    if(getURLParameter("lat") !== null && getURLParameter("lng") !== null){
        config.start.center = [getURLParameter("lat"), getURLParameter("lng")]
    }
    if(getURLParameter("zoom") !== null){
        config.start.zoom = getURLParameter("zoom");
    }

    // If there are layers in the URL, handle them in the layer creation functions
    if(getURLParameter("layers")) {
        bootleaf.layerParams = getURLParameter("layers").split(",");
    } else {
        bootleaf.layerParams = [];
    }

    // If the basemap is specified in the URL, it's handled in the basemap creation function
    if(getURLParameter("basemap") !== null){
        bootleaf.defaultBasemap = getURLParameter("basemap");
    }

    // Allows for insertion of custom properties to manipulate the config file
    try{
        beforeMapLoads();
    } catch (error){
        $.growl.error({message: "There was a problem running the BeforeMapLoads custom code: " + error.message, fixed: true});
    }

    // Set the page title
    if (config.title !== undefined) {document.title = config.title;}

    // Set the About page content
    if (config.about !== undefined) {
        if (config.about.title !== undefined) {
            $("#aboutTitle").html(config.about.title);
        }
        if (config.about.contents !== undefined) {
            $("#aboutContents").html(config.about.contents);
        }
    }

    // Set the style for highlighting features - used by Identify and Query Widget
    bootleaf.highlightStyle = config.highlightStyle || {
        "stroke": false,
        "fillColor": "#00FFFF",
        "fillOpacity": 0.7,
        "radius": 10,
        "weight": 2,
        "opacity": 1,
        "color": '#727272',
        "dashArray": '3'
    };

    // Override the default icon if an icon is specified. See http://leafletjs.com/reference-1.1.0.html#icon-default
    if (config.defaultIcon !== undefined){
        var options = ["imagePath", "iconUrl", "iconSize", "iconAnchor",
                       "popupAnchor", "shadowUrl", "shadowSize", "shadowAnchor"];
        for (var o = 0; o < options.length; o++){
            var option = options[o];
            if (config.defaultIcon[option] !== undefined){
                L.Icon.Default.prototype.options[option] = config.defaultIcon[option];
            }
        }
    }

    // Build layers from the config file
    if(config.layers === undefined){
        config.layers = [];
    }
    for (var layerIdx = 0; layerIdx < config.layers.length; layerIdx ++){
        try {
            var layer;
            var layerConfig = config.layers[layerIdx];
            var layerType = layerConfig.type;
            var layerId = layerConfig.id || "unknown layer";

            // If a style has been specified, run a pointToLayer function to allow it to work
            if (layerConfig.style){
                layerConfig.pointToLayer = function (feature, latlng) {
                    return L.circleMarker(latlng);
                };
            }

            // Enable the icon if specified
            if (layerConfig.icon !== undefined){
                var icon = L.icon(layerConfig.icon);
                layerConfig.pointToLayer = function (feature, latlng) {
                    var marker = L.marker(latlng,{
                        icon: icon
                    });
                    return marker;
                };
            }
            
            if (layerType === "geoJSON") {
                $.ajax({
                    dataType: "json",
                    type: 'GET',
                    url: layerConfig.url,
                    beforeSend: function (jqXHR, settings) {
                        // add required properties so they can be accessed in the success function
                        jqXHR.layerConfig = layerConfig;
                    },
                    success: function(data, textStatus, jqXHR) {
                        // If the layer has labels configured, create an empty label layer.
                        // It will be populated later
                        if (jqXHR.layerConfig.label !== undefined){
                            buildLabelLayer(jqXHR.layerConfig);
                        }

                        // Handle cluster/normal layers differently
                        if (jqXHR.layerConfig.icon !== undefined){
                            jqXHR.layerConfig.pointToLayer = function (feature, latlng) {
                                var marker = L.marker(latlng,{
                                    icon: L.icon(jqXHR.layerConfig.icon)
                                });
                                return marker;
                            };
                        }

                        jqXHR.layerConfig.onEachFeature = configurePopup;

                        if (jqXHR.layerConfig.cluster) {
                            jqXHR.layer = L.markerClusterGroup(jqXHR.layerConfig);
                            jqXHR.tempLayer = new L.geoJson(null,jqXHR.layerConfig);
                            $(data.features).each(function(key, data) {
                                jqXHR.tempLayer.addData(data);
                            });
                            jqXHR.layer.addLayer(jqXHR.tempLayer);
                        } else {
                            jqXHR.layer = new L.geoJson(null, jqXHR.layerConfig);
                            $(data.features).each(function(key, data) {
                                jqXHR.layer.addData(data);
                            });
                        }
                        
                        jqXHR.layer.layerConfig = jqXHR.layerConfig;
                        if (!jqXHR.layerConfig.hidden) {addLayer(jqXHR.layer);}
                        // Display labels if configured for this layer
                        if (jqXHR.layer.layerConfig.label !== undefined){
                            createLabels(jqXHR.layer.layerConfig, data);
                        }

                        updateScaleThresholds();
                        afterMapLoads();
                    },
                    error: function(jqXHR, textStatus, error) {
                        $.growl.warning({ message: "There was a problem fetching the features for " +
                                          jqXHR.layerConfig.id});

                        // Remove this layer from the map, TOC and Visible Layers array
                        if(jqXHR.layer !== undefined) {
                            try{
                                bootleaf.map.removeLayer(jqXHR.layer);
                                bootleaf.visibleLayers.splice(bootleaf.visibleLayers.indexOf(jqXHR.layer.id), 1);
                                bootleaf.TOCcontrol.removeLayer(jqXHR.layer);
                            } catch(err){
                                console.log("There was a problem removing this layer from the map");
                            }
                        }
                    }
                });
            }
        } catch(err) {
            $.growl.error({ message: err.message});
        }
    }

    // Initialise the map using the start parameters from the config file, and the visibleAtStart layers
    if(config.start.maxZoom === undefined){config.start.maxZoom = 19;} // Required for the Marker Clusterer
    bootleaf.map = L.map("map", config.start);

    // Set default projections and load any user-defined projections. Create proj4 definitions from these
    bootleaf.projections = {
        102100: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
        4326: '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs',
        4283: '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'
    };
    $.map( config.projections || [], function( val, i ) {
        for (var key in val){
            bootleaf.projections[key] = val[key];
        }
    });
    for (var wkid in bootleaf.projections){
        var def = bootleaf.projections[wkid];
        proj4.defs('EPSG:' + wkid, def);    
    }

    /* Highlight layer, used for Identify and Query results */
    bootleaf.highlightLayer = L.geoJson(null);

    // When the map loads, or its extent changes, update any WFS layers
    bootleaf.map.on("moveend", function() {
        updateScaleThresholds();
    });
    updateScaleThresholds();

    if(config.controls){
        // Zoom Control
        if(config.controls.zoom) {
            if (navigator.userAgent.match(/iPad/i) === null){
                bootleaf.zoomControl = L.control.zoom({
                    position: config.controls.zoom.position || "bottomright"
                }).addTo(bootleaf.map);
            }
        }

        // TOC control
        if(config.controls.TOC){
            bootleaf.tocOptions['position'] = config.controls.TOC.position || 'topright';
            bootleaf.tocOptions['collapsed'] = config.controls.TOC.collapsed || false;
            bootleaf.tocOptions['toggleAll'] = config.controls.TOC.toggleAll || false;
            
            bootleaf.TOCcontrol = L.control.groupedLayers(null, bootleaf.layerTOC, bootleaf.tocOptions);
            bootleaf.map.addControl(bootleaf.TOCcontrol);
        }

        // History control  
        if (config.controls.history) {
            try{
                bootleaf.historyControl = new L.HistoryControl(config.controls.history).addTo(bootleaf.map);
            }catch(err){
                $.growl.warning({ message: "There was a problem enabling history on this application"});
            }
        }

        // Geocoder control
        // https://github.com/perliedman/leaflet-control-geocoder
        if(config.controls.leafletGeocoder !== undefined) {
            var geocoder = L.Control.Geocoder.nominatim(config.controls.leafletGeocoder);
            if(config.controls.leafletGeocoder.type === "Harmony") {
                geocoder = L.Control.Geocoder.harmony(config.controls.leafletGeocoder);
            } else if (config.controls.leafletGeocoder.type === "OpenStreetMap") {
                geocoder = L.Control.Geocoder.nominatim(config.controls.leafletGeocoder);
            } else if (config.controls.leafletGeocoder.type === "Google") {
                geocoder = L.Control.Geocoder.google(config.controls.leafletGeocoder);
            } else if (config.controls.leafletGeocoder.type === "ArcGIS") {
                geocoder = L.Control.Geocoder.arcgis(config.controls.leafletGeocoder);
            }

            if (config.controls.leafletGeocoder.suffix !== undefined){
                geocoder.suffix = config.controls.leafletGeocoder.suffix;
            }

            bootleaf.leafletGeocoder = L.Control.geocoder({
                defaultMarkGeocode: false,
                position: config.controls.leafletGeocoder.position || "bottomright",
                placeholder: config.controls.leafletGeocoder.placeholder || "Search for an address",
                collapsed: config.controls.leafletGeocoder.collapsed || false,
                geocoder: geocoder
            }).on('markgeocode', function(e) {
                var bbox = e.geocode.bbox;
                var poly = L.polygon([
                    bbox.getSouthEast(),
                    bbox.getNorthEast(),
                    bbox.getNorthWest(),
                    bbox.getSouthWest()
                ]).addTo(bootleaf.map);
                bootleaf.map.fitBounds(poly.getBounds());
            }).addTo(bootleaf.map);

        }
    }

    // Basemap setup
    {
        // Add basemaps to the dropdown. If the basemaps option is used in the config file,
        // only load those basemaps, otherwise load them all
        $.map( bootleaf.basemaps || [], function( basemap, i ) {
            if(config.basemaps === undefined || $.inArray(basemap.id, config.basemaps) > -1){
                var html = '<li data-basemapId="' + basemap.id + '">';
                html += '<a href="#" data-toggle="collapse" data-target=".navbase-collapse.in" class="liBasemap" data-type="' + basemap.type + '" data-theme="' + basemap.theme + '"';
                if(basemap.url){
                    html += 'data-url="' + basemap.url + '"';
                }
                html += ' data-id="' + basemap.id + '">' + basemap.label + '</a></li>';
                $("#ulBasemap").append(html);
            }

            // Set the default basemap. It's either the first in the config.basemaps list,
            // or the first in the default list
            if(bootleaf.defaultBasemap && basemap.id === bootleaf.defaultBasemap){
                setBasemap(basemap);
            } else if (bootleaf.defaultBasemap === undefined){
                if(config.basemaps && config.basemaps[0] === basemap.id){
                    setBasemap(basemap);
                }
            }
        });

        // Specify the default basemap if it wasn't set above
        if(!config.basemaps && !bootleaf.defaultBasemap){
            setBasemap(bootleaf.basemaps[0]);
        }

        if(config.basemaps === undefined || (config.basemaps !== undefined && config.basemaps.length > 1)){
            $('*[data-basemapId="' + bootleaf.defaultBasemapId + '"]').addClass("active");

            // Change the basemap when the user changes the dropdown
            $(".liBasemap").click(function(evt) {
                // Update the Active class for this basemap
                $("#ulBasemap li").removeClass("active");
                $('*[data-basemapId="' + this.id + '"]').addClass("active");
                var basemap = {
                    "type": this.dataset['type'],
                    "id": this.dataset.id,
                    "theme": this.dataset.theme
                };
                if (this.dataset['url']) {basemap.url = this.dataset['url']}
                setBasemap(basemap);
            });

        } else {
            $("#basemapDropdown").hide();
        } 
    }
    
    // Hide the loading indicator
    // TODO - show the loading indicator when something happens
    $("#loading").hide();

    // Set the active tool, if applicable and supported by the current layers
    if (config.activeTool !== undefined){
        $(".liMapTools").removeClass("active");

        if (config.activeTool === 'identify') {
            if (bootleaf.identifyLayers && bootleaf.identifyLayers.length > 0){
                configureIdentifyTool();
                $('*[data-tool="' +  config.activeTool + '"]').addClass("active");
            }
        } else if (config.activeTool === 'coordinates') {
            configureCoordinatesTool();
            $('*[data-tool="' +  config.activeTool + '"]').addClass("active");
        } else if (config.activeTool === 'queryWidget'){
            if (bootleaf.queryTasks && bootleaf.queryTasks.length > 0){
                configureQueryWidget();
                $('*[data-tool="' +  config.activeTool + '"]').addClass("active");
            }
        }
        // TODO - add more tools here, with corresponding configureXXXtool functions

    } else {
        $("#sidebar").hide("slow");
        $(".liMapTools").removeClass("active");
    }

    // Run custom code after the map has loaded
    try{
        afterMapLoads();
    } catch (error){
        $.growl.error({ message: "There was a problem running the AfterMapLoads custom code: " + error.message});
    }

});

function reorderLayers(){
    // If any layers are tagged as showOnTop, bring them to the top of the map
    for (var i = 0; i < bootleaf.layers.length; i++){
        var layer = bootleaf.layers[i];
        if (bootleaf.map.hasLayer(layer) && layer.layerConfig && layer.layerConfig.showOnTop) {
            layer.bringToFront();
        }
    }

}

function addLayer(layer){
    // Once the layer has been created, add it to the map and the applicable TOC category
    var layerConfig = layer.layerConfig;
    layer.name = layerConfig.name || layerConfig.id || "unknown layer name";

    // Insert a span to hold the layer's legend information, if specified
    if (layerConfig.legendClass !== undefined){
        layer.name = "<span class='legend " + layerConfig.legendClass + "'></span> " + layer.name;
    }
    var layerAdded = false;

    // Add this layer to the TOC (within a category if specified in the config file)
    var tocCategories = config.tocCategories || [];
    for (var tocIdx = 0 ; tocIdx < tocCategories.length; tocIdx ++) {
        var tocCategory = tocCategories[tocIdx];
        var tocCategoryName = tocCategory.name;
        var tocLayers = tocCategory.layers || [];

        // Add this category to the TOC
        if (tocCategoryName in bootleaf.layerTOC === false) {
            bootleaf.layerTOC[tocCategoryName] = {};
            if (tocCategory.exclusive) {
                bootleaf.tocOptions.exclusiveGroups.push(tocCategoryName);
                // Add an option to switch off all layers in the radio group
                bootleaf.layerTOC[tocCategoryName]["none"] = L.layerGroup();
            }
        }

        // Add this layer to the appropriate category, if applicable
        if ($.inArray(layerConfig.id, tocLayers) > -1) {
            bootleaf.layerTOC[tocCategoryName][layer.name] = layer;
            layer.tocCategoryName = tocCategoryName;
            layerAdded = true;
        }
    }

    if (layerAdded === false) {
        var uncategorisedLabel = "Uncategorised";
        if(config.controls && config.controls.TOC && config.controls.TOC.uncategorisedLabel){
            uncategorisedLabel = config.controls.TOC.uncategorisedLabel;
        }
        if (uncategorisedLabel in bootleaf.layerTOC === false){
            bootleaf.layerTOC[uncategorisedLabel] = {};
        }
        bootleaf.layerTOC[uncategorisedLabel][layer.name] = layer;
    }

    // Layers are visible by default, unless otherwise specified in the config, or unless
    // any layers are passed in URL parameters (in which case, only those layers are visisble)
    if(config.start.layers == undefined) { config.start["layers"] = [];}
    if(bootleaf.layerParams.length > 0) {
        if(bootleaf.layerParams.indexOf(layerConfig.id) > -1){
            config.start.layers.push(layer);
            bootleaf.visibleLayers.push(layerConfig.id);
            layer.tocState = "on";
        }
    } else if (layerConfig.visible === undefined || layerConfig.visible == true) {
        config.start.layers.push(layer);
        bootleaf.visibleLayers.push(layerConfig.id);
        layer.tocState = "on";
    }

    // GeoJSON layers have to be added manually, since this function is called asynchronously after
    // the other layers have already been added to the map's layers list
    if (layerConfig.type === 'geoJSON'){
        if ($.inArray(layerConfig.id, bootleaf.visibleLayers) > -1) {
            layer.addTo(bootleaf.map);
            layer.tocState = "on";
        }
        bootleaf.TOCcontrol.addOverlay(layer, layer.name, layer.tocCategoryName);
    }

    if (layer.tocState === undefined){
        layer.tocState = "off";
    }
    bootleaf.layers.push(layer);   

}

function setBasemap(basemap){
    if (bootleaf.basemapLayer) {bootleaf.map.removeLayer(bootleaf.basemapLayer);}
    var options = {
        "maxZoomLevel": 23,
        "maxZoom": 23,
        "maxNativeZoom": 19,
    };
    if (basemap.type === "esri") {
        if ($.inArray(basemap.id, ["esriGray", "esriDarkGray"]) > -1) {
            options.maxNativeZoom = 16;
        }
        var esriTheme = basemap.theme || "Streets";
        bootleaf.basemapLayer = L.esri.basemapLayer(esriTheme, options);
    } else if (basemap.type === 'tiled'){
        bootleaf.basemapLayer = L.tileLayer(basemap.url, options);
    } else if (basemap.type === 'mapbox'){
        var mapboxKey = config.mapboxKey || "";
        if (mapboxKey === '' || mapboxKey === undefined){
            $.growl.warning({ title: "Map Box error", message: "Ensure that you have specified a valid MapBox key in the config file"});
        }
        var mapboxTheme = basemap.theme || "streets";
        bootleaf.basemapLayer = L.tileLayer("http://a.tiles.mapbox.com/v4/mapbox." + mapboxTheme + "/{z}/{x}/{y}.png?access_token=" + mapboxKey, options);
    }
    bootleaf.map.addLayer(bootleaf.basemapLayer);
    // bootleaf.basemapLayer.bringToBack();
    bootleaf.currentBasemap = basemap.id;
    $('*[data-basemapId="' + basemap.id + '"]').addClass("active");
}

function configurePopup(feature, layer) {
    if (feature.properties) {
        if (this.popup !== undefined){
            var popupContent = "<table class='table table-condensed'>";
            for (key in feature.properties){
                var val = feature.properties[key];
                // Ignore nulls, and GeoServer default attributes such as bbox,
                // geom and gid. Add others to this list if required
                if (val !== null && val !== undefined && $.inArray(key, ["bbox", "geom", "gid"]) < 0) {
                    // Use the field alias if supplied in the outFields parameter
                    if (this.outFields !== undefined) {
                        var outFields = this.outFields;
                        var outputs = formatPopup(key, val, outFields);
                        key = outputs[0];
                        val = outputs[1];
                    }
                    if (key !== null) {
                        popupContent += "<tr><td>" + key + "</td><td>"+ val + "</td></tr>";
                    }
                }
            }

            popupContent = popupContent.replace(/>,</g, "><");
            popupContent += "</table>";
            layer.bindPopup(popupContent);
        }

        if (this.tooltipField !== undefined){
            try{
                var tooltipContent = feature.properties[this.tooltipField];
                layer.bindTooltip(tooltipContent);
            } catch(err){
                console.log("There was an error configuring the tooltip");
            }
        }
    }
}

function formatPopup(key, val, outFields){
    // Given an input field name and value, return the appropriately formatted values
    for (var i=0; i < outFields.length; i++){
        var field = outFields[i];
        if (field.name !== undefined && field.name === key) {
            if (field.alias !== undefined){
                key = field.alias;
            }
            if (field.hidden === undefined || field.hidden === false){
                val = formatValue(val, field);
            } else {
                key = null;
            }
            break;
        }
    }
    return [key, val];
}

function formatValue(value, field){
    // Given a value and a field definition, apply the appropriate formatting
    // Used in the Query Widget and Identify functions

    try{
        if (field.decimals !== undefined) {
            value = round(value, field.decimals);
        }
        if (field.date !== undefined && value !== null){
            try {
                var theDate = moment(new Date(value));
                var theYear = theDate.year();
                var theMonth = theDate.month() + 1;
                if (theMonth.toString().length === 1){
                    theMonth = "0" + theMonth;
                }
                var theDay = theDate.date();
                if (theDay.toString().length === 1){
                    theDay = "0" + theDay;
                }

                value = theYear + "/" + theMonth + "/" + theDay;
            } catch(err) {
                console.log("Please ensure that Moment.js has been included");
            }
            
        }
        if (field.thousands !== undefined) {
            value = addThousandsSeparator(value);
        }
        if (field.prefix !== undefined){
            value = field.prefix + value;
        }
    } catch(err) {
        console.log("There was a problem applying field formatting");
    }

    return (value);
}

function updateIdentifyLayers(){
    // This function runs with the visible layers change, to ensure that only
    // identifiable, visible layers can be identified
    bootleaf.identifyLayers = $.map( bootleaf.map._layers || [], function( val, i ) {
        if (val.layerConfig && val.layerConfig.identify !== undefined) {
            return val;
        };
    });

    if(bootleaf.identifyLayers.length > 0) {
        $("#liIdentify").removeClass('disabled');
        if (bootleaf.activeTool === 'identify'){
            enableIdentify();
        }
    } else {
        $("#liIdentify").addClass('disabled');
        disableIdentify();
    }
}

function setMapCursor(cursor){
    $('.leaflet-container').css('cursor', cursor);
}

function switchOffTools(){
    // remove the listeners for all tools
    bootleaf.map.off('click', showMarker);
    bootleaf.map.off('click', runIdentifies);
    setMapCursor('default');
    bootleaf.activeTool = null;
    bootleaf.map.removeLayer(bootleaf.highlightLayer);

    // Hide the draw toolbar on the Query Widget and remove any polygons
    if (bootleaf.drawControl && bootleaf.drawControl._map !== undefined){
        bootleaf.drawControl.remove();
        bootleaf.queryPolygon.clearLayers();
    }
}

/**************************************************************************************************/
// COORDINATES TOOL START
/**************************************************************************************************/

function configureCoordinatesTool(){
    bootleaf.activeTool = "coordinates";
    resetSidebar("Map coordinates","<p><span class='info'>Click on the map to view the coordinates</span></p>");
    $("#sidebar").show("slow");
    switchOffTools();
    bootleaf.map.on('click', showMarker);
}

function showMarker(evt){
    // Show a marker on the map, and report its coordinates. This function can be called
    // by the Identify and Report Coordinates tools

    bootleaf.map.removeLayer(bootleaf.highlightLayer);
    var coordinates = evt.latlng;
    var lat = Math.round(coordinates.lat * 1000) / 1000;
    var lng = Math.round(coordinates.lng * 1000) / 1000;

    var queryJSON = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [coordinates.lng, coordinates.lat]
        }
    };
    var message = "<p>Latitude: " + lat + "<br> Longitude: " + lng + "</p>";
    bootleaf.highlightLayer = L.geoJSON(queryJSON, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng);
        },
        style: bootleaf.highlightStyle
    }).bindPopup(message).addTo(bootleaf.map).openPopup();
}


function generateGuid(){
    var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
    return guid;
}

function showHighlight(feature, zoom){

    // Add the highlighted feature to the map. This may be called by the Idenfify or Query functions
    bootleaf.map.removeLayer(bootleaf.highlightLayer);
    var geometry = feature.geometry;
    var geometryType;
    if (feature.geometryType) {
        geometryType = feature.geometryType;
    } else if (geometry.type) {
        geometryType = geometry.type;
    }
    var wkid = bootleaf.mapWkid;
    if (feature.geometry.spatialReference && feature.geometry.spatialReference.wkid){
        wkid = feature.geometry.spatialReference.wkid;
    } else if (feature.geometry.crs !== undefined) {
        wkid = feature.geometry.crs.substr(feature.geometry.crs.length - 4);
    }
    var jsonGeometry;

    if (geometryType === 'esriGeometryPoint' || geometryType === 'point') {
        jsonGeometry = {
            "type": "Point",
            "coordinates": [geometry.x, geometry.y]
        };
    } else if (geometryType === 'Point') {
        jsonGeometry = {
            "type": "Point",
            "coordinates": [geometry.coordinates[0], geometry.coordinates[1]]
        };
    } else if (geometryType === 'esriGeometryPolygon') {
        jsonGeometry = {
            "type": "Polygon",
            "coordinates": geometry.rings
        };
    } else if (geometryType === "Polygon") {
        jsonGeometry = {
            "type": "Polygon",
            "coordinates": geometry.coordinates
        };
    } else if (geometryType === "MultiPolygon") {
        jsonGeometry = {
            "type": "MultiPolygon",
            "coordinates": geometry.coordinates
        };
    } else if (geometryType === 'esriGeometryPolyline') {
        jsonGeometry = {
            "type": "LineString",
            "coordinates": [geometry.paths[0]]
        };
    } else if (geometryType === 'MultiLineString') {
        jsonGeometry = {
            "type": "LineString",
            "coordinates": [geometry.coordinates[0]]
        };
    }

    // Create a geojson layer and reproject it if necessary
    var queryJSON = {
        "type": "Feature",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:EPSG::" + wkid
            }
        },
        "geometry": jsonGeometry
    };
    bootleaf.highlightLayer = L.Proj.geoJson(queryJSON, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng);
        }
    });
    bootleaf.highlightLayer.setStyle(bootleaf.highlightStyle);
    bootleaf.highlightLayer.addTo(bootleaf.map);

    if (zoom){
        // Generate a popup from the attribute information  
        var popup = "<table class='table table-condensed'>";
        for (field in feature.attributes){
            var value = feature.attributes[field];
            popup += "<tr><td>" + field + "</td><td>" + value + "</td><tr>";
        }
        popup += "</table>";
        bootleaf.highlightLayer.bindPopup(popup);
        bootleaf.highlightLayer.openPopup(bootleaf.highlightLayer.popup);
        bootleaf.map.fitBounds(bootleaf.highlightLayer.getBounds().pad(1.1));
    }
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function configureShare(){
    // Generate a URL for this map encompassing the extent and list of layers
    var hostname = window.location.protocol + "//" + window.location.hostname;
    var port = window.location.port;
    var pathname = window.location.pathname;
    var center = bootleaf.map.getCenter();
    bootleaf.shareObj = {};
    bootleaf.shareObj['lat'] = center.lat;
    bootleaf.shareObj['lng'] = center.lng;
    bootleaf.shareObj['zoom'] = bootleaf.map.getZoom();
    bootleaf.shareObj['basemap'] = bootleaf.currentBasemap;
    var layers = bootleaf.visibleLayers.toString();
    if (layers === '') {layers = "none";}
    bootleaf.shareObj['layers'] = layers;

    // Preserve any other parameters
    var existingParams = getAllUrlParams();
    $.map( existingParams, function( value, key ) {
        bootleaf.shareObj[key] = value;
    });

    // Build the URL string from the share object. The params must start with ?, with other params
    // denoted using &
    var params = ""
    for (key in bootleaf.shareObj){
        var separator;
        params.indexOf("?") < 0 ? separator = "?" : separator = "&"; 
        params += separator + key + "=" + bootleaf.shareObj[key];
    }

    return [hostname, port, pathname, params];
}

function getAllUrlParams() {

    // get the current query string, so we can preserve parameters other than the ones we create
    var queryString =window.location.search.slice(1);
    var obj = {};
    if (queryString) {
        queryString = queryString.split('#')[0];
        var arr = queryString.split('&');
        for (var i=0; i<arr.length; i++) {
            var a = arr[i].split('=');
            var paramNum = undefined;
            var paramName = a[0].replace(/\[\d*\]/, function(v) {
                paramNum = v.slice(1,-1);
                return '';
            });
            var paramValue = typeof(a[1])==='undefined' ? true : a[1];
            // paramName = paramName.toLowerCase();

            // Ignore the parameters that we create manually
            if($.inArray(paramName, ['lat', 'lng', 'zoom', 'basemap', 'layers']) < 0) {
                paramValue = paramValue.toLowerCase();
                if (obj[paramName]) {
                    if (typeof obj[paramName] === 'string') {obj[paramName] = [obj[paramName]];}
                    if (typeof paramNum === 'undefined') {obj[paramName].push(paramValue);}
                    else {obj[paramName][paramNum] = paramValue;}
                }
                else {obj[paramName] = paramValue;}
            }
        }
    }

    return obj;
}

function updateScaleThresholds() {
    // This function checks whether layers should be disabled if they're outside their scale range
    for (var i=0; i<bootleaf.layers.length; i++) {
        var layer = bootleaf.layers[i];
        var layerConfig = layer.layerConfig;
        var zoomLevel = bootleaf.map.getZoom();
        var minZoom = layerConfig.minZoom || 1;
        var maxZoom = layerConfig.maxZoom || 19;
        if (zoomLevel < minZoom || zoomLevel > maxZoom) {
            layer.outsideScaleThreshold = true;
            if (layer.tocState === 'on') {
                bootleaf.map.removeLayer(layer);
                layer.tocState = 'grey';
            }
        } else {
            layer.outsideScaleThreshold = false;
            if (layer.tocState === 'grey' &&
                $.inArray(layer.layerConfig.id, bootleaf.visibleLayers) > -1) {
                bootleaf.map.addLayer(layer);
                layer.tocState = 'on';
            }
        }
    }
    setTimeout(function () {
        updateTOCcheckboxes();
    }, 50);
}

function updateTOCcheckboxes(){
    for (var i=0; i<bootleaf.layers.length; i++) {
        var layer = bootleaf.layers[i];
        var layerConfig = layer.layerConfig;
        if (layer.outsideScaleThreshold) {
            $("#toc_" + layerConfig.id).attr('disabled', 'disabled');
            $(".toc_" + layerConfig.id).addClass("outsideScaleThreshold");
        } else {
            $("#toc_" + layerConfig.id).removeAttr("disabled");
            $(".toc_" + layerConfig.id).removeClass("outsideScaleThreshold");
        }
    }
    // bootleaf.TOCcontrol._onInputClick();
}

function getJson(json){
    // This function isn't used, but is required for the WFS AJAX function's JSONP callback
}

function createLabels(layerConfig, data){
    // Create labels for WFS and GeoJSON layers
    try{
        // De-duplicate any coincident labels
        // TODO: take into account the current map scale and perform some rudimentary collision avoidance
        var newData = {
            features: [],
            latLngs: []
        };
        for(var j=0; j<data.features.length; j++){
            var feature = data.features[j];
            var lat = feature.geometry.coordinates[0];
            var lng = feature.geometry.coordinates[1];
            var latLng = lat + "|" + lng;
            if (newData.latLngs.indexOf(latLng) === -1) {
                newData.latLngs.push(latLng);
                // Manually force the creation of the label attribute,
                // specified in the layerConfig.layer.name variable
                feature.properties["_xxxLabelText"] = feature.properties[layerConfig.label.name];
                newData.features.push(feature);
            }
        }

        for (var i=0; i<bootleaf.labelLayers.length; i++){
            var labelLayer = bootleaf.labelLayers[i];
            if (bootleaf.labelLayers[i].layerConfig.id === layerConfig.id + "_labels"){
                labelLayer.addData(newData);
                labelLayer.lastRun = Date.now();
                labelLayer.lastBounds = bootleaf.map.getBounds().toBBoxString();
            }
        }
    } catch(err){
        console.log("There was a problem generating labels for ", layerConfig.id);
    }

}

// Used to move a Leaflet control from one parent to another (eg put the Draw control on the Query Widget panel)
function setParent(el, newParent){
    newParent.appendChild(el);
}

// Add thousands separators
function addThousandsSeparator(x) {
    try {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch(err){
        return (x)
    }
}

function round(value, decimals) {
    try{
        var num = parseFloat(value).toFixed(0);
        if (decimals > 0) {
            num = Number(Math.round(value +'e'+decimals)+'e-'+decimals);
        }
        return num;
    } catch(err){
        return value;
    }
}

function allLayersOn(){
    $.map( bootleaf.layers, function( layer, i ) {
        var addLayer = true;
        var layerConfig = layer.layerConfig;
        var currentZoom = bootleaf.map.getZoom();
        if (layerConfig.minZoom && currentZoom < layerConfig.minZoom) {
            addLayer = false;
        }
        if (layerConfig.maxZoomLevel && currentZoom > layerCOnfig.maxZoom) {
            addLayer = false;
        }
        if (addLayer){
            layer.addTo(bootleaf.map);
        } else {
            layer.outsideScaleThreshold = true;
        }
    });
    updateTOCcheckboxes();
}

function allLayersOff(){
    bootleaf.map.eachLayer(function(layer){
        if (layer.layerConfig !== undefined) {
            bootleaf.map.removeLayer(layer);
        }
    });
    updateTOCcheckboxes();
}

function buildLabelLayer(layerConfig) {
    var labelLayer = L.geoJSON(null, {
        pointToLayer: function(feature,latlng){
            // _xxxLabelText is calculated once the values are returned from the server. This is a deliberately
            // obscure variable name in the hope that it doesn't already exist on the layer ;)
            label = String(feature.properties._xxxLabelText);
            return new L.CircleMarker(latlng, {
                radius: 0,
                opacity: 0
            }).bindTooltip(label, {permanent: true, opacity: 0.7}).openTooltip();
        }
    });
    labelLayer.layerConfig = Object.assign({}, layerConfig);
    labelLayer.layerConfig.labelLayer = true;
    if (layerConfig.label.minZoom !== undefined){
        labelLayer.layerConfig.minZoom = layerConfig.label.minZoom;
    }
    if (layerConfig.label.maxZoom !== undefined){
        labelLayer.layerConfig.maxZoom = layerConfig.label.maxZoom;
    }
    if (labelLayer.layerConfig.name !== undefined) {
        labelLayer.layerConfig.name += " labels";
    } else {
        labelLayer.layerConfig.name = labelLayer.layerConfig.id + " labels";
    }
    labelLayer.layerConfig.id += "_labels";
    addLayer(labelLayer); 
    bootleaf.labelLayers.push(labelLayer);
    bootleaf.layers.push(labelLayer);
}
