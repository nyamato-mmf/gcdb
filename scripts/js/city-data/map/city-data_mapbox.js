// =========================================================================
// City Data Mapbox JS
// =========================================================================
const DEFAULT_CITY = "TYO";
const params = new URLSearchParams(window.location.search);
const cityParam = params.get("city")?.toUpperCase() || DEFAULT_CITY;

// クエリパラメータのハッシュがあった場合は削除する（初期化）
function removeHashFromUrl() {
    if (window.location.hash) {
        window.location.hash = "";        
    }
}
removeHashFromUrl();

// 都市コードと都市名のマッピング
const cityMap = {
    LON: "LONDON",
    NYC: "NEW YORK",
    TYO: "TOKYO",
    PAR: "PARIS",
    SIN: "SINGAPORE",
    SEL: "SEOUL",
};
//  都市コードと国コードのマッピング
const cityCountryMap = {
    LON: 'gb',
    NYC: 'us',
    TYO: 'jp',
    PAR: 'fr',
    SIN: 'sg',
    SEL: 'kr'
};

// 都市名と国旗の更新
function updateCityDisplay(cityCode) {
    const name = cityMap[cityCode] || cityMap[DEFAULT_CITY];
    const flag = document.getElementById('city-flag');
    if (flag) {
        const countryCode = cityCountryMap[cityCode] || cityCountryMap[DEFAULT_CITY];
        flag.className = `flag-icon flag-icon-${countryCode} flag-large bordered-flag`;
    }
    ["city-name-pc", "city-name-mobile", "city-name"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = name;
    });
}
updateCityDisplay(cityParam);

// =========================================================================
// Mapbox セットアップ
// =========================================================================
// Mapbox アクセストークン設定
mapboxgl.accessToken = 'pk.eyJ1IjoibnlhbWF0byIsImEiOiJja2Y4dzNkOW8wY3MwMnFvM29iNnJzNzVzIn0.GHlHwu3r5YjKBU3qAKvccQ';

// フライ・トゥー座標設定
const flyLocations = {
    LON: { center: [-0.1278, 51.5074]},
    NYC: { center: [-73.9739, 40.7555]},
    TYO: { center: [139.7529, 35.6852]},
    PAR: { center: [2.3522, 48.8566]},
    SIN: { center: [103.8520, 1.2903]},
    SEL: { center: [126.9780, 37.5665]}
};

// 地図のセットアップ関数
function setupMap(containerId, geojsonPath, type, paint, zoom, pitch) {
    // Show spinner
    const spinner = document.getElementById(`spinner-${containerId.replace('_map','')}`);
    if (spinner) spinner.style.display = 'block';

    // Create the map
    const map = new mapboxgl.Map({
        container: containerId,
        style: "mapbox://styles/nyamato/ckt5grlhv20td17o5ijrf84wz",
        zoom: 1,
        center: [-0.13048539486171945, 51.52163143835778]
    });

    // On map load
    map.on('load', () => {
        
        // Add GeoJSON source and layer
        if (geojsonPath) {
            map.addSource('geodata', {
                type: 'geojson',
                data: geojsonPath
            });
            map.addLayer({
                'id': 'geodata-layer',
                'type': type,
                'source': 'geodata',
                'paint': paint,
            });
        }

        // フライ・トゥー指定
        const loc = flyLocations[cityParam];
        if (loc) {
            map.flyTo({
                center: loc.center,
                zoom: zoom,
                pitch: pitch || 0,
                essential: true
            });
        }

        // データがロードされたらスピナーを非表示にする
        if (spinner) spinner.style.display = 'none';
    });
    map.addControl(new mapboxgl.FullscreenControl());
    return map;
    
    

}

/* -------------------------------------------------------------
    都市境界マップ
------------------------------------------------------------- */
setupMap(
    'boundary_map', 
    './data/map/boundary/geojson/boundary.geojson', 
    'fill', {
    'fill-color': [
        'case',
        ['==', ['get', 'city'], 1], 'red',
        ['==', ['get', 'metropolitan'], 1], 'blue',
        'green'
    ],
        'fill-opacity': 0.5,
    },
    zoom=5,
    pitch=0
);

/* -------------------------------------------------------------
    人口密度マップ
------------------------------------------------------------- */
setupMap(
    'population_country_map', 
    './data/map/population/countries/geojson/Japanpop_density_2020.geojson',
    'fill-extrusion',
    {
        'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'POPULATION_DENSITY'], 0],
                0,      '#3288bd',    // 0 未満の値
                5000,   '#83e19d',    // 0 から 5000 未満
                10000,  '#fee08b',    // 5000 から 10000 未満
                15000,  '#f9993b',    // 10000 から 15000 未満
                20000,  '#ef5305',    // 15000 から 20000 未満
                25000,  '#d53e4f',    // 20000 から 25000 未満
                30000,  '#c62240',    // 25000 から 30000 未満
                35000,  '#b31535',    // 30000 から 35000 未満
                40000,  '#9f0729',    // 35000 から 40000 未満
                45000,  '#8b001d',    // 40000 から 45000 未満
                50000,  '#7a0014'     // 45000 以上の値 (50000+ を含む)
            ],
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'POPULATION_DENSITY'], 0], 1],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    pitch=30
);

/* -------------------------------------------------------------
    フライト・ネットワーク・マップ
------------------------------------------------------------- */
var path = './data/map/infrastructure/flight_network/geojson/fly-' + cityParam.toLowerCase() + '_linestring.geojson';
setupMap(
    'flight_network_map', 
    path, 
    'line', { 
        'line-color': 'yellow' 
    },
    zoom=2,
    pitch=0
)

/* -------------------------------------------------------------
    鉄道路線マップ
------------------------------------------------------------- */
setupMap(
    'railway_map', 
    './data/map/infrastructure/railway/geojson/railway_japan.geojson', 
    'line', { 
        'line-color': 'red' 
    },
    zoom=5,
    pitch=0
)