mapboxgl.accessToken = 'pk.eyJ1IjoibGljaGFyZCIsImEiOiJjbTg4Y2h1Z2wwcXA2MmlzYnN6Y3MxbDB4In0.4Zl2BKk9jfaG9927_p-hkw';

const personImages = {
  "Albert Camus": "images/camus.png",
  "Charles Baudelaire": "images/baudelaire.png",
  "George Sand": "images/sand.png",
  "Guillaume Apollinaire": "images/apollinaire.png",
  "Honor de Balzac": "images/balzac.png",
  "Jean-Paul Sartre and Simone de Beauvoir": "images/sartre_beauvoir.png",
  "Marcel Proust": "images/proust.png",
  "Paul Verlaine and Arthur Rimbaud": "images/verlaine_rimbaud.png",
  "Victor Hugo": "images/hugo.png",
  "mile Zola": "images/zola.png"
};

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [2.3333, 48.853], // 巴黎中心
    zoom: 1.5,                 // 地球视角
    pitch: 0,
    bearing: 0
  });

  map.on('zoom', () => {
  const zoom = map.getZoom();
  const scale = Math.min(Math.max(zoom / 15, 0.3), 2);  // 缩放限制 [0.5x ~ 2x]
    
  if (window.scalableMarkers) {
    window.scalableMarkers.forEach(el => {
      const size = 40 * scale;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    });
  }
    if (window.scalableMarkers) {
      window.scalableMarkers.forEach(el => {
        if (zoom < 10.5) {
          el.style.display = 'none';
        } else {
          el.style.display = 'block';
        }
      });
    }
  });

  window.onload = () => {
  setTimeout(() => {
    const firstChapterId = Object.keys(chapters)[0];
    setActiveChapter(firstChapterId);
  }, 2000); // 延迟 2 秒后进入故事
};

  const chapters = {
  'gallimard-publishing': {
    center: [2.33030, 48.84930],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'saint-germain-des-prs': {
    center: [2.33300, 48.85430],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'thatre-de-lodon-1': {
    center: [2.33930, 48.85070],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-1': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-de-la-huchette': {
    center: [2.34630, 48.85260],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'baudelaires-house-rue-de-seine': {
    center: [2.32500, 48.85320],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'htel-pimodan': {
    center: [2.35820, 48.85210],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'sainte-anne-asylum': {
    center: [2.33680, 48.82820],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-2': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'le-flore-caf': {
    center: [2.33300, 48.85430],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'sands-house': {
    center: [2.33420, 48.88150],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'cafede-la-paix-1': {
    center: [2.33120, 48.87050],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'thatre-de-lodon-2': {
    center: [2.33930, 48.85070],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-3': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-de-rivoli': {
    center: [2.35220, 48.85660],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'cafede-flore-1': {
    center: [2.33300, 48.85430],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-saint-jacques': {
    center: [2.34600, 48.84670],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'louvre-museum': {
    center: [2.33760, 48.86060],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-4': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'montparnasse-cemetery': {
    center: [2.32530, 48.83830],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'maison-de-balzac-passy': {
    center: [2.27650, 48.85640],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-cassini': {
    center: [2.34000, 48.83860],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-visconti': {
    center: [2.33500, 48.85710],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'comdie-franaise': {
    center: [2.33840, 48.86040],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-5': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'pre-lachaise-cemetery': {
    center: [2.39330, 48.86140],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-de-tournon': {
    center: [2.33730, 48.85130],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'cafede-flore-2': {
    center: [2.33300, 48.85430],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'les-deux-magots': {
    center: [2.33330, 48.85390],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'sorbonne-university': {
    center: [2.34320, 48.84880],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-bonaparte': {
    center: [2.33420, 48.85560],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-6': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-de-seine': {
    center: [2.33570, 48.85530],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'thatre-de-lodon-3': {
    center: [2.33930, 48.85070],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'prousts-house-boulevard-haussmann': {
    center: [2.32160, 48.87530],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'ritz-paris': {
    center: [2.32800, 48.86860],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'cafede-la-paix-2': {
    center: [2.33120, 48.87050],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'jardin-du-luxembourg': {
    center: [2.33720, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-7': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'htel-des-trangers': {
    center: [2.34450, 48.85280],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'cafeprocope-1': {
    center: [2.33930, 48.85340],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-campagne-premire': {
    center: [2.33020, 48.83980],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'prison-de-mons': {
    center: [3.95330, 50.45150],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'cafede-la-nouvelle-athnes': {
    center: [2.33360, 48.88260],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-8': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'rue-des-martyrs': {
    center: [2.34250, 48.87900],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'montmartre-cemetery': {
    center: [2.32860, 48.88910],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'hugos-house-place-des-vosges': {
    center: [2.36520, 48.85550],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'notre-dame-cathedral': {
    center: [2.35080, 48.85290],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-9': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'avenue-victor-hugo': {
    center: [2.28760, 48.87200],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'cafeprocope-2': {
    center: [2.33930, 48.85340],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'zolas-house': {
    center: [2.31900, 48.88280],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'le-figaro': {
    center: [2.33230, 48.87260],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'panthon-10': {
    center: [2.34480, 48.84620],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'palais-de-justice': {
    center: [2.34690, 48.85550],
    zoom: 15,
    pitch: 30,
    bearing: 0
  },

  'cafede-flore-3': {
    center: [2.33300, 48.85430],
    zoom: 15,
    pitch: 30,
    bearing: 0
  }
  };

  let activeChapterName = null;
  const visitedPoints = [];
  const chapterPeople = {};
  const personColors = {
    "Albert Camus": "#e41a1c",
    "Charles Baudelaire": "#377eb8",
    "George Sand": "#4daf4a",
    "Guillaume Apollinaire": "#984ea3",
    "Honor de Balzac": "#ff7f00",
    "Jean-Paul Sartre and Simone de Beauvoir": "#a65628",
    "Marcel Proust": "#f781bf",
    "Paul Verlaine and Arthur Rimbaud": "#999999",
    "Victor Hugo": "#66c2a5",
    "mile Zola": "#8da0cb"
  };

// 提取章节中的人物信息
document.querySelectorAll('#features section').forEach(section => {
  const id = section.id;
  const h4 = section.querySelector('h4');
  if (h4) {
    chapterPeople[id] = h4.textContent.trim();
  }
});

function setActiveChapter(chapterName) {
  if (chapterName === activeChapterName) return;

  const options = chapters[chapterName];
  const coord = options.center;

  // 添加 marker
    const person = chapterPeople[chapterName] || "Unknown";
    const color = personColors[person] || "#cccccc";
    const imgUrl = personImages[person] || "images/default.png";

    const el = document.createElement('div');
    el.classList.add('custom-marker', 'scalable-marker');
    el.style.backgroundImage = `url(${imgUrl})`;
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundSize = 'cover';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 0 6px rgba(0,0,0,0.3)';

    new mapboxgl.Marker(el)
      .setLngLat(coord)
      .addTo(map);

    // 缓存 marker 元素用于缩放处理
    if (!window.scalableMarkers) window.scalableMarkers = [];
    window.scalableMarkers.push(el);

  // 若已有前一个点，绘制轨迹
if (visitedPoints.length > 0) {
  const prevCoord = visitedPoints[visitedPoints.length - 1];
  const lineId = `line-${visitedPoints.length}`;
  const person = chapterPeople[chapterName] || "Unknown";

  const startChapterId = activeChapterName;
  const startElem = document.getElementById(startChapterId);
  const endElem = document.getElementById(chapterName);
  const startLoc = startElem?.querySelector('h3')?.textContent || 'Unknown';
  const endLoc = endElem?.querySelector('h3')?.textContent || 'Unknown';
  const popupText = `<strong>${person}</strong><br>From <em>${startLoc}</em><br>To <em>${endLoc}</em>`;

  map.addSource(lineId, {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [prevCoord, coord]
      }
    }
  });

  map.addLayer({
    id: lineId,
    type: "line",
    source: lineId,
    paint: {
      "line-color": color,
      "line-width": 3,
      "line-opacity": 0.8
    }
  });

  // 添加鼠标交互与 popup
  let popup;
  map.on('mouseenter', lineId, () => {
    popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
      .setLngLat(coord)
      .setHTML(popupText)
      .addTo(map);

    map.setPaintProperty(lineId, 'line-width', 6);
    map.setPaintProperty(lineId, 'line-opacity', 1);
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', lineId, () => {
    if (popup) popup.remove();
    map.setPaintProperty(lineId, 'line-width', 3);
    map.setPaintProperty(lineId, 'line-opacity', 0.8);
    map.getCanvas().style.cursor = '';
  });
}

  visitedPoints.push(coord);

  // 飞行地图
  map.flyTo({
    center: coord,
    zoom: options.zoom,
    pitch: options.pitch,
    bearing: options.bearing,
    speed: 0.8,
    curve: 1,
    easing: t => t
  });

  const chapterIds = Object.keys(chapters);
  if (chapterName === chapterIds[chapterIds.length - 1]) {
    setTimeout(() => {
      map.flyTo({
        center: [2.3333, 48.853],  // 巴黎中心
        zoom: 10.3,                  // 拉远
        pitch: 0,
        bearing: 0,
        speed: 0.5
      });
    }, 1500); // 等地图飞完当前章节后再拉远
  }

  // 高亮章节
  document.getElementById(chapterName).classList.add('active');
  if (activeChapterName) {
    document.getElementById(activeChapterName).classList.remove('active');
  }
  activeChapterName = chapterName;
}

// 滚动触发
const featuresContainer = document.getElementById('features');

featuresContainer.addEventListener('scroll', () => {
  const chapterIds = Object.keys(chapters);

  for (let i = 0; i < chapterIds.length; i++) {
    const chapterId = chapterIds[i];
    const element = document.getElementById(chapterId);
    if (!element) continue;

    const bounds = element.getBoundingClientRect();
    const containerBounds = featuresContainer.getBoundingClientRect();
    const visibleTop = bounds.top - containerBounds.top;
    const visibleBottom = bounds.bottom - containerBounds.top;

    if (
      visibleTop < containerBounds.height * 0.6 &&
      visibleBottom > containerBounds.height * 0.4
    ) {
      setActiveChapter(chapterId);

      // 自动播放最后三章
      if (!autoPlayedEnding && i === chapterIds.length - 3) {
        autoPlayEndingChapters(i);
      }
      break;
    }
  }
});

// 也保留点击功能（可选）
Object.keys(chapters).forEach(chapterId => {
  const element = document.getElementById(chapterId);
  if (element) {
    element.addEventListener('click', () => setActiveChapter(chapterId));
  }
});

let autoPlayedEnding = false;

function autoPlayEndingChapters(startIndex) {
  const chapterIds = Object.keys(chapters);
  const endingChapters = chapterIds.slice(startIndex, startIndex + 3); // N-2, N-1, N

  endingChapters.forEach((chapterId, i) => {
    setTimeout(() => {
      setActiveChapter(chapterId);

      // 如果是最后一个章节，则延迟收尾
      if (i === endingChapters.length - 1) {
        setTimeout(() => {
          map.flyTo({
            center: [2.3333, 48.853],
            zoom: 10.3,
            pitch: 0,
            bearing: 0,
            speed: 0.5
          });
        }, 2500);
      }
    }, i * 2500); // 每章间隔 2.5 秒播放
  });

  autoPlayedEnding = true;
}