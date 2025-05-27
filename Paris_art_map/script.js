// Global variables
let arrondissementsData;
let map;
let artData;
let markers = [];
let charts = {};
let selectedMunicipality = 'all';
let selectedTypes = ['street art', 'commande', 'un_pour_cent', 'others'];

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibGljaGFyZCIsImEiOiJjbTg4Y2h1Z2wwcXA2MmlzYnN6Y3MxbDB4In0.4Zl2BKk9jfaG9927_p-hkw';

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    initializeMap();
    setupEventListeners();
    updateStatistics();
    initializeCharts();
    updateVisualization();
});

// Load GeoJSON data
async function loadData() {
    try {
        const response = await fetch('Data/art_cleaned.geojson');
        artData = await response.json();
        console.log(`Loaded ${artData.features.length} artworks`);
        populateMunicipalityDropdown();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please check if data.geojson file exists.');
    }
}

// Initialize map
function initializeMap() {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [2.3522, 48.8566],
    zoom: 11.3
  });

  map.on('load', function () {
    displayArtworks();              // 加点
    addArrondissementBoundaries(); // ✅ 加边界
  });
}


// Display artwork markers
function displayArtworks() {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    const filteredFeatures = filterFeatures();

    filteredFeatures.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        const properties = feature.properties;

        // Create marker element
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = getColorByType(properties.typologie);
        el.style.width = '15px';
        el.style.height = '15px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(createPopupContent(properties));

        // Create marker
        const marker = new mapboxgl.Marker(el)
            .setLngLat([coordinates[0], coordinates[1]])
            .setPopup(popup)
            .addTo(map);

        markers.push(marker);
    });

    updateStatistics();
}

// Create popup content
function createPopupContent(properties) {
    const name = properties.nom || 'Untitled';
    const type = properties.typologie || 'Unknown';
    const municipality = properties.commune || 'Unknown';
    const accessibility = properties.accessibilite || 'Unknown';
    const source = properties.source || 'Unknown';

    return `
        <div class="popup-content">
            <div class="popup-title">${name}</div>
            <div class="popup-info">
                <strong>Type:</strong> ${formatType(type)}<br>
                <strong>Municipality:</strong> ${municipality}<br>
                <strong>Accessibility:</strong> ${formatAccessibility(accessibility)}<br>
                <strong>Source:</strong> ${source}
            </div>
        </div>
    `;
}

// Get color by artwork type
function getColorByType(rawType) {
    const key = (rawType || 'unknown').toLowerCase().replace(/[\s%]/g, '_');
    const colors = {
        'street_art': '#e74c3c',      // Red
        'commande': '#3498db',        // Blue
        'un_pour_cent': '#2ecc71',    // Green
        'others': '#95a5a6',
        'unknown': '#95a5a6'
    };
    return colors[key] || colors['others'];
}

// Format type for display
function formatType(type) {
    const typeMap = {
        'street art': 'Street Art',
        'commande': 'Commission',
        'un_pour_cent': '1% Art',
        'null': 'Unknown',
        '': 'Unknown'
    };
    return typeMap[type] || type || 'Unknown';
}

// Format accessibility for display
function formatAccessibility(accessibility) {
    const accessMap = {
        'accessible': 'Accessible',
        'visible': 'Visible',
        'non visible': 'Not Visible',
        'inconnue': 'Unknown',
        'null': 'Unknown',
        '': 'Unknown'
    };
    return accessMap[accessibility] || accessibility || 'Unknown';
}

// Filter features based on selected criteria
function filterFeatures() {
    return artData.features.filter(feature => {
        const properties = feature.properties;

        // 使用 l_ar 字段来筛选
        if (selectedMunicipality !== 'all' && properties['l_ar'] !== selectedMunicipality) {
            return false;
        }

        const type = properties.typologie || 'others';
        const typeCategory = getTypeCategory(type);
        return selectedTypes.includes(typeCategory);
    });
}


// Get type category for filtering
function getTypeCategory(type) {
    if (!type || type === 'null' || type === '') return 'others';
    if (type === 'street art') return 'street art';
    if (type === 'commande') return 'commande';
    if (type === 'un_pour_cent') return 'un_pour_cent';
    return 'others';
}

// Populate municipality dropdown
function populateMunicipalityDropdown() {
    const arrondissements = [...new Set(artData.features.map(f => f.properties['l_ar']))];

    // 自定义排序：提取数字部分并按数值排序
    arrondissements.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
    });

    const select = document.getElementById('municipalitySelect');
    select.innerHTML = ''; // 清空原选项

    // 添加 "All" 选项
    const defaultOption = document.createElement('option');
    defaultOption.value = 'all';
    defaultOption.textContent = 'All Arrondissements';
    select.appendChild(defaultOption);

    // 添加每个区选项
    arrondissements.forEach(ar => {
        if (ar) {
            const option = document.createElement('option');
            option.value = ar;
            option.textContent = ar;
            select.appendChild(option);
        }
    });
}


// Add municipality boundaries (placeholder - would need actual boundary data)
function addMunicipalityBoundaries() {
    // This is a placeholder. In a real application, you would load actual municipality boundary data
    // For now, we'll just add a simple layer that can be clicked
    map.on('click', function(e) {
        // You could implement municipality selection by clicking on the map here
    });
}

// Setup event listeners
function setupEventListeners() {
    // Type checkboxes
    document.querySelectorAll('.filter-checkboxes input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectedTypes();
            displayArtworks();
            updateVisualization();
        });
    });

    // Municipality dropdown
    document.getElementById('municipalitySelect').addEventListener('change', function() {
        selectedMunicipality = this.value;
        document.getElementById('selectedMunicipality').textContent = 
            selectedMunicipality === 'all' ? 'All' : selectedMunicipality;
        displayArtworks();
        updateVisualization();
    });

    // Reset button
    document.getElementById('resetFilters').addEventListener('click', function() {
        // Reset checkboxes
        document.querySelectorAll('.filter-checkboxes input').forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Reset municipality
        document.getElementById('municipalitySelect').value = 'all';
        selectedMunicipality = 'all';
        
        // Update display
        updateSelectedTypes();
        displayArtworks();
        updateVisualization();
    });

    // Panel toggle
    const panel = document.getElementById('bottomPanel');
    const toggle = document.getElementById('panelToggle');
    let isPanelOpen = true;

    toggle.addEventListener('click', function() {
        isPanelOpen = !isPanelOpen;
        panel.classList.toggle('collapsed');
        toggle.innerHTML = isPanelOpen ? 
            '<span>▼ Analytics Dashboard ▼</span>' : 
            '<span>▲ Analytics Dashboard ▲</span>';
        
        // Resize charts when panel opens
        if (isPanelOpen) {
            setTimeout(() => {
                Object.values(charts).forEach(chart => chart.resize());
            }, 300);
        }
    });
}

// Update selected types array
function updateSelectedTypes() {
    selectedTypes = [];
    document.querySelectorAll('.filter-checkboxes input:checked').forEach(checkbox => {
        selectedTypes.push(checkbox.value);
    });
}

// Update statistics
function updateStatistics() {
    const filteredFeatures = filterFeatures();
    document.getElementById('totalCount').textContent = filteredFeatures.length;
}

// Initialize all charts
function initializeCharts() {
    // Type distribution chart
    const typeCtx = document.getElementById('typeDistributionChart').getContext('2d');
    charts.typeDistribution = new Chart(typeCtx, {
    type: 'doughnut',
    data: { labels: [], datasets: [] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Art Types Distribution in Paris Districts'
            },
            legend: {
                position: 'bottom'
            }
        }
    }
});

    // Accessibility chart
    const accessCtx = document.getElementById('accessibilityChart').getContext('2d');
    charts.accessibility = new Chart(accessCtx, {
  type: 'bar',
  data: { labels: [], datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',  // ✅ 横向条形图（关键）
    plugins: {
      title: {
        display: true,
        text: 'Accessibility Categories by Dirtricts'
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true
      }
    }
  }
});




    // Municipality bar chart
    const muniBarCtx = document.getElementById('municipalityBarChart').getContext('2d');
    charts.municipalityBar = new Chart(muniBarCtx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Artworks Count per District'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Municipality pie chart
    const muniPieCtx = document.getElementById('municipalityPieChart').getContext('2d');
    charts.municipalityPie = new Chart(muniPieCtx, {
        type: 'pie',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of Artworks Count by District'
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

// Update visualization charts
function updateVisualization() {
    const filteredFeatures = filterFeatures();

    // 左图用过滤后数据（选区内）
    updateTypeDistributionChart(filteredFeatures);
    updateAccessibilityChart(filteredFeatures);

    // ✅ 右图保持显示全部数据（始终不变）
    updateMunicipalityCharts(artData.features);
}

// Update type distribution chart
function updateTypeDistributionChart(features) {
    const filtered = features.filter(f => {
        return selectedMunicipality === 'all' || f.properties['l_ar'] === selectedMunicipality;
    });

    const rawTypeCounts = {};
    filtered.forEach(f => {
        const rawType = f.properties.typologie || 'unknown';
        const key = rawType.toLowerCase().replace(/[\s%]/g, '_');
        rawTypeCounts[key] = (rawTypeCounts[key] || 0) + 1;
    });

    // 显示 label 和颜色按原始值映射
    const labelMap = {
        'street_art': 'Street Art',
        'commande': 'Commission',
        'un_pour_cent': '1% Art',
        'others': 'Others',
        'unknown': 'Unknown'
    };

    const labels = Object.keys(rawTypeCounts).map(k => labelMap[k] || k);
    const values = Object.values(rawTypeCounts);
    const colors = Object.keys(rawTypeCounts).map(k => getColorByType(k));

    charts.typeDistribution.data = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: colors
        }]
    };
    charts.typeDistribution.update();
}



// Update accessibility chart
function updateAccessibilityChart(features) {
    const accessibility = {};

    features.forEach(feature => {
        const access = formatAccessibility(feature.properties.accessibilite);
        accessibility[access] = (accessibility[access] || 0) + 1;
    });

    // 排序可选
    const sorted = Object.entries(accessibility).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const values = sorted.map(item => item[1]);

    const purpleColors = [
        '#8e44ad', '#9b59b6', '#af7ac5', '#bb8fce',
        '#d2b4de', '#e8daef', '#6c3483', '#76448a',
        '#884ea0', '#a569bd', '#c39bd3', '#d7bde2'
    ];

    charts.accessibility.data = {
        labels: labels,
        datasets: [{
            label: 'Count',
            data: values,
            backgroundColor: purpleColors.slice(0, labels.length)
        }]
    };
    charts.accessibility.update();
}


// Update municipality charts
function updateMunicipalityCharts(features) {
    const arrondissementCounts = {};

    features.forEach(feature => {
        const ar = feature.properties['l_ar'];
        if (ar) {
            arrondissementCounts[ar] = (arrondissementCounts[ar] || 0) + 1;
        }
    });

    // 自定义排序：从 1er 到 20ème
    const sortByNumber = (a, b) => parseInt(a) - parseInt(b);
    const sortedArrs = Object.entries(arrondissementCounts)
        .sort((a, b) => sortByNumber(a[0], b[0]));

    const labels = sortedArrs.map(item => item[0]);
    const values = sortedArrs.map(item => item[1]);

    // 更新柱状图
    charts.municipalityBar.data = {
        labels: labels,
        datasets: [{
            label: 'Number of Artworks',
            data: values,
            backgroundColor: '#9b59b6'  // 蓝色
        }]
    };
    charts.municipalityBar.update();

    
    // 更新饼图（可选）
    charts.municipalityPie.data = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: [
                '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
                '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400',
                '#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad',
                '#16a085', '#7f8c8d', '#f1948a', '#5dade2', '#52be80'
            ]
        }]
    };
    charts.municipalityPie.update();
}


function addArrondissementBoundaries() {
  map.addSource('arrondissements', {
    type: 'geojson',
    data: 'Data/paris-arrondissements.geojson'
  });

  map.addLayer({
    id: 'arrondissements-outline',
    type: 'line',
    source: 'arrondissements',
    paint: {
      'line-color': 'rgb(52, 73, 94)',
      'line-width': 1.5,
      'line-opacity': 0.5
    }
  });

    // 添加透明填充层用于点击
  map.addLayer({
    id: 'arrondissement-click-area',
    type: 'fill',
    source: 'arrondissements',
    paint: {
      'fill-color': 'rgb(52, 73, 94)',
      'fill-opacity': 0.2
    }
  });

  // ✅ 鼠标悬停时改变为手型
  map.on('mouseenter', 'arrondissement-click-area', function () {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'arrondissement-click-area', function () {
    map.getCanvas().style.cursor = '';
  });

  // ✅ 点击边界时联动左侧下拉框
// 点击边界 → 选中区 → 同步下拉菜单 + 图表
  map.on('click', 'arrondissement-click-area', (e) => {
    const clickedFeature = e.features[0];
    const selectedArrondissement = clickedFeature.properties['l_ar'];

    // 设置下拉框值
    const selectEl = document.getElementById('municipalitySelect');
    selectEl.value = selectedArrondissement;

    // 更新全局状态并重新更新图表和地图
    selectedMunicipality = selectedArrondissement;
    displayArtworks();
    updateVisualization();
  });
}

