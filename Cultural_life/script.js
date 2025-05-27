mapboxgl.accessToken = 'pk.eyJ1IjoibGljaGFyZCIsImEiOiJjbTg4Y2h1Z2wwcXA2MmlzYnN6Y3MxbDB4In0.4Zl2BKk9jfaG9927_p-hkw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/lichard/cmayickvu009s01r42eheb35n',
  center: [2.35, 48.86],
  zoom: 12
});

let museumData = null;
const selectedMuseums = new Set();
const activeBubbles = new Map();
const pulsingDot = {
  width: 200,
  height: 200,
  data: new Uint8Array(200 * 200 * 4),

  onAdd: function () {
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    this.context = canvas.getContext("2d");
  },

  render: function () {
    const duration = 2000;
    const t = (performance.now() % duration) / duration;

    const baseRadius = this.width * 0.05;
    const maxOuterRadius = this.width * 0.35;
    const outerRadius = baseRadius + (maxOuterRadius * t);

    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);

    // 外圈动画 - 冰蓝色渐变
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 220, 255, ${1 - t})`; // 冰蓝色
    ctx.fill();

    // 内圈实心 - 冰蓝 + 白边
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#b4dcff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    this.data = ctx.getImageData(0, 0, this.width, this.height).data;
    map.triggerRepaint();
    return true;
  }
};

const pulsingDotYellow = {
  width: 200,
  height: 200,
  data: new Uint8Array(200 * 200 * 4),

  onAdd: function () {
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    this.context = canvas.getContext("2d");
  },

  render: function () {
    const duration = 1800;
    const t = (performance.now() % duration) / duration;

    const baseRadius = this.width * 0.05;
    const maxOuterRadius = this.width * 0.35;
    const outerRadius = baseRadius + (maxOuterRadius * t);

    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);

    // 外圈动画 - 柔米黄
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 180, ${1 - t})`;
    ctx.fill();

    // 内圈实心 - 同样为米黄 + 白边
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffb4";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    this.data = ctx.getImageData(0, 0, this.width, this.height).data;
    map.triggerRepaint();
    return true;
  }
};

// === 1. 初始化物理世界 ===
const Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body;

const engine = Engine.create();
engine.gravity.y = 0;

const canvas = document.getElementById('physics-canvas');
canvas.width = 180;

const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: 180,
    height: window.innerHeight * 0.9,
    wireframes: false,
    background: 'rgba(20, 20, 20, 0.5)',
    pixelRatio: 2
  }
});

Matter.Events.on(engine, "beforeUpdate", function () {
  const bodies = engine.world.bodies;
  
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    if (!a.customData) continue;

    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      if (!b.customData) continue;

      // ✅ 只同类别吸引
      if (a.customData.type !== b.customData.type) continue;

      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // ✅ 吸附半径内才吸引（避免远距连线）
      if (dist < 1000 && dist > 5) {
        const force = 0.00001;  // 吸引力大小
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        Matter.Body.applyForce(a, a.position, { x: fx, y: fy });
        Matter.Body.applyForce(b, b.position, { x: -fx, y: -fy });
      }
    }
  }
});

const tooltip = document.getElementById("bubble-tooltip");

let lastHoveredBall = null;

render.canvas.addEventListener("mousemove", (e) => {
  const rect = render.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const hovered = Matter.Query.point(engine.world.bodies, { x: mouseX, y: mouseY });
  const ball = hovered.find(b => b.customData);

  if (ball) {
    const d = ball.customData;

    tooltip.style.display = "block";
    tooltip.style.left = `${e.clientX + 10}px`;
    tooltip.style.top = `${e.clientY + 10}px`;
    tooltip.innerHTML = `
      <strong>${d.name}</strong><br/>
      Visitors: ${Math.round(d.visitors).toLocaleString()}<br/>
      Nearby Exhibitions: ${d.exhibitions}
    `;

if (ball !== lastHoveredBall) {
  // 1️⃣ 还原上一个小球
  if (lastHoveredBall) {
    lastHoveredBall.render.sprite.xScale /= 1.3;
    lastHoveredBall.render.sprite.yScale /= 1.3;

    // 还原半径
    Matter.Body.scale(lastHoveredBall, 1 / 1.3, 1 / 1.3);
  }

  // 2️⃣ 放大当前小球 sprite
  ball.render.sprite.xScale *= 1.3;
  ball.render.sprite.yScale *= 1.3;

  // ✅ 同步放大物理半径（增加碰撞体积）
  Matter.Body.scale(ball, 1.3, 1.3);
  ball.restitution = 1.2;

  // 其他联动逻辑保持不变
  map.flyTo({ center: d.geoCoords, zoom: 14 });
  map.setFeatureState({ source: 'museums', id: d.name }, { hover: true });
  map.setFilter("museum-icons-hover", ["==", "name", d.name]);

  lastHoveredBall = ball;
}
  } else {
    tooltip.style.display = "none";
    if (lastHoveredBall) {
      lastHoveredBall.render.sprite.xScale /= 1.3;
      lastHoveredBall.render.sprite.yScale /= 1.3;

      // ✅ 修复：同步还原物理碰撞体积
      Matter.Body.scale(lastHoveredBall, 1 / 1.3, 1 / 1.3);
      lastHoveredBall.restitution = 0.9;

      map.setFeatureState({ source: 'museums', id: lastHoveredBall.customData.name }, { hover: false });
      map.setFilter("museum-icons-hover", ["==", "name", ""]);
      lastHoveredBall = null;
    }
  }
});

render.canvas.addEventListener("mousedown", (e) => {
  const rect = render.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const clicked = Matter.Query.point(engine.world.bodies, { x: mouseX, y: mouseY });
  const ball = clicked.find(b => b.customData);

  if (ball) {
    // 从世界中移除
    Matter.World.remove(engine.world, ball);
    selectedMuseums.delete(ball.customData.mapboxId);

    // 还原地图上该点的 clicked 状态
    const name = ball.customData.name;
    museumData.features.forEach(f => {
      if (f.properties.name === name) f.properties.clicked = false;
    });
    map.getSource("museums").setData(museumData);
    map.setFeatureState({
      source: "museums",
      id: ball.customData.mapboxId
    }, { added: false });
  }
});

// 添加容器边界
const width = 180;
const height = canvas.height;

const walls = [
  Bodies.rectangle(width / 2, height, width, 20, { isStatic: true }), // bottom
  Bodies.rectangle(width / 2, 0, width, 20, { isStatic: true }),      // top
  Bodies.rectangle(0, height / 2, 20, height, { isStatic: true }),    // left
  Bodies.rectangle(width, height / 2, 20, height, { isStatic: true }) // right
];
World.add(engine.world, walls);

Engine.run(engine);
Render.run(render);

let exhibitionData = null;
let currentMonth = 4; // May (0-indexed)
const year = 2025;

function setupMuseumFilterPanel(museumData) {
  const icons = document.querySelectorAll(".icon-btn");
  const toggle = document.getElementById("toggle-museums");
  const iconContainer = document.getElementById("museum-filters");

  const selectedTypes = new Set(["Art", "History", "Science", "Unclassified"]);

  // === 图标点击 ===
  icons.forEach(icon => {
    icon.addEventListener("click", () => {
      const type = icon.dataset.type;

      // ✅ 如果总开关关闭，则重新开启
      if (!toggle.checked) {
        toggle.checked = true;
        map.setLayoutProperty("museum-icons", "visible");
        iconContainer.classList.remove("disabled");
      }

      // ✅ 切换选中状态
      if (selectedTypes.has(type)) {
        selectedTypes.delete(type);
        icon.classList.remove("selected");
      } else {
        selectedTypes.add(type);
        icon.classList.add("selected");
      }

      // ✅ 重新过滤地图数据
      const filtered = {
        ...museumData,
        features: museumData.features.filter(f =>
          selectedTypes.has(f.properties.category_grouped)
        )
      };
      map.getSource("museums").setData(filtered);
      // ✅ 联动右侧容器：移除该类别的小球
      engine.world.bodies.forEach(body => {
      const toRemove = engine.world.bodies.filter(body => {
        return body.customData && !selectedTypes.has(body.customData.type);
      });

      toRemove.forEach(body => {
        const mapboxId = body.customData.mapboxId;

        World.remove(engine.world, body);
        map.setFeatureState({ source: "museums", id: mapboxId }, { added: false });
        selectedMuseums.delete(mapboxId);
      });
      });
    });
  });

  // === Toggle 联动 ===
  toggle.addEventListener("change", () => {
    const visible = toggle.checked ? "visible" : "none";
    map.setLayoutProperty("museum-icons", "visibility", visible);

    // 联动四个图标状态
    if (!toggle.checked) {
      // 取消所有类型选中
      icons.forEach(icon => icon.classList.remove("selected"));
      selectedTypes.clear();
      iconContainer.classList.add("disabled");
    } else {
      // 恢复全选状态
      ["Art", "History", "Science", "Unclassified"].forEach(type => selectedTypes.add(type));
      icons.forEach(icon => icon.classList.add("selected"));
      iconContainer.classList.remove("disabled");
    }

    // 应用筛选逻辑
    const filtered = {
      ...museumData,
      features: museumData.features.filter(f =>
        selectedTypes.has(f.properties.category_grouped)
      )
    };
    map.getSource("museums").setData(filtered);
  });
}

function buildCalendar(month, eventsByDate) {
  document.getElementById("monthTitle").textContent =
    new Date(year, month).toLocaleString('en-GB', { month: 'long', year: 'numeric' });

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

    td.addEventListener('click', () => handleDateClick(dateStr));

    if (eventsByDate[dateStr]) {
      td.classList.add('has-event');
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
  while (popups[0]) popups[0].remove();

  const futureDate = getFutureDate(selectedDate, 7);

  const updated = {
    ...exhibitionData,
    features: exhibitionData.features.map(f => {
      const start = f.properties.date_start_clean;
      const end = f.properties.date_end_clean;

      const isToday = selectedDate >= start && selectedDate <= end;
      const isUpcoming = start > selectedDate && start <= futureDate;

      f.properties.status = isToday ? "today" : (isUpcoming ? "upcoming" : "other");
      return f;
    })
  };

  highlightCalendar(selectedDate);
  map.getSource("exhibitions").setData(updated);

  setTimeout(() => {
    map.setFilter("exhibition-today-pulse", ["==", ["get", "status"], "today"]);
    map.setFilter("exhibition-upcoming-pulse", ["==", ["get", "status"], "upcoming"]);

    map.setLayoutProperty("exhibition-today-pulse", "visibility", "visible");
    map.setLayoutProperty("exhibition-upcoming-pulse", "visibility", "visible");

    setTimeout(() => {
      map.setLayoutProperty("exhibition-today-pulse", "visibility", "visible");
      map.setLayoutProperty("exhibition-upcoming-pulse", "visibility", "visible");
    }, 3500);
  }, 100);
}

function getFutureDate(dateStr, daysAhead) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10); // 返回“YYYY-MM-DD”
}

function highlightCalendar(dateStr) {
  const selectedTime = new Date(dateStr).getTime();
  const weekLater = selectedTime + 7 * 86400000;
  const tds = document.querySelectorAll("#calendar-table td");

  tds.forEach(td => {
    td.classList.remove("today", "upcoming");
    const day = parseInt(td.textContent);
    const cellDate = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
  // 加载四个 icon 图标
    const iconList = [
      { name: "icon-art", url: "icons/art.png" },
      { name: "icon-history", url: "icons/history.png" },
      { name: "icon-science", url: "icons/science.png" },
      { name: "icon-unclassified", url: "icons/unclassified.png" }
    ];

    Promise.all(
      iconList.map(icon =>
        new Promise((resolve, reject) => {
          map.loadImage(icon.url, (error, image) => {
            if (error) reject(error);
            if (!map.hasImage(icon.name)) map.addImage(icon.name, image);
            resolve();
          });
        })
      )
    ).then(() => {

    map.addLayer({
      id: "museum-icons",
      type: "symbol",
      source: "museums",
      layout: {
        "icon-image": [
          "match", ["get", "category_grouped"],
          "Art", "icon-art",
          "History", "icon-history",
          "Science", "icon-science",
          "Unclassified", "icon-unclassified",
          "icon-unclassified"
        ],
        "icon-size": 0.05,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        paint: {
        "circle-stroke-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#FFD700",
          "#ffffff"
        ],
        "circle-stroke-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          3,
          1
        ]
      }}
    });
    
    map.addLayer({
      id: "museum-overlay",
      type: "symbol",
      source: "museums",
      layout: {
        "icon-image": "black_circle",
        "icon-size": 0.02,
        "icon-allow-overlap": true
      },
      paint: {
        "icon-opacity": [
          "case",
          ["boolean", ["feature-state", "added"], false],
          0.35,
          0
        ]
      }
    });

    map.addLayer({
      id: "museum-icons-hover",
      type: "symbol",
      source: "museums",
      layout: {
        "icon-image": [
          "match", ["get", "category_grouped"],
          "Art", "icon-art",
          "History", "icon-history",
          "Science", "icon-science",
          "Unclassified", "icon-unclassified",
          "icon-unclassified"
        ],
        "icon-size": 0.1,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      },
      filter: ["==", "name", ""]
    });
  });
  
  // 加载新的 enriched 数据
  Promise.all([
    fetch("Data/museums_with_exhibition_counts.geojson").then(res => res.json())
  ]).then(([data]) => {
    museumData = data;
    museumData.features.forEach((f, i) => {
      f.id = i;
      f.properties._id = i;
    });
    
    // 添加博物馆点图层
    map.addSource("museums", {
      type: "geojson",
      data: museumData,
      generateId: true
    });
    map.loadImage("icons/black_circle.png", (error, image) => {
      if (error) throw error;
      if (!map.hasImage("black_circle")) {
        map.addImage("black_circle", image, { sdf: false });
      }
    });
    
    map.on("click", "museum-icons", (e) => {
      const p = e.features[0].properties;
      const coords = e.features[0].geometry.coordinates;
      const category = p.category_grouped || "Unclassified";

      const iconMap = {
        "Art": "icons/art.png",
        "History": "icons/history.png",
        "Science": "icons/science.png",
        "Unclassified": "icons/unclassified.png"
      };

      const imgUrl = iconMap[category];

      const raw = Math.log10(p.mean_visitors + 1) * Math.sqrt(p.exhibitions_within_500m + 1);
      const size = Math.max(20, Math.min(50, raw * 1.2));
      const scale = (size / 64) * 0.3;

      const id = e.features[0].id;
      if (selectedMuseums.has(id)) {
        return;
      }
      selectedMuseums.add(id);

      const startX = Math.random() * (100 - 40) + 80;  // X 范围：80 到 200
      const startY = Math.random() * (700 - 50) + 100; // Y 范围：100 到 300

      const ball = Matter.Bodies.circle(startX, startY, size / 2, {
        restitution: 0.9,
        frictionAir: 0.04,
        friction: 0.001,
        render: {
          sprite: {
            texture: imgUrl,
            xScale: 0.1,
            yScale: 0.1
          }
        }
      });

      ball.customData = {
        name: p.name,
        type: p.category_grouped,
        visitors: p.mean_visitors,
        exhibitions: p.exhibitions_within_500m,
        geoCoords: coords,
        mapboxId: e.features[0].id
      };

      function animateBubbleGrowth(ball, targetScale) {
        const step = 0.02;
        const interval = setInterval(() => {
          const sprite = ball.render.sprite;
          if (sprite.xScale < targetScale) {
            sprite.xScale += step;
            sprite.yScale += step;
          } else {
            sprite.xScale = targetScale;
            sprite.yScale = targetScale;
            clearInterval(interval);
          }
        }, 16); // ~60fps
      }

      Body.setVelocity(ball, {
        x: (Math.random() - 0.5) * 3,
        y: (Math.random() - 0.5) * 3
      });
      
      World.add(engine.world, ball);
      animateBubbleGrowth(ball, scale);

      map.setFeatureState({
        source: "museums",
        id: e.features[0].id
      }, { added: true });
    });

    // ✅ 删除小球时取消白圈覆盖状态
    canvas.addEventListener("click", (e) => {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      const clicked = Matter.Query.point(engine.world.bodies, { x: mouseX, y: mouseY });

      const target = clicked.find(b => b.customData);
      if (target) {
        World.remove(engine.world, target);
        map.setFeatureState({
          source: "museums",
          id: target.customData.mapboxId
        }, { added: false });
        tooltip.style.display = "none";
      }
    });

        // 初始化筛选面板
        setupMuseumFilterPanel(museumData);
      });

      fetch("Data/exhibitions_clean_paris_final.geojson")
        .then(res => res.json())
        .then(data => {
        const today = new Date();
        const weekLater = new Date();
        weekLater.setDate(today.getDate() + 7);

        // ✅ 初始化 status 字段
        data.features.forEach(f => {
          f.properties.status = "other";
        });

          exhibitionData = data;

          map.addSource("exhibitions", { type: "geojson", data: data });

          map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

          map.addImage('pulsing-dot-yellow', pulsingDotYellow, { pixelRatio: 2 });

          map.addLayer({
            id: "exhibition-today-pulse",
            type: "symbol",
            source: "exhibitions",
            layout: {
              "icon-image": "pulsing-dot",
              "icon-size": 0.5,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "visibility": "none"
            },
            filter: ["==", ["get", "status"], "today"]
          });

          map.addLayer({
            id: "exhibition-upcoming-pulse",
            type: "symbol",
            source: "exhibitions",
            layout: {
              "icon-image": "pulsing-dot-yellow",
              "icon-size": 0.5,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "visibility": "none"
            },
            filter: ["==", ["get", "status"], "upcoming"]
          });

          map.addLayer({
            id: "exhibition-points",
            type: "circle",
            source: "exhibitions",
            paint: {
              // 固定大小：避免与 museum 冲突
              "circle-radius": 5,
              "circle-color": "rgb(200, 200, 200)",  // 主色统一为灰色
              // 状态决定边框
              "circle-color": [
                "match", ["get", "status"],
                "today", " #b4dcff", 
                "upcoming", " #ffffb4",
                "other", " rgb(200, 200, 200)",      // 同色 other（无边框感）
                " rgb(200, 200, 200)"
              ],
              "circle-opacity": 0.8
            }
          });

          // 紧接在 exhibition-points 图层后面添加
          map.addLayer({
            id: "exhibition-click-area",
            type: "circle",
            source: "exhibitions",
            paint: {
              "circle-radius": 12,               // 点击半径
              "circle-color": "rgba(0,0,0,0)"    // 完全透明
            }
          });
          // 把事件绑定到这个新图层上
          map.on("click", "exhibition-click-area", (e) => {
            // 同样的逻辑：打开 Popup、触发脉冲……
          });
          map.on("mouseenter", "exhibition-click-area", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "exhibition-click-area", () => {
            map.getCanvas().style.cursor = "";
          });


// 让鼠标在展览点可点击时变成小手指
map.on("mouseenter", "exhibition-points", () => {
  map.getCanvas().style.cursor = "pointer";
});
map.on("mouseleave", "exhibition-points", () => {
  map.getCanvas().style.cursor = "";
});


          map.on("click", "exhibition-points", (e) => {
            const feature = e.features[0];
            const coords = feature.geometry?.coordinates;
            const p = feature.properties;

            if (p.status === "other") return;
            
            if (!coords || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return;

            // exhibition-points popup
            const content = `
              <strong>${p.title}</strong><br/>
              <em>Organizer:</em> ${p.contact_organisation_name || "N/A"}<br/>
              <em>Start:</em> ${p.date_start_clean || "?"}<br/>
              <em>End:</em> ${p.date_end_clean || "?"}<br/>
              <div class="popup-description">${p.description || ""}</div>
            `;

            new mapboxgl.Popup().setLngLat(coords).setHTML(content).addTo(map);
          });
                updateCalendar();
        });
    });

document.getElementById("toggle-exhibitions").addEventListener("click", (e) => {
  const btn = e.target;
  const active = btn.classList.toggle("selected");
  const visibility = active ? "visible" : "none";
  map.setLayoutProperty("exhibition-points", "visibility", visibility);
});

document.getElementById("toggle-museums").addEventListener("click", (e) => {
  const btn = e.target;
  const active = btn.classList.toggle("selected");
  const visibility = active ? "visible" : "none";
  map.setLayoutProperty("museum-icons", "visibility", visibility);

  // ✅ 如果要联动清除小球容器：
  if (!active) {
    const toRemove = engine.world.bodies.filter(b => b.customData);
    toRemove.forEach(b => {
      World.remove(engine.world, b);
      map.setFeatureState({ source: "museums", id: b.customData.mapboxId }, { added: false });
      selectedMuseums.delete(b.customData.mapboxId);
    });
  }
});

document.getElementById("physics-canvas").addEventListener("mouseleave", () => {
  map.flyTo({
    center: [2.35, 48.86],
    zoom: 12,
    speed: 0.8,
    curve: 1.5,
    easing: t => t
  });
});

document.getElementById("resetAll").addEventListener("click", () => {
  // ✅ 1. 重置所有展览点 status 为 "other"
  const resetFeatures = exhibitionData.features.map(f => {
    const clone = JSON.parse(JSON.stringify(f));
    clone.properties.status = "other";
    return clone;
  });

  exhibitionData = {
    ...exhibitionData,
    features: resetFeatures
  };

  map.getSource("exhibitions").setData(exhibitionData);

  // ✅ 隐藏呼吸图层
  map.setLayoutProperty("exhibition-today-pulse", "visibility", "none");
  map.setLayoutProperty("exhibition-upcoming-pulse", "visibility", "none");

  // ✅ 2. 清除日历中的高亮
  const tds = document.querySelectorAll("#calendar-table td");
  tds.forEach(td => td.classList.remove("today", "upcoming"));

  updateCalendar();

  // ✅ 3. 清除右侧小球容器中的所有球体
  const toRemove = engine.world.bodies.filter(b => b.customData);
  toRemove.forEach(b => {
    World.remove(engine.world, b);
    map.setFeatureState({
      source: "museums",
      id: b.customData.mapboxId
    }, { added: false });
    selectedMuseums.delete(b.customData.mapboxId);
  });

  // ✅ 4. 移除地图 popup
  document.querySelectorAll(".mapboxgl-popup").forEach(p => p.remove());

  console.log("🧼 All states reset.");
});