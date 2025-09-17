// ---------------------- CONFIG ----------------------
mapboxgl.accessToken = 'pk.eyJ1IjoicmljaGFyZC1jb25zdGFudGluZSIsImEiOiJjbWZtamJqeWswMmk1MmpvbnQzMmRjMHA0In0.fPxg8O3dFJ0VFutZudtWRQ';

const typeLabels = {
  "antiquaire": "Antiquaire",
  "bouquiniste": "Bouquiniste",
  "foire d'art": "Foire d’art",
  "galerie d'art": "Galerie d’art",
  "grande distribution": "Grande distribution",
  "librairie": "Librairie",
  "marché aux puces": "Marché aux puces",
  "salle_de_vente": "Salle de vente"
};

const typeColors = {
  "Antiquaire": "#e41a1c",
  "Bouquiniste": "#377eb8",
  "Foire d’art": "#4daf4a",
  "Galerie d’art": "#984ea3",
  "Grande distribution": "#ff7f00",
  "Librairie": "#ffff33",
  "Marché aux puces": "#a65628",
  "Salle de vente": "#f781bf"
};

let originalData;
let pieChart, barChart;
let selectedArrId = null;
let hoveredActive = true;
let selectionFromPoint = false;

const mapCommerce = new mapboxgl.Map({
  container: 'map-commerce',
  style: 'mapbox://styles/richard-constantine/cmfo8b6pa00b601rgf3zu6gcs',
  center: [2.3522, 48.8566],
  zoom: 12
});

const mapTransport = new mapboxgl.Map({
  container: 'map-transport',
  style: 'mapbox://styles/richard-constantine/cmfo9lwuq00bv01rf96im5e4w',
  center: [2.3522, 48.8566],
  zoom: 12
});

new mapboxgl.Compare(mapCommerce, mapTransport, "#comparison-container");

Chart.defaults.font.family = 'EB Garamond';

function updateCharts(data) {
  const typeCounts = {};
  const arr = document.getElementById('arr-filter').value;

  data.features.forEach(f => {
    const rawType = f.properties.l_type;
    const type = typeLabels[rawType] || rawType;
    if (!typeCounts[type]) typeCounts[type] = 0;
    if (arr === "all" || parseInt(f.properties.arrondissement) === parseInt(arr)) {
      typeCounts[type]++;
    }
  });

  const labels = Object.keys(typeCounts);
  const values = Object.values(typeCounts);
  const backgroundColors = labels.map(t => typeColors[t] || "#ccc");

  if (!pieChart) {
    const totalCounts = {};
    data.features.forEach(f => {
      const rawType = f.properties.l_type;
      const type = typeLabels[rawType] || rawType;
      totalCounts[type] = (totalCounts[type] || 0) + 1;
    });
    pieChart = new Chart(document.getElementById('pieChart'), {
      type: 'pie',
      data: {
        labels: Object.keys(totalCounts),
        datasets: [{
          data: Object.values(totalCounts),
          backgroundColor: Object.keys(totalCounts).map(t => typeColors[t] || "#ccc")
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
            bodyFont: {
                family: 'EB Garamond'
            },
            titleFont: {
                family: 'EB Garamond'
            }
    },
        legend: {
            position: 'right',
            maxHeight: 300,
            labels: {
            boxWidth: 14,
            padding: 6,
            font: {
                family: 'EB Garamond'
                }
            }
        }
        },
        layout: { padding: { bottom: 30 } }
      }
    });
  }

  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `Commerce in ${arr === "all" ? "All Paris" : "Arrondissement " + arr}`,
        data: values,
        backgroundColor: backgroundColors
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: {
        tooltip: {
            bodyFont: {
                family: 'EB Garamond'
            },
            titleFont: {
                family: 'EB Garamond'
            }
        },
        legend: { 
            labels: {
                font: {
                family: 'EB Garamond'
                }
            },
            display: false } }
    }
  });
}

function applyFilter() {
  const checkedTypes = Array.from(document.querySelectorAll('.type-filter:checked')).map(cb => cb.value);
  const selectedArr = document.getElementById('arr-filter').value;
  selectedArrId = selectedArr === "all" ? null : parseInt(selectedArr);

  const filtered = {
    type: "FeatureCollection",
    features: originalData.features.filter(f => {
      const originalType = f.properties.original_type || f.properties.l_type;
      const displayType = typeLabels[originalType] || originalType;
      const typeMatch = checkedTypes.includes(originalType);
      const arrMatch = selectedArr === "all" || parseInt(f.properties.arrondissement) === parseInt(selectedArr);
      return typeMatch && arrMatch && f.properties.l_type === displayType;
    })
  };

  mapCommerce.getSource("commerce").setData(filtered);

  if (mapCommerce.getLayer('boundary-highlight')) {
    const fallback = selectedArrId !== null ? selectedArrId : -1;
    mapCommerce.setFilter('boundary-highlight', ["==", ["get", "c_ar"], fallback]);
  }
}

function applyFilterAndUpdate() {
  applyFilter();
  updateCharts(originalData);
}

setTimeout(() => {
  document.querySelectorAll('.type-filter').forEach(cb => {
    cb.addEventListener('change', applyFilterAndUpdate);
  });
  document.getElementById('arr-filter').addEventListener('change', applyFilterAndUpdate);
  document.getElementById('reset-btn').addEventListener('click', () => {
    document.querySelectorAll('.type-filter').forEach(cb => cb.checked = true);
    document.getElementById('arr-filter').value = "all";
    applyFilterAndUpdate();
  });
}, 1000);

const toggleBtn = document.getElementById('toggle-panel');
const chartPanel = document.getElementById('chart-panel');

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    chartPanel.classList.toggle('collapsed');
    toggleBtn.innerHTML = chartPanel.classList.contains('collapsed') ? '◀' : '▶';
    toggleBtn.style.right = chartPanel.classList.contains('collapsed') ? '0px' : '360px';
  });
}

mapCommerce.on("load", () => {

    const iconList = [
    "antiquaire", "bouquiniste", "foire_d_art", "galerie_d_art",
    "grande_distribution", "librairie", "marche_aux_puces", "salle_de_vente"
    ];

    iconList.forEach(name => {
    mapCommerce.loadImage(`icons/icon_${name}.png`, (error, image) => {
        if (error) throw error;
        if (!mapCommerce.hasImage(name)) {
        mapCommerce.addImage(name, image);
        }
    });
    });

  fetch("Data/commerce.geojson")
    .then(res => res.json())
    .then(data => {
    originalData = data;

    data.features.forEach(f => {
    const raw = f.properties.l_type;
    f.properties.original_type = raw;
    f.properties.l_type = typeLabels[raw] || raw;
    });
    
      mapCommerce.addSource("commerce", {
        type: "geojson",
        data: data
      });

        mapCommerce.addLayer({
        id: "commerce-points",
        type: "symbol",
        source: "commerce",
        layout: {
            "icon-image": [
            "match",
            ["get", "original_type"],
            "antiquaire", "antiquaire",
            "bouquiniste", "bouquiniste",
            "foire d'art", "foire_d_art",
            "galerie d'art", "galerie_d_art",
            "grande distribution", "grande_distribution",
            "librairie", "librairie",
            "marché aux puces", "marche_aux_puces",
            "salle_de_vente", "salle_de_vente",
            "default-marker" 
            ],
            "icon-size": 0.04,
            "icon-allow-overlap": true
        },
        paint: {
            "icon-opacity": 0.8
        }
        });

//      mapCommerce.on("click", "commerce-points", (e) => {
//        const props = e.features[0].properties;
//        const displayType = typeLabels[props.l_type] || props.l_type;
//
//        const html = `
//        <strong>${props.label || "Commerce"}</strong><br/>
//        <em>Type:</em> ${displayType}<br/>
//        <em>Address:</em> ${props.adresse || "N/A"}
//        `;
//        const arr = parseInt(props.arrondissement);
//
//        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(mapCommerce);
//
//        if (selectedArrId !== null && arr === selectedArrId) {
//        return;
//        }
//
//        selectionFromPoint = true;
//        selectedArrId = arr;
//        hoveredActive = false;
//        document.getElementById('arr-filter').value = arr.toString();
//        applyFilterAndUpdate();
//        mapCommerce.setFilter('boundary-highlight', ["==", ["get", "c_ar"], selectedArrId || -1]);
//        mapCommerce.setPaintProperty("boundary-line", "line-color", [
//        "case",
//        ["==", ["get", "c_ar"], arr],
//        "#cccccc",
//        "rgba(0,0,0,0)"
//        ]);
//      });

      updateCharts(data);
    });

  mapCommerce.addSource("paris-boundary", {
    type: "geojson",
    data: "Data/boundary paris_boundary.geojson"
  });

  mapCommerce.addLayer({
    id: "boundary-fill",
    type: "fill",
    source: "paris-boundary",
    paint: {
      "fill-color": "#ffffff",
      "fill-opacity": 0
    }
  });

  mapCommerce.addLayer({
    id: "boundary-line",
    type: "line",
    source: "paris-boundary",
    paint: {
        "line-color": [
        "case",
        ["==", ["get", "c_ar"], -999],  // 默认匹配不到
        "#AD84C6",
        "rgba(0,0,0,0)"  // 其它不显示
        ],
        "line-width": 1.2
    }
  });

  mapCommerce.addLayer({
    id: "boundary-highlight",
    type: "fill",
    source: "paris-boundary",
    paint: {
      "fill-color": "#AD84C6",
      "fill-opacity": 0.3
    },
    filter: ["==", ["get", "c_ar"], -1]
  });

    mapCommerce.on("mousemove", "boundary-fill", (e) => {
    if (!hoveredActive) return;
    const hoveredId = e.features[0].properties.c_ar;
    mapCommerce.setFilter("boundary-highlight", ["==", ["get", "c_ar"], hoveredId]);

    mapCommerce.setPaintProperty("boundary-line", "line-color", [
    "case",
    ["==", ["get", "c_ar"], hoveredId],
    "#AD84C6",
    "rgba(0,0,0,0)"
    ]);
  });

    mapCommerce.on("mouseleave", "boundary-fill", () => {
    if (!hoveredActive && selectedArrId !== null) return;

    mapCommerce.setFilter("boundary-highlight", ["==", ["get", "c_ar"], -1]);

    mapCommerce.setPaintProperty("boundary-line", "line-color", [
        "case",
        ["==", ["get", "c_ar"], -999],
        "#AD84C6",
        "rgba(0,0,0,0)"
    ]);
    });

  mapCommerce.on("click", "boundary-fill", (e) => {
    const id = e.features[0].properties.c_ar;
    if (selectedArrId === id && !selectionFromPoint) {
    // 用户主动点击了当前已选 → 取消
    selectedArrId = null;
    hoveredActive = true;
    document.getElementById('arr-filter').value = "all";
    } else {
    // 无论来源，设置新高亮
    selectedArrId = id;
    hoveredActive = false;
    document.getElementById('arr-filter').value = id.toString();
    }
    selectionFromPoint = false;
    applyFilterAndUpdate();
    mapCommerce.setFilter("boundary-highlight", ["==", ["get", "c_ar"], selectedArrId || -1]);
    mapCommerce.setPaintProperty("boundary-line", "line-color", [
        "case",
        ["==", ["get", "c_ar"], selectedArrId],
        "#AD84C6",
        "rgba(0,0,0,0)"
    ]);
    });
  mapCommerce.on("click", (e) => {
    const features = mapCommerce.queryRenderedFeatures(e.point, {
        layers: ["boundary-fill", "commerce-points"]
    });

    // 如果没点中任何图层，则恢复默认状态
    if (features.length === 0) {
        selectedArrId = null;
        hoveredActive = true;
        document.getElementById("arr-filter").value = "all";
        applyFilterAndUpdate();
    }
    });
});

    mapTransport.on("load", () => {
    mapTransport.addSource("hexbin", {
        type: "geojson",
        data: "Data/heatmap.geojson"
    });

    mapTransport.addLayer({
    id: "hexbin-layer",
    type: "fill",
    source: "hexbin",
    paint: {
        "fill-color": [
          "interpolate", ["linear"], ["get", "KDE__mean"],
            0,"rgba(255, 255, 255, 0.04) ",
            15 ,"#f3dc8e",
            
            30," #f5d389 ",
           
            60," #faac82",
            90," #f48e8c",
            120," #c35da8  ",
            146.6," #824ca2  ",
        ],
        "fill-opacity": 1,
        "fill-outline-color": "rgba(247, 244, 249, 0)"
      }
    });
    mapTransport.addLayer({
  id: "hexbin-outline",
  type: "line",
  source: "hexbin",
  paint: {
    "line-color": "rgba(247, 244, 249, 0)",
    "line-width": [
      "interpolate",
      ["exponential", 5],  // 指数平滑，base = 1.5
      ["zoom"],
      // zoom 5 时 width = 0.5px
      5, 0.1,
      // zoom 10 时 width = 2px
      10, 2,
      // zoom 15 时 width = 5px
      15, 5
    ]
  }
});

});