mapboxgl.accessToken = 'pk.eyJ1IjoibGljaGFyZCIsImEiOiJjbTg4Y2h1Z2wwcXA2MmlzYnN6Y3MxbDB4In0.4Zl2BKk9jfaG9927_p-hkw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/lichard/cmaijt15h00zu01sddta70fny',
  center: [2.35, 48.86],
  zoom: 12
});


let exhibitionData = null;
let currentMonth = 4; // May (0-indexed)
const year = 2025;

function setupMuseumFilterPanel(museumData) {
  const types = ["Art", "History", "Science", "Unclassified"];
  const filtersDiv = document.getElementById("museum-filters");
  filtersDiv.innerHTML = ""; // 清空

  types.forEach(type => {
    const id = `filter-${type.toLowerCase()}`;
    const html = `<label><input type="checkbox" id="${id}" checked data-type="${type}" /> ${type}</label>`;
    filtersDiv.insertAdjacentHTML('beforeend', html);
  });

  filtersDiv.addEventListener("change", () => {
    const checked = Array.from(filtersDiv.querySelectorAll("input:checked")).map(cb =>
      cb.getAttribute("data-type")
    );
    const filtered = {
      ...museumData,
      features: museumData.features.filter(f =>
        checked.includes(f.properties.category_grouped)
      )
    };
    map.getSource("museums").setData(filtered);
  });
}

function buildCalendar(month, eventsByDate) {
  document.getElementById("monthTitle").textContent = 
    new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  const table = document.getElementById('calendar-table');
  table.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let row = document.createElement('tr');
  for (let i = 0; i < firstDay; i++) row.appendChild(document.createElement('td'));

  for (let d = 1; d <= daysInMonth; d++) {
    const td = document.createElement('td');
    td.textContent = d;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (eventsByDate[dateStr]) {
      td.classList.add('has-event');
      td.addEventListener('click', () => handleDateClick(dateStr));
    }
    row.appendChild(td);
    if ((firstDay + d) % 7 === 0 || d === daysInMonth) {
      table.appendChild(row);
      row = document.createElement('tr');
    }
  }
}

function handleDateClick(selectedDate) {
    const popups = document.getElementsByClassName('mapboxgl-popup');
    while(popups[0]) popups[0].remove();

  const selectedTime = new Date(selectedDate).getTime();
  const weekLater = selectedTime + 7 * 86400000;

  const updated = {
    ...exhibitionData,
    features: exhibitionData.features.map(f => {
      const s = new Date(f.properties.date_start_clean).getTime();
      const e = new Date(f.properties.date_end_clean).getTime();
      const match = (selectedTime >= s && selectedTime <= e);
      const upcoming = (s > selectedTime && s <= weekLater);
      f.properties.status = match ? "today" : (upcoming ? "upcoming" : "other");
      return f;
    })
  };

  map.getSource("exhibitions").setData(updated);
  highlightCalendar(selectedDate);
}

function highlightCalendar(dateStr) {
  const selectedTime = new Date(dateStr).getTime();
  const weekLater = selectedTime + 7 * 86400000;
  const tds = document.querySelectorAll("#calendar-table td");

  tds.forEach(td => {
    td.classList.remove("today", "upcoming");
    const day = parseInt(td.textContent);
    const cellDate = new Date(year, currentMonth, day).toISOString().slice(0, 10);
    const time = new Date(cellDate).getTime();
    if (time === selectedTime) td.classList.add("today");
    else if (time > selectedTime && time <= weekLater) td.classList.add("upcoming");
  });
}

document.getElementById('prevMonth').onclick = () => {
  currentMonth = (currentMonth + 11) % 12;
  updateCalendar();
};
document.getElementById('nextMonth').onclick = () => {
  currentMonth = (currentMonth + 1) % 12;
  updateCalendar();
};

function updateCalendar() {
  const eventsByDate = groupEventsByDate(exhibitionData.features);
  buildCalendar(currentMonth, eventsByDate);
}

function groupEventsByDate(features) {
  const map = {};
  features.forEach(f => {
    const start = new Date(f.properties.date_start_clean);
    const end = new Date(f.properties.date_end_clean);
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const iso = d.toISOString().slice(0, 10);
      if (!map[iso]) map[iso] = [];
      map[iso].push(f);
    }
  });
  return map;
}

map.on('load', () => {
  // 加载新的 enriched 数据
  Promise.all([
    fetch("Data/museums_with_exhibition_counts.geojson").then(res => res.json()),
    fetch("Data/cultural_corridor.geojson").then(res => res.json())
  ]).then(([museumData, corridorData]) => {
    // ⬅️ 图层颜色映射
    const typeColors = {
      "Art": "#1f78b4",
      "History": "#e31a1c",
      "Science": "#33a02c",
      "Unclassified": "#999999"
    };

    // 给每个点添加颜色字段
    museumData.features.forEach(f => {
      const group = f.properties.category_grouped;
      f.properties.color = typeColors[group] || "#666666";
    });

    // 添加文化廊道线图层
    map.addSource("cultural-corridor", { type: "geojson", data: corridorData });
    map.addLayer({
      id: "cultural-corridor-line",
      type: "line",
      source: "cultural-corridor",
      paint: {
        "line-color": "#e31a1c",
        "line-width": 4,
        "line-opacity": 0.8
      }
    });

    // 添加博物馆点图层
    map.addSource("museums", { type: "geojson", data: museumData });
    map.addLayer({
      id: "museum-points",
      type: "circle",
      source: "museums",
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["get", "mean_visitors"],
          0, 4, 1000000, 20
        ],
        "circle-color": ["get", "color"],
        "circle-opacity": 0.75,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1
      }
    });

    map.on("click", "museum-points", (e) => {
      const p = e.features[0].properties;
      const content = `
        <strong>${p.name}</strong><br/>
        <em>Type:</em> ${p.category_grouped || "Unknown"}<br/>
        <em>Mean Visitors (2001–2021):</em> ${Math.round(p.mean_visitors).toLocaleString()}<br/>
        <em>Exhibitions Nearby:</em> ${p.exhibitions_within_500m}
      `;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(map);
    });

    // 初始化筛选面板
    setupMuseumFilterPanel(museumData);

    // === 可交互柱状图 ===
    const sorted = museumData.features.sort((a, b) =>
      b.properties.exhibitions_within_500m - a.properties.exhibitions_within_500m
    );
    const labels = sorted.map(f => f.properties.name);
    const values = sorted.map(f => f.properties.exhibitions_within_500m);
    const coordinates = sorted.map(f => f.geometry.coordinates);

    const ctx = document.getElementById("museumBarChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Exhibitions Nearby (within 500m)",
          data: values,
          backgroundColor: "#2b8cbe"
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        onClick: (e, elements) => {
          if (elements.length > 0) {
            const i = elements[0].index;
            const coords = coordinates[i];
            const name = labels[i];
            const count = values[i];
            map.flyTo({ center: coords, zoom: 15 });
            new mapboxgl.Popup()
              .setLngLat(coords)
              .setHTML(`<strong>${name}</strong><br/>Nearby Exhibitions: ${count}`)
              .addTo(map);
          }
        },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { autoSkip: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  });

  fetch("Data/exhibitions_clean_paris_final.geojson")
    .then(res => res.json())
    .then(data => {
      exhibitionData = data;

      map.addSource("exhibitions", { type: "geojson", data: data });

      map.addLayer({
        id: "exhibition-points",
        type: "circle",
        source: "exhibitions",
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "match",
            ["get", "status"],
            "today", "#2b8cbe",
            "upcoming", "#ffd700",
            "other", "#cccccc",
            "#cccccc"
          ],
          "circle-opacity": 0.85,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1
        }
      });

map.on("click", "exhibition-points", (e) => {
  const feature = e.features[0];
  const coords = feature.geometry?.coordinates;
  const p = feature.properties;

  if (!coords || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return;

  const content = `
    <strong>${p.title}</strong><br/>
    <em>Organizer:</em> ${p.contact_organisation_name || "N/A"}<br/>
    <em>Start:</em> ${p.date_start_clean || "?"}<br/>
    <em>End:</em> ${p.date_end_clean || "?"}<br/>
    <p>${p.description || ""}</p>
  `;

  new mapboxgl.Popup().setLngLat(coords).setHTML(content).addTo(map);
});

      updateCalendar();
    });
});
document.getElementById("toggle-exhibitions").addEventListener("change", e => {
  const visible = e.target.checked ? "visible" : "none";
  map.setLayoutProperty("exhibition-points", "visibility", visible);
});

document.getElementById("toggle-museums").addEventListener("change", e => {
  const visible = e.target.checked ? "visible" : "none";
  map.setLayoutProperty("museum-points", "visibility", visible);
});

document.getElementById("toggle-corridor").addEventListener("change", e => {
  const visible = e.target.checked ? "visible" : "none";
  map.setLayoutProperty("cultural-corridor-line", "visibility", visible);
});