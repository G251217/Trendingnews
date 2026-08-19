const list = document.querySelector('#news-list');
const status = document.querySelector('#status');
const date = document.querySelector('#date');
const dialog = document.querySelector('#detail');
let feed = { items: [] };
let topic = '全部';

function badge(tag) { return `<span class="topic topic-${tag}">${tag}</span>`; }
function showDetail(item) {
  document.querySelector('#detail-meta').textContent = `${item.source} · ${item.publishedAt}`;
  document.querySelector('#detail-title').textContent = item.title;
  document.querySelector('#detail-tags').innerHTML = item.tags.map(badge).join('');
  document.querySelector('#detail-summary').textContent = item.summary;
  document.querySelector('#detail-link').href = item.url;
  dialog.showModal();
}
function render() {
  const items = topic === '全部' ? feed.items : feed.items.filter((item) => item.tags.includes(topic));
  list.innerHTML = items.length ? items.map((item) => `<article class="news-card"><button class="card" data-id="${item.id}"><span class="rank">${String(item.rank).padStart(2, '0')}</span><span><small>${item.source} · ${item.publishedAt}</small><strong>${item.title}</strong><span class="summary">${item.summary}</span><span class="topics">${item.tags.map(badge).join('')}</span></span><span class="arrow">↗</span></button></article>`).join('') : '<p class="empty">这个标签下昨天没有入选内容。</p>';
  list.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => showDetail(feed.items.find((item) => item.id === button.dataset.id))));
}
document.querySelectorAll('[data-topic]').forEach((button) => button.addEventListener('click', () => { topic = button.dataset.topic; document.querySelectorAll('[data-topic]').forEach((node) => node.classList.toggle('active', node === button)); render(); }));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
fetch('data/daily-news.json').then((response) => response.json()).then((data) => { feed = data; date.textContent = `北京 · ${data.targetDate}`; status.textContent = data.status; render(); }).catch(() => { status.textContent = '榜单暂时不可用，请稍后刷新。'; list.innerHTML = '<p class="empty">暂时无法读取榜单。</p>'; });
