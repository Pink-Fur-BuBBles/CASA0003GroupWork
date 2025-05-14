mapboxgl.accessToken = 'pk.eyJ1IjoibGljaGFyZCIsImEiOiJjbTg4Y2h1Z2wwcXA2MmlzYnN6Y3MxbDB4In0.4Zl2BKk9jfaG9927_p-hkw';

const mapCommerce = new mapboxgl.Map({
  container: 'before',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [2.35, 48.85],
  zoom: 11.3
});

const mapTransport = new mapboxgl.Map({
  container: 'after',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [2.35, 48.85],
  zoom: 11.3
});

new mapboxgl.Compare(mapCommerce, mapTransport, '#comparison-container');

function addHeatmapAndPoints(map, id, dataUrl, colors, pointColor, pointLayerId) {
  map.on('load', () => {
    map.addSource(id, {
      type: 'geojson',
      data: dataUrl
    });

    map.addLayer({
      id: `${id}-heat`,
      type: 'heatmap',
      source: id,
      layout: {
        visibility: 'none'
      },
      maxzoom: 15,
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': 1,
        'heatmap-radius': 20,
        'heatmap-opacity': 0.7,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, colors[0],
          0.4, colors[1],
          0.6, colors[2],
          0.8, colors[3],
          1, colors[4]
        ]
      }
    });

    map.addLayer({
      id: pointLayerId,
      type: 'circle',
      source: id,
      paint: {
        'circle-radius': 3,
        'circle-color': pointColor,
        'circle-opacity': 0.8
      }
    });
  });
}

addHeatmapAndPoints(
  mapCommerce,
  'commerce',
  'Data/commerce_heatmap_paris.geojson',
  ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'],
  '#ffaa00',
  'commerce-point-layer'
);

addHeatmapAndPoints(
  mapTransport,
  'transport',
  'Data/transport_heatmap_paris.geojson',
  ['#edf8fb', '#b3cde3', '#8c96c6', '#8856a7', '#810f7c'],
  '#00aaff',
  'transport-point-layer'
);

fetch('Data/arrondissements.geojson')
  .then(res => res.json())
  .then(boundary => {
    mapCommerce.addSource('paris-boundary', { type: 'geojson', data: boundary });
    mapTransport.addSource('paris-boundary', { type: 'geojson', data: boundary });

    mapCommerce.setFilter('commerce-heat', ['within', boundary]);
    mapTransport.setFilter('transport-heat', ['within', boundary]);

    mapCommerce.addLayer({
      id: 'paris-boundary-line',
      type: 'line',
      source: 'paris-boundary',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2,
        'line-opacity': 0.8
      }
    });

    mapTransport.addLayer({
      id: 'paris-boundary-line',
      type: 'line',
      source: 'paris-boundary',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2,
        'line-opacity': 0.8
      }
    });

    mapCommerce.addLayer({
      id: 'paris-boundary-label',
      type: 'symbol',
      source: 'paris-boundary',
      layout: {
        'text-field': ['get', 'l_ar'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    });

    mapTransport.addLayer({
      id: 'paris-boundary-label',
      type: 'symbol',
      source: 'paris-boundary',
      layout: {
        'text-field': ['get', 'l_ar'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }
    });
  });

document.querySelectorAll('#layer-toggle-left input, #layer-toggle-right input')
  .forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const layerId = e.target.dataset.layer;
      const map = layerId.startsWith('commerce') ? mapCommerce : mapTransport;
      map.setLayoutProperty(layerId, 'visibility', e.target.checked ? 'visible' : 'none');
    });
  });

// Chart.js dynamic panel
let chart;
let currentType = 'bar';
let businessFields = [];
let barData = [];
let pieData = [];

Promise.all([
  fetch('Data/commerce_by_arrondissement.json').then(res => res.json()),
  fetch('Data/commerce_total_by_type.json').then(res => res.json())
]).then(([barSource, pieSource]) => {
  businessFields = Object.keys(barSource[0]).filter(k => k !== 'arrondissement');

  const select = document.getElementById('business-type-select');
  businessFields.forEach(field => {
    const opt = document.createElement('option');
    opt.value = field;
    opt.text = field.replace(/_/g, ' ');
    select.appendChild(opt);
  });

  pieData = {
    labels: pieSource.map(d => d.type),
    datasets: [{
      data: pieSource.map(d => d.count),
      backgroundColor: pieSource.map((_, i) => `hsl(${(i * 360 / pieSource.length)}, 60%, 60%)`)
    }]
  };

  updateBarChart(barSource, businessFields[0]);

  select.addEventListener('change', e => {
    if (currentType === 'bar') {
      updateBarChart(barSource, e.target.value);
    }
  });

  document.getElementById('toggle-chart-type').addEventListener('click', () => {
    const canvas = document.getElementById('business-chart');
    if (chart) chart.destroy();

    if (currentType === 'bar') {
      chart = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: pieData,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              align: 'center',
              labels: { boxWidth: 16, padding: 10 }
            },
            title: {
              display: true,
              text: 'Business Type Proportion (All Districts)',
              font: { size: 16 }
            }
          }
        }
      });
      currentType = 'pie';
      document.getElementById('toggle-chart-type').innerText = 'Switch to Bar';
      select.disabled = true;
    } else {
      updateBarChart(barSource, select.value);
      currentType = 'bar';
      document.getElementById('toggle-chart-type').innerText = 'Switch to Pie';
      select.disabled = false;
    }
  });
});

function updateBarChart(data, field) {
  const ctx = document.getElementById('business-chart').getContext('2d');
  if (chart) chart.destroy();

  const arrLabels = data.map(d => {
    const num = parseInt(d.arrondissement);
    return isNaN(num) ? (d.arrondissement ?? 'Unknown') : `${num}${num === 1 ? 'er' : 'e'}`;
  });

  const values = data.map(d => {
    const val = d[field];
    return typeof val === 'number' ? val : parseInt(val) || 0;
  });

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: arrLabels,
      datasets: [{
        label: `Number of ${field.replace(/_/g, ' ')}`,
        data: values,
        backgroundColor: '#4682b4'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Distribution of ${field.replace(/_/g, ' ')} by Arrondissement`,
          font: { size: 16 }
        },
        legend: { display: false }
      },
      scales: {
        x: {
          title: { display: true, text: 'Arrondissement' },
          ticks: { maxRotation: 45, minRotation: 45, autoSkip: false }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Number of businesses' }
        }
      }
    }
  });
}