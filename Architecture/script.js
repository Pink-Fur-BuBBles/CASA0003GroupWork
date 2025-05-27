mapboxgl.accessToken = 'pk.eyJ1IjoibGljaGFyZCIsImEiOiJjbTg4Y2h1Z2wwcXA2MmlzYnN6Y3MxbDB4In0.4Zl2BKk9jfaG9927_p-hkw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/lichard/cmaz1n2jb00ak01r25551319v',
  center: [2.3499, 48.852968], // 巴黎圣母院
  zoom: 17,
  pitch: 60,
  bearing: -20,
  antialias: true
});

// 建筑风格 icon 名称映射
const iconList = [
  "Gothic", "Renaissance", "Baroque",
  "Art_Nouveau", "Haussmannian", "Modernist",
  "Contemporary", "Neoclassical", "Postmodernist"
];

map.on('load', () => {

  let hasAnimatedZoom = false;
  let initialZoom = 17;
  let targetZoom = 12;
  let zoomRange = initialZoom - targetZoom;
  let pitchStart = 60;
  let pitchEnd = 30;

  // 加载所有图标
  iconList.forEach(style => {
    map.loadImage(`icons/icon_${style}.png`, (error, image) => {
      if (error) throw error;
      if (!map.hasImage(style)) {
        map.addImage(style, image);
      }
    });
  });

  // 加载数据源
  map.addSource('architecture', {
    type: 'geojson',
    data: 'Data/architecture_cleaned.geojson'
  });

  // 使用 symbol 图层 + icon-image
  map.addLayer({
    id: 'architecture-symbols',
    type: 'symbol',
    source: 'architecture',
    layout: {
      'icon-image': ['get', 'style'],
      'icon-size': 0.08,
      'icon-allow-overlap': true
    }
  });

  // 弹出详细信息
  map.on('click', 'architecture-symbols', (e) => {
    const props = e.features[0].properties;
    const content = `
      <strong>${props.name}</strong><br/>
      <em>Style:</em> ${props.style}<br/>
      <em>Building Year:</em> ${props.year_built}<br/>
    `;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(content)
      .addTo(map);
  });

    document.getElementById('toggle-info').addEventListener('click', () => {
    const panel = document.getElementById('info-panel');
    panel.classList.toggle('hidden');
  });

  map.on('mouseenter', 'architecture-symbols', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'architecture-symbols', () => {
    map.getCanvas().style.cursor = '';
  });

  // 控件与播放控制
  const checkboxes = document.querySelectorAll('#filter-panel input[type=checkbox]');
  const yearSlider = document.getElementById('year-slider');
  const yearValue = document.getElementById('year-value');
  const playToggleButton = document.getElementById('play-toggle-button');
  const resetButton = document.getElementById('reset-button');

  let isPlaying = false;
  let playTimer = null;

  function startAutoPlay() {
    clearInterval(playTimer); // 避免重复定时器
    playTimer = setInterval(() => {
      let current = parseInt(yearSlider.value, 10);

      if (current < 2020) {
        current += 10;
        yearSlider.value = current;
        yearValue.textContent = current;
        updateFilter();
      } else {
        clearInterval(playTimer);
        isPlaying = false;
        playToggleButton.textContent = '▶ Play';

        // ⏳ 3 秒后重启（如果用户没有手动暂停）
        setTimeout(() => {
          if (!isPlaying) {  // 保证用户没点暂停
            yearSlider.value = 1100;
            yearValue.textContent = 1100;
            updateFilter();

            isPlaying = true;
            playToggleButton.textContent = '⏸ Pause';
            startAutoPlay();
          }
        }, 6000);
      }
    }, 100);
  }

  function stopAutoPlay() {
    clearInterval(playTimer);
    isPlaying = false;
    playToggleButton.textContent = '▶ Play';
  }

  playToggleButton.addEventListener('click', () => {
    if (isPlaying) {
      stopAutoPlay();  // 正常暂停
    } else {
      // 如果已经在2000，重置再开始
      if (parseInt(yearSlider.value, 10) >= 2000) {
        yearSlider.value = 1400;
        yearValue.textContent = 1400;
        updateFilter();
      }

      isPlaying = true;
      playToggleButton.textContent = '⏸ Pause';
      startAutoPlay();
    }
  });

  function animateInitialZoom() {
    let steps = 60;
    let currentStep = 0;
    const zoomStart = 17;
    const zoomEnd = 12;
    const pitchStart = 60;
    const pitchEnd = 30;

    const interval = setInterval(() => {
      const t = currentStep / steps;
      const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const zoomNow = zoomStart - (zoomStart - zoomEnd) * easedT;
      const pitchNow = pitchStart - (pitchStart - pitchEnd) * easedT;

      map.easeTo({
        center: [2.3499, 48.852968],
        zoom: zoomNow,
        pitch: pitchNow,
        bearing: -20,
        duration: 100,
        essential: true
      });

      currentStep++;
      if (currentStep > steps) clearInterval(interval);
    }, 100); // ⏱ 每步 100ms，总共 6s
  }

  resetButton.addEventListener('click', () => {
    yearSlider.value = 1400;
    yearValue.textContent = 1400;
    checkboxes.forEach(cb => cb.checked = true);
    updateFilter();

    map.jumpTo({
      center: [2.3499, 48.852968],
      zoom: 17,
      pitch: 60,
      bearing: -20
    });
    hasAnimatedZoom = false;
    
    if (!isPlaying) {
      isPlaying = true;
      playToggleButton.textContent = '⏸ Pause';
      startAutoPlay();
    }
    animateInitialZoom();
  });

  yearSlider.addEventListener('input', () => {
    yearValue.textContent = yearSlider.value;
    updateFilter();
  });

  checkboxes.forEach(cb => cb.addEventListener('change', updateFilter));

  function updateFilter() {
    const selectedStyles = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const currentYear = parseInt(yearSlider.value, 10);

    const styleFilter = selectedStyles.length > 0
      ? ['in', ['get', 'style'], ['literal', selectedStyles]]
      : ['in', ['get', 'style'], ['literal', ['___NO_STYLE___']]];

    const timeFilter = ['<=', ['get', 'year_start'], currentYear];

    const combinedFilter = ['all', styleFilter, timeFilter];
    map.setFilter('architecture-symbols', combinedFilter);
  }

  updateFilter();
  startAutoPlay();

    map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 15,
    paint: {
      'fill-extrusion-color': 'rgb(123, 123, 123)',
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.7
    }
  }, 'architecture-symbols');

  animateInitialZoom();
});

const mapbox = document.getElementById('map');
const ods = document.getElementById('ods-container');
const chartPanel = document.getElementById('ods-chart-panel');
const toggleBtn = document.getElementById('ods-toggle-button');
const mapSwitcher = document.getElementById('mapModeSwitch');

mapSwitcher.addEventListener('change', () => {
  const isTraffic = mapSwitcher.checked;

  if (isTraffic) {
    // ✅ 进入实时交通模式
    mapbox.style.display = 'none';
    ods.style.display = 'block';
    chartPanel.style.display = 'block';
    toggleBtn.style.display = 'block'; // ✅ 显示按钮

    document.querySelectorAll('.map-ui').forEach(el => {
      el.style.display = 'none';
    });

  } else {
    // ✅ 返回建筑历史模式
    mapbox.style.display = 'block';
    ods.style.display = 'none';
    chartPanel.style.display = 'none';
    toggleBtn.style.display = 'none'; // ❌ 隐藏按钮

    document.querySelectorAll('.map-ui').forEach(el => {
      el.style.display = 'block';
    });

    map.resize();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const chartPanel = document.getElementById("ods-chart-panel");
  const toggleBtn = document.getElementById("ods-toggle-button");

  toggleBtn.style.right = chartPanel.classList.contains("collapsed") ? "5px" : "420px";

  toggleBtn.addEventListener("click", () => {
    const isCollapsed = chartPanel.classList.toggle("collapsed");

    // 切换按钮内容
    toggleBtn.innerHTML = isCollapsed ? "&lt;" : "&gt;";

    // 按钮位置联动
    toggleBtn.style.right = isCollapsed ? "0" : "420px";
  });
});



const checkboxes = document.querySelectorAll('#filter-panel input[type=checkbox]');

checkboxes.forEach(cb => {
  cb.addEventListener('click', () => {
    const style = cb.value;
    const target = document.getElementById(`style-${style}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // 可选：滚动后高亮
      target.classList.add('highlight');
      setTimeout(() => target.classList.remove('highlight'), 1000);
    }
  });
});
