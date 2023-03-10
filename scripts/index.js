const addPopup = (layer) => {
    var content = document.createElement("textarea");
    content.setAttribute("placeholder", "Write description here")
    content.setAttribute("rows", "Write description here")
    content.addEventListener("keyup", function () {
        layer.feature.properties.note = content.value;
    });
    layer.on("popupopen", function () {
        content.value = layer.feature.properties.note;
    });
    layer.bindPopup(content);
}

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let geodataValue = null;
if (params.geodata) {
    geodataValue = JSON.parse(params.geodata);
}

let osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib }),
    map = new L.Map('map', { center: new L.LatLng(0, 0), zoom: 6 });
let drawnItems = geodataValue ? L.geoJSON(geodataValue, {
    pointToLayer: (feature, latlon) => {
        // layer instanceof can't be used here since the information is lost on conversion to geojson
        const markerType = feature.properties?.markerOptions?.type;
        if (markerType === "marker") {
            return L.marker(latlon);
        } else if (markerType === "circleMarker") {
            return L.circleMarker(latlon, feature.properties.markerOptions);
        } else if (markerType === "circle") {
            return L.circle(latlon, feature.properties.markerOptions);
        } else {
            return null
        }
    },
    onEachFeature: (_, layer) => {
        addPopup(layer);
    }
}).addTo(map) : L.featureGroup().addTo(map);

if (geodataValue) {
    map.fitBounds(drawnItems.getBounds())
}

L.control.layers({
    "osm": osm.addTo(map),
    "google": L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
        attribution: 'google'
    })
}, { 'drawlayer': drawnItems }, { position: 'topright', collapsed: false }).addTo(map);

map.addControl(new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
        poly: {
            allowIntersection: false
        }
    },
    draw: {
        polygon: {
            allowIntersection: false,
            showArea: true
        }
    }
}));

const getMarkerOptions = (layer) => {
    if (layer instanceof L.Marker) {
        layer.options.type = "marker";
        return layer.options
    } else if (layer instanceof L.Circle) {
        layer.options.type = "circle";
        return layer.options
    } else if (layer instanceof L.CircleMarker) {
        layer.options.type = "circleMarker";
        return layer.options
    } else {
        return null
    }
}


// Object created - bind popup to layer, add to feature group
map.on(L.Draw.Event.CREATED, function (event) {
    let layer = event.layer;
    let feature = layer.feature = layer.feature || {};
    feature.type = feature.type || "Feature";
    let props = feature.properties = feature.properties || {};
    props.id = props.id || uuidv4();
    props.note = props.note || "";
    // this is filtered here instead of layer.options to not unnecessarily lengthen URL
    props.markerOptions = getMarkerOptions(layer);
    drawnItems.addLayer(layer);
    // add popup for note
    addPopup(layer);
    // update map link
    updateLink();
});

// Object(s) edited - update popups
map.on(L.Draw.Event.EDITED, function (event) {
    let layers = event.layers;
    layers.eachLayer(function (layer) {
        console.log(layer);
    });
    // update Map Link
    updateLink();
});

const uuidv4 = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

const updateLink = () => {
    // get all editable features in the map
    const drawnItemsGeoJSON = JSON.stringify(drawnItems.toGeoJSON());
    const urlParamJson = new URLSearchParams({
        geodata: drawnItemsGeoJSON
    });

    let url = new URL(document.URL);
    url.searchParams.set('geodata', drawnItemsGeoJSON);

    // set map link href
    document.getElementById("createdMapLink").setAttribute("href", url.toString());
    document.getElementById("copyMapLink").setAttribute("data-clipboard-text", url.toString());
}

document.getElementById("copyMapLink").onclick = () => {
    updateLink();
    // get link
    const linkToUpdatedMap = document.getElementById("createdMapLink").getAttribute("href");
    // copy to clipboard
    try{

    } catch(err) {
        
    }

}

// updateLink for the first time when page loads
updateLink();




// utils from clipboardJS

new ClipboardJS('.copyBtn');