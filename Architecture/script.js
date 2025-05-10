mapboxgl.accessToken = 'pk.eyJ1IjoibGljaGFyZCIsImEiOiJjbTg4Y2h1Z2wwcXA2MmlzYnN6Y3MxbDB4In0.4Zl2BKk9jfaG9927_p-hkw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/lichard/cmahtppmg000y01s90h08bccj',
  center: [2.34, 48.86],
  zoom: 12
});

// 建筑风格 icon 名称映射
const iconList = [
  "Gothic", "Renaissance", "Baroque",
  "Art_Nouveau", "Haussmannian", "Modernist",
  "Contemporary", "Neoclassical", "Postmodernist"
];

map.on('load', () => {
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

  let isPlaying = true;
  let playTimer = null;

  function startAutoPlay() {
    playTimer = setInterval(() => {
      let current = parseInt(yearSlider.value, 10);
      if (current < 2000) {
        yearSlider.value = current + 10;
      } else {
        yearSlider.value = 1400; // 循环播放
      }
      yearValue.textContent = yearSlider.value;
      updateFilter();
    }, 100);
  }

  function stopAutoPlay() {
    clearInterval(playTimer);
    isPlaying = false;
    playToggleButton.textContent = '▶ Play';
  }

  playToggleButton.addEventListener('click', () => {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      isPlaying = true;
      playToggleButton.textContent = '⏸ Pause';
      startAutoPlay();
    }
  });

  resetButton.addEventListener('click', () => {
    yearSlider.value = 1400;
    yearValue.textContent = 1400;
    checkboxes.forEach(cb => cb.checked = true);
    updateFilter();
    if (!isPlaying) {
      isPlaying = true;
      playToggleButton.textContent = '⏸ Pause';
      startAutoPlay();
    }
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
});