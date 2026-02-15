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
const mapboxToken = 'pk.eyJ1IjoibnlhbWF0byIsImEiOiJja2Y4dzNkOW8wY3MwMnFvM29iNnJzNzVzIn0.GHlHwu3r5YjKBU3qAKvccQ'; // pkで始まる公開トークン
mapboxgl.accessToken = mapboxToken;

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
function setupMap(containerId, geojsonPath, type, paint, zoom, maxZoom, pitch) {
    // Show spinner
    const spinner = document.getElementById(`spinner-${containerId.replace('_map','')}`);
    if (spinner) spinner.style.display = 'block';

    // Create the map
    const map = new mapboxgl.Map({
        container: containerId,
        style: "mapbox://styles/nyamato/ckpx9lvxz0lj217pernr3nomm",
        zoom: 1,
        maxZoom: maxZoom || 15,
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
            // If the layer is a line, add a wider invisible layer for easier interaction
            if (type === 'line') {
                map.addLayer({
                    'id': 'geodata-interaction-layer',
                    'type': 'line',
                    'source': 'geodata',
                    'paint': {
                        'line-width': (paint['line-width'] ? paint['line-width'] : 10) + 15, // much wider
                        'line-opacity': 0
                    }
                });
            }
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

        // ポップアップ表示の設定
        // For line layers, use the interaction layer for events
        const eventLayer = (type === 'line') ? 'geodata-interaction-layer' : 'geodata-layer';
        map.on('click', eventLayer, function (e) {
            const feature = e.features[0];

            const popupName  = feature.properties.popup_name || 'N/A';
            const popupValue = feature.properties.popup_value || '';
            const popupUnit  = feature.properties.popup_unit || '';

            const name = feature.properties.popup_name;
            const year = feature.properties.popup_value;

            let imgHTML = '';

            if (name && year) {
                const imgPath =
                    `./data/map/development/cities/${cityParam.toLowerCase()}/${year}/${name}_${year}.jpg`;

                imgHTML = `
                    <img 
                        src="${imgPath}"
                        style="width:100%; height:auto; border-radius:6px; margin-top:6px;"
                        onerror="this.style.display='none'"
                    />
                `;
            }

            const popupHTML = `
                <div style="max-width:260px;">
                    <div style="font-weight:bold; margin-bottom:6px;">
                        ${popupName}: ${popupValue} ${popupUnit}
                    </div>
                    ${imgHTML}
                </div>
            `;

            new mapboxgl.Popup({ closeButton: true })
                .setLngLat(e.lngLat)
                .setHTML(popupHTML)
                .addTo(map);
        });

        map.on('mouseenter', eventLayer, function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', eventLayer, function () {
            map.getCanvas().style.cursor = '';
        });


        // データがロードされたらスピナーを非表示にする
        if (spinner) spinner.style.display = 'none';
    });

    map.on('error', (e) => {
        if (e.error?.status === 404) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 24px; color: #999;">Coming soon</div>';
            }
            if (spinner) spinner.style.display = 'none';
        }
    });

    map.addControl(new mapboxgl.FullscreenControl());
    return map;  
    
}


/* -------------------------------------------------------------
    国コードの取得
------------------------------------------------------------- */
const countryCode = cityCountryMap[cityParam] || cityCountryMap[DEFAULT_CITY];

/* -------------------------------------------------------------
    都市境界マップ
------------------------------------------------------------- */
var path_boundary = './data/map/boundary/geojson/boundary_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'boundary_map', 
    path_boundary, 
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
    maxZoom=15,
    pitch=0
);

/* -------------------------------------------------------------
    人口密度マップ
------------------------------------------------------------- */
var population_boundary = './data/map/demographics/population/countries/geojson/population_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'population_country_map', 
    population_boundary,
    'fill-extrusion',
    {
        'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'population_density'], 0],
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
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'population_density'], 0], 0.5],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30
);

/* -------------------------------------------------------------
    従業者密度マップ
------------------------------------------------------------- */
var employment_density = './data/map/demographics/employment/countries/geojson/employment_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'employment_map', 
    employment_density, 
    'fill-extrusion',
    {
        'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'employee_density'], 0],
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
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'employee_density'], 0], 0.5],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30
);

/* -------------------------------------------------------------
    従業者密度マップ (第一次産業)
------------------------------------------------------------- */
var employment_1st_industry_density = './data/map/demographics/employment/countries/geojson/employment_1st_industry_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'employment_1st_industry_map', 
    employment_1st_industry_density, 
    'fill-extrusion',
    {
        'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'employee_density'], 0],
                0,      '#3288bd',    // 0 未満の値
                5,   '#83e19d',    // 0 から 5000 未満
                10,  '#fee08b',    // 5000 から 10000 未満
                15,  '#f9993b',    // 10000 から 15000 未満
                20,  '#ef5305',    // 15000 から 20000 未満
                25,  '#d53e4f',    // 20000 から 25000 未満
                30,  '#c62240',    // 25000 から 30000 未満
                35,  '#b31535',    // 30000 から 35000 未満
                40,  '#9f0729',    // 35000 から 40000 未満
                45,  '#8b001d',    // 40000 から 45000 未満
                50,  '#7a0014'     // 45000 以上の値 (50000+ を含む)
            ],
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'employee_density'], 0], 0.5],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30,
);

/* -------------------------------------------------------------
    従業者密度マップ (第二次産業)
------------------------------------------------------------- */
var employment_2nd_industry_density = './data/map/demographics/employment/countries/geojson/employment_2nd_industry_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'employment_2nd_industry_map', 
    employment_2nd_industry_density, 
    'fill-extrusion',
    {
        'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'employee_density'], 0],
                0,      '#3288bd',    // 0 未満の値
                1000,   '#83e19d',    // 0 から 5000 未満
                2000,  '#fee08b',    // 5000 から 10000 未満
                3000,  '#f9993b',    // 10000 から 15000 未満
                4000,  '#ef5305',    // 15000 から 20000 未満
                5000,  '#d53e4f',    // 20000 から 25000 未満
                6000,  '#c62240',    // 25000 から 30000 未満
                7000,  '#b31535',    // 30000 から 35000 未満
                8000,  '#9f0729',    // 35000 から 40000 未満
                9000,  '#8b001d',    // 40000 から 45000 未満
                10000,  '#7a0014'     // 45000 以上の値 (50000+ を含む)
            ],
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'employee_density'], 0], 0.5],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30
);

/* -------------------------------------------------------------
    従業者密度マップ (第三次産業)
------------------------------------------------------------- */
var employment_3rd_industry_density = './data/map/demographics/employment/countries/geojson/employment_3rd_industry_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'employment_3rd_industry_map', 
    employment_3rd_industry_density, 
    'fill-extrusion',
    {
        'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'employee_density'], 0],
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
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'employee_density'], 0], 0.5],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30
);

/* -------------------------------------------------------------
    外国人人口密度マップ
------------------------------------------------------------- */
var foreign_resident_boundary = './data/map/demographics/foreign_resident/countries/geojson/foreign_resident_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'foreign_resident_map', // Same ID
    foreign_resident_boundary, 
    'fill-extrusion', 
    {
        'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'foreign_resident_density'], 0],
            0,    '#3b0f70', // 0
            100,  '#59157e', // 100
            200,  '#781c81', // 200
            300,  '#98217d', // 300
            400,  '#b82773', // 400
            500,  '#d03463', // 500
            600,  '#e54753', // 600
            700,  '#f36240', // 700
            800,  '#fb812d', // 800
            900,  '#fca51a', // 900
            1000, '#f7cb15'  // 1000+
        ],
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'foreign_resident_density'], 0], 0.5],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30
);

/* -------------------------------------------------------------
    空き家マップ (総数)
------------------------------------------------------------- */
var vacant_house_total = './data/map/demographics/vacant_house/countries/geojson/vacant_house_total_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'vacant_house_total_map', 
    vacant_house_total, 
    'fill-extrusion',
        {
            'fill-extrusion-color': [
                'case',
                ['==', ['get', 'total'], null],  // If total is null
                'rgba(50, 136, 189, 0.5)',      // White with 50% opacity
                [                                 // Otherwise, interpolate
                    'interpolate',
                    ['linear'],
                    ['get', 'total'],
                    0,      '#3288bd',
                    50000,  '#d53e4f',
                    100000, '#c62240',
                    150000, '#b31535',
                    200000, '#9f0729',
                    250000, '#8b001d',
                    300000, '#7a3c1c'
                ]
            ],
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'total'], 0], 0.2],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30,
);

/* -------------------------------------------------------------
    空き家マップ (密度)
------------------------------------------------------------- */
var vacant_house_density = './data/map/demographics/vacant_house/countries/geojson/vacant_house_density_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'vacant_house_density_map', 
    vacant_house_density, 
    'fill-extrusion',
        {
        'fill-extrusion-color': [
            'case',
                ['==', ['get', 'vacant_house_density'], null],  // If density is null
                'rgba(50, 136, 189, 0.5)',      // White with 50% opacity,
                ['interpolate',
                ['linear'],
                ['coalesce', ['get', 'vacant_house_density'], 0],
                0,    '#3b0f70', // 0
                500,  '#d03463', // 500
                1000,  '#e54753', // 600
                1500,  '#f36240', // 700
                2000,  '#fb812d', // 800
                2500,  '#fca51a', // 900
                3000, '#f7cb15']  // 1000+  
            ],
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'vacant_house_density'], 0], 50.0],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30,
);

/* -------------------------------------------------------------
    空き家マップ (人口比率)
------------------------------------------------------------- */
var vacant_house_ratio = './data/map/demographics/vacant_house/countries/geojson/vacant_house_ratio_' + countryCode.toLowerCase() + '.geojson';
setupMap(
    'vacant_house_ratio_map', 
    vacant_house_ratio, 
    'fill-extrusion',
        {
            'fill-extrusion-color': [
                'case',
                ['==', ['get', 'vacant_house_ratio'], null],  // If ratio is null
                'rgba(50, 136, 189, 0.5)',      // White with 50% opacity
                [                                 // Otherwise, interpolate
                    'interpolate',
                    ['linear'],
                    ['get', 'vacant_house_ratio'],
                        0.0, '#3288bd',
                        0.1, '#66c2a5',
                        0.2, '#abdda4',
                        0.3, '#e6f598',
                        0.4, '#fee08b',
                        0.5, '#fdae61',
                        0.6, '#f46d43',
                        0.7, '#d53e4f',
                        0.8, '#c62240',
                        0.9, '#b31535',
                        1.0, '#9f0729'
                ]
            ],
            'fill-extrusion-height': ['*', ['coalesce', ['get', 'vacant_house_ratio'], 0], 100000],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1.0,
        },
    zoom=5,
    maxZoom=10,
    pitch=30,
);

/* -------------------------------------------------------------
    フライト・ネットワーク・マップ
------------------------------------------------------------- */
var path_flight_network = './data/map/infrastructure/flight_network/geojson/fly-' + cityParam.toLowerCase() + '_linestring.geojson';
setupMap(
    'flight_network_map', 
    path_flight_network, 
    'line', { 
        'line-width': 1,
        'line-color': 'green' 
    },
    zoom=2,
    maxZoom=8,
    pitch=0
)

/* -------------------------------------------------------------
    鉄道路線マップ
------------------------------------------------------------- */
setupMap(
    'railway_network_map', 
    './data/map/infrastructure/railway_network/geojson/railway_network_' + countryCode.toLowerCase() + '.geojson', 
    'line', { 
        'line-width': 2,
        'line-color': 'red' 
    },
    zoom=5,
    maxZoom=15,
    pitch=0
)

/* -------------------------------------------------------------
    高速道路路線マップ
------------------------------------------------------------- */
setupMap(
    'highway_network_map', 
    './data/map/infrastructure/highway_network/geojson/highway_network_' + countryCode.toLowerCase() + '.geojson', 
    'line', { 
        'line-width': 2,
        'line-color': 'blue'
    },
    zoom=5,
    maxZoom=15,
    pitch=0
)

/* -------------------------------------------------------------
    開発プロジェクトマップ
------------------------------------------------------------- */
var path_development_projects = './data/map/development/cities/' + cityParam.toLowerCase() + '/data_sheet_' + cityParam.toLowerCase() + '.geojson';

setupMap(
    'development_projects_map',
    path_development_projects,
    'circle',
    {
        'circle-color': '#e63946',
        'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 4,
            10, 8,
            15, 16
        ],
        'circle-opacity': 0.7,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
    },
    zoom=10,
    maxZoom=15,
    pitch=0
);

