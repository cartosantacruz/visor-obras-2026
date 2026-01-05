/**
 * LÓGICA DEL VISOR DE OBRAS 2026
 * Datos cargados desde GitHub GeoJSON externo.
 */

// 1. URL del archivo de datos
const GEOJSON_URL = "https://raw.githubusercontent.com/cartosantacruz/visor-obras-2026/refs/heads/main/obras.geojson";

let map;
let markersLayer;
let obrasData = null; // Aquí guardaremos los datos una vez descargados
const vistaInicial = { centro: [-48.5, -69.0], zoom: 6 };

// 2. INICIALIZAR EL MAPA Y CARGAR DATOS
function init() {
    // Configurar el mapa base
    map = L.map('map').setView(vistaInicial.centro, vistaInicial.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    markersLayer = L.featureGroup().addTo(map);

    // LLAMADA AL ARCHIVO EXTERNO
    fetch(GEOJSON_URL)
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el archivo");
            return response.json();
        })
        .then(data => {
            obrasData = data; // Guardamos los datos globalmente
            populateFilters(); // Llenamos los filtros con los datos nuevos
            updateMap(obrasData.features); // Dibujamos las obras
        })
        .catch(error => {
            console.error("Error cargando GeoJSON:", error);
            alert("Error al cargar los datos de obras.");
        });
}

// 3. LLENAR FILTROS DESDE EL JSON CARGADO
function populateFilters() {
    const features = obrasData.features;

    // Extraer valores únicos para cada categoría
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

// 4. LÓGICA DE FILTRADO
function applyFilters() {
    if (!obrasData) return; // Si los datos no han cargado, no hacer nada

    const valLoc = document.getElementById('filter-localidad').value;
    const valOrg = document.getElementById('filter-organismo').value;
    const valTipo = document.getElementById('filter-tipo').value;
    const valSearch = document.getElementById('search-nombre').value.toLowerCase();

    const filtered = obrasData.features.filter(f => {
        const p = f.properties;
        const matchLoc = (valLoc === "Todas" || p.localidad === valLoc);
        const matchOrg = (valOrg === "Todos" || p.organismo === valOrg);
        const matchTipo = (valTipo === "Todos" || p.tipo === valTipo);
        const matchSearch = p.nombre.toLowerCase().includes(valSearch);

        return matchLoc && matchOrg && matchTipo && matchSearch;
    });

    updateMap(filtered);
}

// 5. RENDERIZAR MARCADORES Y AUTO-ZOOM
function updateMap(featuresToShow) {
    markersLayer.clearLayers();

    if (featuresToShow.length === 0) {
        map.flyTo(vistaInicial.centro, vistaInicial.zoom);
        return;
    }

    featuresToShow.forEach(f => {
        // Manejo de coordenadas: algunos GeoJSON usan MultiPoint
        const coords = f.geometry.type === 'MultiPoint' 
            ? f.geometry.coordinates[0] 
            : f.geometry.coordinates;

        const marker = L.marker([coords[1], coords[0]]);
        
        marker.bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="color:#2c3e50; margin-bottom:5px;">${f.properties.nombre}</h3>
                <hr>
                <p><b>Localidad:</b> ${f.properties.localidad}</p>
                <p><b>Organismo:</b> ${f.properties.organismo}</p>
                <p><b>Estado:</b> ${f.properties.estado}</p>
            </div>
        `);
        
        markersLayer.addLayer(marker);
    });

    // Ajuste de cámara automático
    const bounds = markersLayer.getBounds();
    if (featuresToShow.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] });
    } else {
        const lastCoords = featuresToShow[0].geometry.type === 'MultiPoint' 
            ? featuresToShow[0].geometry.coordinates[0] 
            : featuresToShow[0].geometry.coordinates;
        map.flyTo([lastCoords[1], lastCoords[0]], 15);
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
    updateMap(obrasData.features);
});

// Arrancar aplicación
window.onload = init;
