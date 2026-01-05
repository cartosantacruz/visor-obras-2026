/**
 * LÓGICA DEL MAPA DE OBRAS - SANTA CRUZ
 * Funcionalidad: Carga de datos, filtrado múltiple y ajuste de cámara automático.
 */

// 1. DATOS DE LAS OBRAS (Aquí pegarías el contenido de tu archivo GeoJSON)
const obrasGeoJSON = {
    "type": "FeatureCollection",
    "features": [
        {"type": "Feature", "properties": {"id":1,"localidad":"28 de Noviembre","nombre":"ESCUELA EIPE","tipo":"Educación","organismo":"IDUV"}, "geometry": {"type":"Point","coordinates":[-72.20958742841874,-51.5896707658149]}},
        {"type": "Feature", "properties": {"id":3,"localidad":"Caleta Olivia","nombre":"Planta de tratamientos","tipo":"Infraestructura/Servicios","organismo":"SPSE"}, "geometry": {"type":"Point","coordinates":[-67.54230877043062,-46.43658939441054]}},
        {"type": "Feature", "properties": {"id":46,"localidad":"Río Gallegos","nombre":"Sala inmersiva","tipo":"Otros","organismo":"IDUV"}, "geometry": {"type":"Point","coordinates":[-69.22054480268227,-51.62716008344622]}}
        // ... (resto de tus datos)
    ]
};

let map;
let markersLayer;
const vistaInicial = { centro: [-48.5, -69.0], zoom: 6 };

// 2. INICIALIZAR EL MAPA
function initMap() {
    // Crear mapa centrado en Santa Cruz
    map = L.map('map').setView(vistaInicial.centro, vistaInicial.zoom);

    // Agregar capa de mapa (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Capa para agrupar marcadores (permite borrarlos fácilmente)
    markersLayer = L.featureGroup().addTo(map);

    // Llenar selectores y mostrar obras iniciales
    populateFilters();
    updateMap(obrasGeoJSON.features);
}

// 3. LLENAR FILTROS AUTOMÁTICAMENTE
function populateFilters() {
    const features = obrasGeoJSON.features;

    // Extraer valores únicos sin duplicados
    const localidades = [...new Set(features.map(f => f.properties.localidad))].sort();
    const organismos = [...new Set(features.map(f => f.properties.organismo))].sort();
    const tipos = [...new Set(features.map(f => f.properties.tipo))].sort();

    fillSelect('filter-localidad', localidades);
    fillSelect('filter-organismo', organismos);
    fillSelect('filter-tipo', tipos);
}

function fillSelect(id, values) {
    const select = document.getElementById(id);
    values.forEach(val => {
        if (val && val !== "Sin Datos") {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            select.appendChild(opt);
        }
    });
}

// 4. LÓGICA DE FILTRADO COMBINADO
function applyFilters() {
    const valLoc = document.getElementById('filter-localidad').value;
    const valOrg = document.getElementById('filter-organismo').value;
    const valTipo = document.getElementById('filter-tipo').value;
    const valSearch = document.getElementById('search-nombre').value.toLowerCase();

    const filtered = obrasGeoJSON.features.filter(f => {
        const p = f.properties;
        const matchLoc = (valLoc === "Todas" || p.localidad === valLoc);
        const matchOrg = (valOrg === "Todos" || p.organismo === valOrg);
        const matchTipo = (valTipo === "Todos" || p.tipo === valTipo);
        const matchSearch = p.nombre.toLowerCase().includes(valSearch);

        return matchLoc && matchOrg && matchTipo && matchSearch;
    });

    updateMap(filtered);
}

// 5. ACTUALIZAR MAPA Y AJUSTAR CÁMARA (FIT BOUNDS)
function updateMap(featuresToShow) {
    markersLayer.clearLayers(); // Limpiar marcadores anteriores

    if (featuresToShow.length === 0) {
        // Si no hay resultados, volver a la vista general
        map.flyTo(vistaInicial.centro, vistaInicial.zoom);
        return;
    }

    featuresToShow.forEach(f => {
        const coords = f.geometry.coordinates;
        // Leaflet usa [Lat, Lng] pero GeoJSON usa [Lng, Lat]
        const marker = L.marker([coords[1], coords[0]]);
        
        // Estilo del Popup
        marker.bindPopup(`
            <div style="color: #2c3e50;">
                <h3 style="margin:0 0 5px 0;">${f.properties.nombre}</h3>
                <p><b>Localidad:</b> ${f.properties.localidad}</p>
                <p><b>Tipo:</b> ${f.properties.tipo}</p>
                <p><b>Estado:</b> ${f.properties.estado || 'Proyectada'}</p>
            </div>
        `);
        
        markersLayer.addLayer(marker);
    });

    // --- MEJORA: AJUSTE DE CÁMARA ---
    // Calculamos el recuadro (bounds) que contiene a todos los nuevos marcadores
    const bounds = markersLayer.getBounds();
    
    // Si hay más de un marcador, encuadramos todos. Si es uno, hacemos zoom en él.
    if (featuresToShow.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    } else {
        const singleCoords = featuresToShow[0].geometry.coordinates;
        map.flyTo([singleCoords[1], singleCoords[0]], 14);
    }
}

// 6. EVENTOS
document.querySelectorAll('select').forEach(s => s.addEventListener('change', applyFilters));
document.getElementById('search-nombre').addEventListener('input', applyFilters);

document.getElementById('btn-limpiar').addEventListener('click', () => {
    document.getElementById('filter-localidad').value = "Todas";
    document.getElementById('filter-organismo').value = "Todos";
    document.getElementById('filter-tipo').value = "Todos";
    document.getElementById('search-nombre').value = "";
    updateMap(obrasGeoJSON.features);
});

// Iniciar al cargar la ventana
window.onload = initMap;