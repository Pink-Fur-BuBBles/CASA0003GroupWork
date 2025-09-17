// ------------------------------
// Mapbox & 初始视角
// ------------------------------
mapboxgl.accessToken = 'pk.eyJ1IjoicmljaGFyZC1jb25zdGFudGluZSIsImEiOiJjbWZtamJqeWswMmk1MmpvbnQzMmRjMHA0In0.fPxg8O3dFJ0VFutZudtWRQ';

const initialView = {
  center: [2.333, 48.8566],
  zoom: 12,
  pitch: 45,
  bearing: 0
};

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/richard-constantine/cmfo8fgf300b701rg6b67gtf7',
  ...initialView
});

// ------------------------------
// 全局状态与DOM引用
// ------------------------------
const geoUrl      = 'Data/authors_story_points.geojson';
const authorList  = document.getElementById('author-list');
const resetBtn    = document.getElementById('reset-button');
const showAllBtn  = document.getElementById('show-all-button');

let activePopups      = [];
let activeAuthors     = new Set();
let authorLayers      = {};
let activeFlyingAuthor= null;
let flySessionId      = 0;
let authorFlyingMap   = {};
let authorsGlobal     = {};
let authorData        = {};
const personColors    = {};
const personImages    = {};
const scalableMarkers = [];

const authorInfo = {
  "Victor Hugo": {
    background: "Victor-Marie Hugo (26 February 1802 – 22 May 1885) was a French Romantic writer and politician. He is considered one of the greatest and best-known French writers. Outside France, his most famous works are the novels Les Misérables (1862) and The Hunchback of Notre-Dame (1831). In France, Hugo is known primarily for his poetry collections, such as Les Contemplations and La Légende des siècles. Hugo was also a visual artist, and during his exile produced more than 4,000 drawings. He was a peer of France, a senator under the Third Republic, and a political thinker who advocated for the abolition of the death penalty, social justice, freedom of the press, and European unification. His funeral was a national event, and he is buried in the Panthéon in Paris.",
    works: ["Les Misérables", "The Hunchback of Notre-Dame", "La Légende des siècles"],
    wiki: "https://en.wikipedia.org/wiki/Victor_Hugo"
  },
  "Marcel Proust": {
    background: "Marcel Proust (10 July 1871 – 18 November 1922) was a French novelist, literary critic, and essayist, best known for his monumental work À la recherche du temps perdu (In Search of Lost Time). Published in seven volumes between 1913 and 1927, this novel is renowned for its deep exploration of memory, time, and consciousness. Proust’s writing style is characterized by long, intricate sentences and a profound introspection that delves into the complexities of human experience. Born in Auteuil, Paris, Proust was raised in a wealthy family, which allowed him to immerse himself in the literary and artistic circles of his time. Despite suffering from chronic health issues, particularly asthma, he maintained an active social life in his early years. However, as he aged, he became increasingly reclusive, dedicating himself to his writing. His experiences in Parisian salons and his observations of French society deeply influenced his literary work.",
    works: ["	In Search of Lost Time (À la recherche du temps perdu) – 1913–1927"],
    wiki: "https://en.wikipedia.org/wiki/Marcel_Proust"
  },
  "Jean-Paul Sartre and Simone de Beauvoir": {
    background: "Jean-Paul Sartre (21 June 1905 – 15 April 1980) was a French philosopher, playwright, novelist, screenwriter, political activist, biographer, and literary critic. He is considered a leading figure in 20th-century French philosophy and Marxism. Sartre was one of the key figures in the philosophy of existentialism and phenomenology. Sartre’s work has influenced sociology, critical theory, post-colonial theory, and literary studies. He was awarded the 1964 Nobel Prize in Literature but declined it, stating that he always refused official honors and that “a writer should not allow himself to be turned into an institution.” He maintained an open relationship with fellow existentialist philosopher Simone de Beauvoir. Together, they challenged cultural and social norms, advocating for personal freedom and responsibility. Sartre’s principal philosophical work, Being and Nothingness (1943), explores the concept of “bad faith” and the tension between oppressive conformity and authentic existence. Simone de Beauvoir (1908–1986) was a French existentialist philosopher, writer, and feminist activist. Born in Paris, she became a prominent intellectual figure in the 20th century, known for her profound contributions to philosophy, literature, and feminist theory. Her seminal work, The Second Sex (1949), is considered a foundational text in feminist philosophy, analyzing women’s oppression and the construction of gender. De Beauvoir also wrote novels, essays, and memoirs, and was a lifelong partner of fellow philosopher Jean-Paul Sartre.",
    background_1: "Simone de Beauvoir (1908–1986) was a French existentialist philosopher, writer, and feminist activist. Born in Paris, she became a prominent intellectual figure in the 20th century, known for her profound contributions to philosophy, literature, and feminist theory. Her seminal work, The Second Sex (1949), is considered a foundational text in feminist philosophy, analyzing women’s oppression and the construction of gender. De Beauvoir also wrote novels, essays, and memoirs, and was a lifelong partner of fellow philosopher Jean-Paul Sartre.",
    works: ["Being and Nothingness (L’Être et le Néant, 1943)", "Existentialism Is a Humanism (L’existentialisme est un humanisme, 1946)", "She Came to Stay (L’Invitée, 1943): A novel exploring existential themes and the complexities of human relationships.", "She Came to Stay (L’Invitée, 1943): A novel exploring existential themes and the complexities of human relationships."],
    wiki: "https://en.wikipedia.org/wiki/Jean-Paul_Sartre",
    wiki_1: "https://en.wikipedia.org/wiki/Simone_de_Beauvoir"
  },
  "émile Zola": {
    background: "Émile Zola (2 April 1840 – 29 September 1902) was a French novelist, playwright, journalist, and the most prominent proponent of the literary school of naturalism. Born in Paris, he spent much of his early life in Aix-en-Provence. Zola’s father died when he was young, leaving the family in financial hardship. He began his career writing literary and art reviews, and his early novels gained him notoriety for their unflinching portrayal of human behavior and social conditions. Zola is best known for his monumental 20-novel series Les Rougon-Macquart, which examines the influence of heredity and environment on a family during the Second French Empire. His works often addressed social issues such as poverty, industrialization, and class struggle. Beyond literature, Zola played a significant role in the political liberalization of France, most notably through his involvement in the Dreyfus Affair. His open letter “J’Accuse…!” accused the French government of anti-Semitism and wrongful imprisonment of Alfred Dreyfus, leading to a retrial and eventual exoneration of Dreyfus. Zola died in 1902 from carbon monoxide poisoning caused by a blocked chimney. While officially deemed accidental, some have speculated foul play due to his political activism. In 1908, his remains were transferred to the Panthéon in Paris, where he rests alongside Victor Hugo and Alexandre Dumas. ￼",
    works: ["Les Rougon-Macquart (1871–1893)", "Thérèse Raquin (1867)"],
    wiki: "https://en.wikipedia.org/wiki/Émile_Zola"
  },
  "George Sand": {
    background: "George Sand was the pen name of Amantine Lucile Aurore Dupin de Francueil (1 July 1804 – 8 June 1876), a prominent French novelist, memoirist, and journalist. She was one of the most notable writers of the European Romantic era, recognized for her extensive literary contributions and her advocacy for women’s rights. Born in Paris, she spent much of her childhood at her grandmother’s estate in Nohant, in the Berry region of France. After a brief marriage to Casimir Dudevant, she separated from him and moved to Paris, where she began her literary career. Sand was known for her unconventional lifestyle, including dressing in male attire (for which she obtained a permit in 1831), which allowed her greater freedom in Parisian society. She also had several notable romantic relationships, including with the composer Frédéric Chopin.  ",
    works: ["Indiana (1832)", "Lélia"],
    wiki: "https://en.wikipedia.org/wiki/George_Sand"
  },
  "Honoré de Balzac": {
    background: "Honoré de Balzac (20 May 1799 – 18 August 1850) was a French novelist and playwright renowned for his profound influence on the realist movement in European literature. Born in Tours, France, Balzac embarked on a literary career after unsuccessful ventures in law and business, which left him with substantial debts. These financial struggles fueled his prolific writing, resulting in a vast body of work that meticulously depicted the complexities of French society in the post-Napoleonic era. Balzac’s magnum opus, La Comédie humaine (“The Human Comedy”), is a monumental collection of interlinked novels and stories that portray a panoramic view of French life across various social strata. His keen observation and unfiltered representation of society earned him recognition as one of the founders of realism in literature. Balzac’s characters are notable for their depth and moral ambiguity, and his detailed descriptions of settings and objects contribute to the vivid realism of his narratives.  ",
    works: ["La Comédie humaine (1829–1848)", "Le Père Goriot (1835)"],
    wiki: "https://en.wikipedia.org/wiki/Honor%C3%A9_de_Balzac"
  },
  "Charles Baudelaire": {
    background: "Charles Baudelaire (1821–1867) was a French poet, essayist, and art critic, renowned for his profound influence on modern literature. Born in Paris, he is best known for his seminal work Les Fleurs du mal (The Flowers of Evil), which challenged the conventions of poetry in the 19th century. Baudelaire’s writings delve into themes of beauty, decadence, and the complexities of urban life, marking him as a pivotal figure in the Symbolist and Modernist movements. His exploration of the human psyche and the darker aspects of society set a precedent for future literary works. Baudelaire’s innovative use of language and imagery has left an indelible mark on poetry, influencing generations of writers and artists.",
    works: ["Les Fleurs du mal (The Flowers of Evil, 1857)", "Le Spleen de Paris (Paris Spleen, 1869)"],
    wiki: "https://en.wikipedia.org/wiki/Charles_Baudelaire"
  },
  "Guillaume Apollinaire": {
    background: "Guillaume Apollinaire (born Wilhelm Albert Włodzimierz Apolinary Kostrowicki; August 26, 1880 – November 9, 1918) was a French poet, playwright, short story writer, novelist, and art critic of Polish descent. Born in Rome to a Polish mother and an Italian father, he moved to Paris in his early twenties, where he became a central figure in the avant-garde literary and artistic movements of the early 20th century. Apollinaire is credited with coining the terms “Cubism” in 1911 and “Surrealism” in 1917, playing a pivotal role in defining and promoting these movements.  His innovative approach to poetry, including the use of calligrams—poems in which the text forms a visual image—pushed the boundaries of traditional poetic forms. During World War I, Apollinaire served in the French army and sustained a head injury in 1916. He continued to write during his recovery but succumbed to the Spanish flu pandemic in 1918.  ",
    works: ["Alcools (1913)", "Calligrammes (1918)"],
    wiki: "https://en.wikipedia.org/wiki/Guillaume_Apollinaire"
  },
  "Albert Camus": {
    background: "Albert Camus (7 November 1913 – 4 January 1960) was a French-Algerian philosopher, author, and journalist, renowned for his contributions to the philosophy of the absurd and his profound impact on 20th-century literature. Born in Mondovi, French Algeria, Camus lost his father in World War I and was raised in poverty by his mother in Algiers. Despite these hardships, he excelled academically, studying philosophy at the University of Algiers. Camus’s experiences in Algeria deeply influenced his worldview and writings. He became associated with the French Resistance during World War II, serving as editor-in-chief of the underground newspaper Combat. His literary works often explore themes of existentialism, absurdity, and the human condition. In 1957, at the age of 44, he was awarded the Nobel Prize in Literature for illuminating “the problems of the human conscience in our time” . Tragically, Camus died in a car accident in 1960 near Sens, France, at the age of 46. His unfinished autobiographical novel, The First Man, was discovered among the wreckage and published posthumously. ",
    works: ["The Stranger (L’Étranger, 1942)", "The Myth of Sisyphus (Le Mythe de Sisyphe, 1942)"],
    wiki: "https://en.wikipedia.org/wiki/Albert_Camus"
  },
  "Paul Verlaine and Arthur Rimbaud": {
    background: "Paul Verlaine (30 March 1844 – 8 January 1896) was a French poet associated with the Symbolist and Decadent movements. Born in Metz, France, he moved to Paris in 1851, where he pursued literary studies and began his poetic career. Verlaine’s work is renowned for its musicality, subtlety, and exploration of complex emotions. His personal life was marked by tumultuous relationships, notably with fellow poet Arthur Rimbaud, and struggles with addiction. Despite these challenges, Verlaine’s contributions to poetry have had a lasting impact on French literature. Arthur Rimbaud (20 October 1854 – 10 November 1891) was a French poet renowned for his profound influence on modern literature and the arts, prefiguring surrealism. Born in Charleville, France, he was a prodigious talent who began writing at a young age and produced his most significant works during his teenage years. Rimbaud’s poetry is characterized by its vivid imagery, innovative use of language, and exploration of the human psyche. In 1871, Rimbaud initiated a tumultuous relationship with fellow poet Paul Verlaine, which significantly impacted his life and work. Their partnership was marked by passionate collaboration and personal turmoil, culminating in a violent incident in 1873 when Verlaine shot and wounded Rimbaud. Following this event, Rimbaud’s interest in literature waned, and he ceased writing altogether by the age of 20. After abandoning his literary pursuits, Rimbaud led a peripatetic life, traveling extensively across Europe, the Middle East, and Africa. He engaged in various occupations, including working as a merchant and explorer. Rimbaud’s later years were spent in relative obscurity until his death from cancer at the age of 37.",
    background_1: "Arthur Rimbaud (20 October 1854 – 10 November 1891) was a French poet renowned for his profound influence on modern literature and the arts, prefiguring surrealism. Born in Charleville, France, he was a prodigious talent who began writing at a young age and produced his most significant works during his teenage years. Rimbaud’s poetry is characterized by its vivid imagery, innovative use of language, and exploration of the human psyche. In 1871, Rimbaud initiated a tumultuous relationship with fellow poet Paul Verlaine, which significantly impacted his life and work. Their partnership was marked by passionate collaboration and personal turmoil, culminating in a violent incident in 1873 when Verlaine shot and wounded Rimbaud. Following this event, Rimbaud’s interest in literature waned, and he ceased writing altogether by the age of 20. After abandoning his literary pursuits, Rimbaud led a peripatetic life, traveling extensively across Europe, the Middle East, and Africa. He engaged in various occupations, including working as a merchant and explorer. Rimbaud’s later years were spent in relative obscurity until his death from cancer at the age of 37.",
    works: ["Poèmes saturniens (1866)", "Fêtes galantes (1869)","A Season in Hell (Une Saison en Enfer, 1873)","Illuminations (1872–1875)"],
    wiki: "https://en.wikipedia.org/wiki/Paul_Verlaine",
    wiki_1: "https://en.wikipedia.org/wiki/Arthur_Rimbaud"
  }
};

// ------------------------------
// 工具函数
// ------------------------------
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
function getColor(i) {
  const palette = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#a65628','#f781bf','#999999','#66c2a5','#8da0cb'];
  return palette[i % palette.length];
}

// ------------------------------
// 创建带 Click & Hover 弹窗的 Marker 元素
// ------------------------------
function createMarkerElement(imageUrl, coord, popupHTML, layer) {
  const container = document.createElement('div');
  const innerEl   = document.createElement('div');
  innerEl.className = 'custom-marker';
  Object.assign(innerEl.style, {
    backgroundImage: `url(${imageUrl})`,
    width: '40px', height: '40px', backgroundSize: 'cover',
    borderRadius: '50%', border: '2px solid white',
    boxShadow: '0 0 6px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s ease'
  });

  // Hover 放大
  innerEl.addEventListener('mouseenter', () => innerEl.style.transform = 'scale(1.5)');
  innerEl.addEventListener('mouseleave', () => innerEl.style.transform = '');

  // Click 弹窗
  innerEl.addEventListener('click', (e) => {
    e.stopPropagation();
    activePopups.forEach(p => p.remove());
    activePopups = [];
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setLngLat(coord)
      .setHTML(popupHTML)
      .addTo(map);
    activePopups.push(popup);
    if (layer) layer.popups.push(popup);
  });

  container.appendChild(innerEl);
  scalableMarkers.push(innerEl);
  return container;
}

// ------------------------------
// 渲染左侧作者列表
// ------------------------------
function buildAuthorList() {
  authorList.innerHTML = '';
  Object.keys(authorsGlobal).forEach((author, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'author-wrapper';
    wrap.style.animationDelay = `${i * 0.2}s`;

    const av = document.createElement('div');
    av.className = 'author-item';
    av.dataset.author = author;  // ← 确保加上 data-author 属性
    av.style.backgroundImage = `url(${personImages[author]})`;
    av.addEventListener('click', () => {
      av.classList.toggle('active');
      toggleAuthor(author, authorsGlobal[author]);
    });

    const lbl = document.createElement('div');
    lbl.className = 'author-label';
    const mov = authorsGlobal[author][0].properties.movement || '';
    lbl.innerHTML = `
      <div class="author-name">${author}</div>
      <div class="author-movement">${mov}</div>
    `;

    wrap.append(av, lbl);
    authorList.appendChild(wrap);
  });
}

// ------------------------------
// 点击地图空白处清除弹窗
// ------------------------------
map.on('click', () => {
  activePopups.forEach(p => p.remove());
  activePopups = [];
});

// ------------------------------
// 拉取数据、初始化作者列表 & 绑定 Show All
// ------------------------------
fetch(geoUrl)
  .then(res => res.json())
  .then(data => {
    // 分组保存
    data.features.forEach(f => {
      const a = f.properties.author;
      (authorsGlobal[a] = authorsGlobal[a] || []).push(f);
      (authorData[a]    = authorData[a]    || []).push(f);
    });
    // 生成配色与头像路径
    Object.keys(authorsGlobal).forEach((author, i) => {
      personColors[author] = getColor(i);
      personImages[author] = `images/${slugify(author)}.png`;
    });
    // 首次渲染
    buildAuthorList();

    // 绑定 Show All 功能
    showAllBtn.addEventListener('click', () => {
      // 1. 清理地图 & 弹窗 & 选中状态
      activeAuthors.forEach(a => removeAuthorVisuals(a));
      activeAuthors.clear();
      activePopups.forEach(p => p.remove());
      activePopups = [];
      document.getElementById('right-panel').style.display = 'none';
      document.querySelectorAll('.author-item.active')
        .forEach(el => el.classList.remove('active'));

      // 2. 重置视角
      map.flyTo({ ...initialView, essential: true });

      // 3. 绘制所有静态路径
      Object.keys(authorsGlobal).forEach(author => {
        drawAuthorStatic(author, authorsGlobal[author]);
        activeAuthors.add(author);
      });

      // 4. 保证所有头像都被选中
      document.querySelectorAll('.author-item')
        .forEach(item => item.classList.add('active'));
    });
  })
  .catch(console.error);

// ------------------------------
// 移除作者所有可视化
// ------------------------------
function removeAuthorVisuals(author) {
  // 中断动画
  if (authorFlyingMap[author] === flySessionId) {
    flySessionId++;
    activeFlyingAuthor = null;
  }
  delete authorFlyingMap[author];

  const layer = authorLayers[author];
  if (!layer) return;

  layer.lines.forEach(id => {
    if (map.getLayer(id))  map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
  layer.markers.forEach(m => m.remove());
  layer.popups.forEach(p => p.remove());

  delete authorLayers[author];
}

// ------------------------------
// 仅移除动态（动画）可视化
// ------------------------------
function removeAuthorDynamicVisuals(author) {
  const layer = authorLayers[author];
  if (!layer) return;
  layer.lines.forEach(id => {
    if (map.getLayer(id))  map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
  layer.markers.forEach(m => m.remove());
  layer.popups.forEach(p => p.remove());
  layer.lines = [];
  layer.markers = [];
  layer.popups = [];
}

// ------------------------------
// 绘制静态路径 & Hover 弹窗
// ------------------------------
function drawAuthorStatic(author, pts) {
  if (authorLayers[author]?.isStatic) return;
  removeAuthorDynamicVisuals(author);

  const lines = [], markers = [], popups = [];
  pts.sort((a, b) => a.properties.sequence - b.properties.sequence);

  let last = null;
  pts.forEach((f, i) => {
    const c = f.geometry.coordinates;
    const html = `<strong>${f.properties.location || f.properties.placeName}</strong><br>${f.properties.description}`;

    // Marker + click 弹窗由 createMarkerElement 处理
    const mEl = createMarkerElement(personImages[author], c, html, { popups });
    mEl.addEventListener('click', e => e.stopPropagation());

    // 添加到地图
    const marker = new mapboxgl.Marker(mEl)
      .setLngLat(c)
      .addTo(map);
    markers.push(marker);

    // Hover 专用 popup
    mEl.addEventListener('mouseenter', () => {
      popups.forEach(p => p.remove());
      const hoverPopup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false
      })
        .setLngLat(c)
        .setHTML(html)
        .addTo(map);
      mEl.__hoverPopup = hoverPopup;
    });
    mEl.addEventListener('mouseleave', () => {
      if (mEl.__hoverPopup) {
        mEl.__hoverPopup.remove();
        mEl.__hoverPopup = null;
      }
    });

    // 连线
    if (i > 0) {
      const id = `line-${author}-static-${i}`;
      map.addSource(id, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [last, c] }
        }
      });
      map.addLayer({
        id,
        type: 'line',
        source: id,
        paint: {
          'line-color': personColors[author],
          'line-width': 3,
          'line-opacity': 0.8
        }
      });
      lines.push(id);
    }
    last = c;
  });

  authorLayers[author] = { lines, markers, popups, isStatic: true };
}

// ------------------------------
// 绘制动态飞行动画 & 自动弹窗
// ------------------------------
function drawAuthor(author, pts) {
  activePopups.forEach(p => p.remove());
  activePopups = [];

  const sess = ++flySessionId;
  authorFlyingMap[author] = sess;
  const prev = activeFlyingAuthor;
  activeFlyingAuthor = author;

  if (prev && prev !== author) {
    authorFlyingMap[prev] = null;
    removeAuthorDynamicVisuals(prev);
    drawAuthorStatic(prev, authorData[prev]);
  }

  const layer = { lines: [], markers: [], popups: [], isStatic: false };
  authorLayers[author] = layer;

  if (!pts.length) {
    layer.isStatic = true;
    return;
  }
  pts.sort((a, b) => a.properties.sequence - b.properties.sequence);

  let i = 0, last = null;
  function next() {
    if (authorFlyingMap[author] !== sess || i >= pts.length) {
      if (authorFlyingMap[author] !== sess) {
        activeAuthors.has(author)
          ? drawAuthorStatic(author, authorData[author])
          : removeAuthorVisuals(author);
      } else {
        layer.isStatic = true;
      }
      return;
    }

    const f = pts[i], c = f.geometry.coordinates;
    const html = `<strong>${f.properties.location || f.properties.placeName}</strong><br>${f.properties.description}`;

    map.flyTo({
      center: c,
      zoom: 14,
      speed: 0.6,
      curve: 1.4,
      pitch: 45,
      bearing: 0,
      essential: true
    });

    map.once('moveend', () => {
      if (authorFlyingMap[author] !== sess) return;

      const mEl = createMarkerElement(personImages[author], c, html, layer);
      const m = new mapboxgl.Marker(mEl).setLngLat(c).addTo(map);
      layer.markers.push(m);

      const pop = new mapboxgl.Popup({ offset: 25 })
        .setLngLat(c)
        .setHTML(html)
        .addTo(map);
      layer.popups.push(pop);
      activePopups.push(pop);

      if (last) {
        const id = `line-${author}-${i}`;
        map.addSource(id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [last, c] }
          }
        });
        map.addLayer({
          id,
          type: 'line',
          source: id,
          paint: {
            'line-color': personColors[author],
            'line-width': 3,
            'line-opacity': 0.8
          }
        });
        layer.lines.push(id);
      }

      last = c;
      i++;
      setTimeout(next, 1800);
    });
  }
  next();
}

// ------------------------------
// 切换作者：动态或静态 & 面板
// ------------------------------
function toggleAuthor(author, pts) {
  if (activeAuthors.has(author)) {
    removeAuthorVisuals(author);
    activeAuthors.delete(author);
  } else {
    activeAuthors.add(author);
    drawAuthor(author, pts);
    showAuthorPanel(author);
  }
}

function showAuthorPanel(author) {
  const p = document.getElementById('right-panel');
  p.style.display = 'block';

  const info = authorInfo[author];
  const bg = info?.background || 'No background info available.';
  const bg_1 = info?.background_1 || 'No background info available.';
  const works = info?.works?.length
    ? `<ul>` + info.works.map(w => `<li><em>${w}</em></li>`).join('') + `</ul>`
    : '<p><em>No notable works listed.</em></p>';
  const wiki = info?.wiki
    ? `<p><a href="${info.wiki}" target="_blank">Read more on Wikipedia ↗</a></p>`
    : '';
  const wiki_1 = info?.wiki_1
  ? `<p><a href="${info.wiki_1}" target="_blank">Read more on Wikipedia ↗</a></p>`
  : '';

  p.innerHTML = `
    <div id="author-details">
      <img src="${personImages[author]}" alt="${author}" />
      <h2>${author}</h2>
      <p><strong>Movement:</strong> ${authorsGlobal[author][0].properties.movement || '—'}</p>
      <p>${bg}</p>
      <p>${bg_1}</p>
      <h4>Notable Works:</h4>
      ${works}
      ${wiki}
      ${wiki_1}
    </div>
  `;
}

// ------------------------------
// Reset：重置所有 & 触发列表动画 & 视角
// ------------------------------
function clearAll() {
  activeAuthors.forEach(a => removeAuthorVisuals(a));
  activeAuthors.clear();

  activePopups.forEach(p => p.remove());
  activePopups = [];

  document.getElementById('right-panel').style.display = 'none';
  document.querySelectorAll('.author-item.active')
    .forEach(el => el.classList.remove('active'));

  buildAuthorList();

  map.flyTo({ ...initialView, essential: true });
}
resetBtn.addEventListener('click', clearAll);

// ------------------------------
// 缩放时动态调整 Marker 大小
// ------------------------------
map.on('zoom', () => {
  const z = map.getZoom();
  const s = Math.min(Math.max(z / 15, 0.3), 2);
  scalableMarkers.forEach(el => {
    el.style.width  = `${40 * s}px`;
    el.style.height = `${40 * s}px`;
  });
});