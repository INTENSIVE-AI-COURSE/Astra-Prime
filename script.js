// ...existing code...
let alljobs = [];
let currentJobs = [];
let visibleJobs = 6;

var requestOptions = {
  method: 'GET',
  redirect: 'follow'
};

const BASE_URL = 'https://newsapi.org/v2/everything';

// small html escaper
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

fetch("https://www.arbeitnow.com/api/job-board-api", requestOptions)
  .then(response => response.json())
  .then(data => {
    console.log('arbeitnow response', data);

    const posted = JSON.parse(localStorage.getItem('postedJobs') || '[]');
    const remote = Array.isArray(data.data) ? data.data : [];
    alljobs = posted.concat(remote);

    alljobs = alljobs.map((j, i) => ({ ...j, __id: i }));

    currentJobs = alljobs.slice();
    localStorage.setItem('currentJobs', JSON.stringify(currentJobs));

    loadMore(currentJobs);
  })
  .catch(error => console.log('error', error));

function loadMore(jobsArray) {
  const container = document.getElementById('jobs-container');
  if (!container) return;

  // Clear
  container.innerHTML = "";

  // show up to visibleJobs count
  const jobsToShow = jobsArray.slice(0, visibleJobs);

  jobsToShow.forEach(singleJob => {
    // derive safe values
    const title = escapeHtml(singleJob.title || singleJob.position || singleJob.company_name || 'Job');
    const company = escapeHtml(singleJob.company_name || '');
    const location = escapeHtml(singleJob.location || '');
    const descFull = String(singleJob.description || '').replace(/\n+/g, ' ').replace(/<[^>]*>?/gm, '');
    const desc = escapeHtml(descFull.length > 150 ? descFull.slice(0, 150) + '…' : descFull);
    const jobUrl = singleJob.url || '#';

    // prefer available image fields; fallback to placeholder with company/title text
    const imageUrl = singleJob.company_logo || singleJob.image || singleJob.logo ||
      `https://via.placeholder.com/900x280.png?text=${encodeURIComponent(singleJob.company_name || singleJob.title || 'Job')}`;

    // build card element
    const jobWrapper = document.createElement('div');
    jobWrapper.className = 'job col-md-6 col-lg-4 mb-4';

    jobWrapper.innerHTML = `
      <div class="card h-100 job-card border-0 shadow-sm overflow-hidden">
        <div class="job-image-header" style="background-image: url('${imageUrl}'); height: 180px; background-size: cover; background-position: center; position: relative;">
          <div class="image-gradient-overlay" style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.45));"></div>
          <span class="badge-location" style="position:absolute;left:10px;bottom:10px;color:white;background:rgba(0,0,0,0.4);padding:6px 10px;border-radius:6px;font-size:13px;">
            ${location}
          </span>
        </div>

        <div class="card-body d-flex flex-column p-4">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="fw-bold text-dark mb-0">${title}</h5>
            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>New</small>
          </div>
          
          <p class="text-primary small mb-3 fw-bold">
            <i class="bi bi-building-fill me-1"></i>${company}
          </p>

          <div class="text-muted small mb-4 description-truncate">
            ${desc}
          </div>
          
          <div class="mt-auto" style="display:flex;gap:8px;">
            <a href="${jobUrl}" target="_blank" class="btn btn-primary w-50 py-2 fw-bold rounded-pill view-role" data-id="${singleJob.__id}">View Role</a>
            <a href="apply.html?id=${singleJob.__id}" class="btn btn-outline-primary w-50 py-2 fw-bold rounded-pill apply-role" data-id="${singleJob.__id}">Apply</a>
          </div>
        </div>
      </div>
    `;

    container.appendChild(jobWrapper);
  });

  // show/hide showMore button
  const button = document.getElementById('showMore');
  if (!button) return;
  if (visibleJobs >= jobsArray.length) {
    button.style.display = 'none';
  } else {
    button.style.display = 'block';
  }
}

// Show more handler
const showMoreBtn = document.getElementById('showMore');
if (showMoreBtn) {
  showMoreBtn.addEventListener('click', function () {
    visibleJobs += 6;
    loadMore(currentJobs);
  });
}

// wire up search and clear buttons
const searchBtn = document.getElementById('searchBtn');
if (searchBtn) searchBtn.addEventListener('click', searchJobs);
const clearBtn = document.getElementById('clearBtn');
if (clearBtn) clearBtn.addEventListener('click', function () {
  const si = document.getElementById('searchInput');
  if (si) si.value = '';
  currentJobs = alljobs.slice();
  visibleJobs = 6;
  loadMore(currentJobs);
});

// allow Enter key on search input
const searchInputEl = document.getElementById('searchInput');
if (searchInputEl) searchInputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); searchJobs(); } });

function searchJobs() {
  const query = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  if (!query) {
    currentJobs = alljobs.slice();
  } else {
    currentJobs = alljobs.filter(job => {
      const hay = ((job.title || '') + ' ' + (job.company_name || '') + ' ' + (Array.isArray(job.job_types) ? job.job_types.join(' ') : job.job_types || '') + ' ' + (job.description || '')).toLowerCase();
      return hay.indexOf(query) !== -1;
    });
  }
  visibleJobs = 6;
  loadMore(currentJobs);
}

// delegate to persist currentJobs when user clicks view/apply links
document.getElementById('jobs-container')?.addEventListener('click', (e) => {
  const a = e.target.closest('a.view-role, a.apply-role');
  if (!a) return;
  // persist the currentJobs snapshot before navigating
  localStorage.setItem('currentJobs', JSON.stringify(currentJobs));
  // if it's an apply link it already points to apply.html?id=..., view links may point externally; keep behavior
});

// navigation helpers (kept for API compatibility)
function viewJob(id) {
  localStorage.setItem('currentJobs', JSON.stringify(currentJobs));
  window.location.href = `view.html?id=${id}`;
}
function applyJob(id) {
  localStorage.setItem('currentJobs', JSON.stringify(currentJobs));
  window.location.href = `apply.html?id=${id}`;
}

/* --- News fetching / pagination code left unchanged below --- */
// (kept original news logic; no change)
// ...existing news fetching code...
const API_PARAMS = {
    q: 'apple',
    from: '2026-02-19',
    to: '2026-02-19',
    sortBy: 'popularity',
    apiKey: 'a20d76ae83f942cea19615d897c39982'
};
const PAGE_SIZE = 6;
let currentPage = 1;
let articlesCache = [];
let visibleCount = PAGE_SIZE;
let totalResults = Infinity;
let fetching = false;

function el(tag, props = {}, children = []){
    const e = document.createElement(tag);
    for (const k in props) {
        if (k === 'style') e.style.cssText = props[k]; else e.setAttribute(k, props[k]);
    }
    children.forEach(c => typeof c === 'string' ? e.appendChild(document.createTextNode(c)) : e.appendChild(c));
    return e;
}

async function fetchPage(page = 1){
    const newsDiv = document.getElementById('all_news');
    if (!newsDiv) return 0;
    try{
        const u = new URL(BASE_URL);
        Object.entries(API_PARAMS).forEach(([k,v]) => u.searchParams.set(k, v));
        u.searchParams.set('page', String(page));
        u.searchParams.set('pageSize', String(PAGE_SIZE));

        const res = await fetch(u.toString());
        if (!res.ok) {
            newsDiv.innerHTML = `<p>Unable to load news (status ${res.status})</p>`;
            const b = document.getElementById('show-more'); if (b) b.style.display = 'none';
            return 0;
        }

        const data = await res.json();
        if (!Array.isArray(data.articles) || data.articles.length === 0){
            return 0;
        }

        const existingUrls = new Set(articlesCache.map(a => a.url));
        const newOnes = data.articles.filter(a => a.url && !existingUrls.has(a.url));
        articlesCache = articlesCache.concat(newOnes);
        if (typeof data.totalResults === 'number') totalResults = data.totalResults;

        return newOnes.length;
    }catch(err){
        console.error(err);
        const newsDiv = document.getElementById('all_news');
        if (newsDiv) newsDiv.innerHTML = `<p>Error loading news: ${err.message}</p>`;
        const b = document.getElementById('show-more'); if (b) b.style.display = 'none';
        return 0;
    }
}

async function ensureCachedAtLeast(n){
    if (fetching) return;
    fetching = true;
    try{
        while (articlesCache.length < n && articlesCache.length < totalResults) {
            currentPage += 1;
            const added = await fetchPage(currentPage);
            if (added === 0) break;
        }
    }finally{
        fetching = false;
    }
}

function renderNews(){
    const newsDiv = document.getElementById('all_news');
    if (!newsDiv) return;
    newsDiv.innerHTML = '';

    const slice = articlesCache.slice(0, visibleCount);
    slice.forEach((article) => {
        const titleLink = el('a', { href: article.url || '#', target: '_blank', rel: 'noopener noreferrer' }, [ article.title || 'Untitled' ]);
        const h3 = el('h3', { style: 'margin:0 0 6px 0;' }, [ titleLink ]);
        const short = (article.description || '').slice(0, 160);
        const p = el('p', { style: 'margin:6px 0;color:#333' }, [ short + (article.description && article.description.length > 160 ? '...' : '') ]);
        const meta = el('div', { class: 'meta', style: 'font-size:12px;color:#666' }, [ 'Published at: ' + (article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'Unknown') ]);

        const details = el('div', { style: 'display:none;margin-top:8px;color:#222' }, []);
        const fullContent = article.content || article.description || '';
        if (fullContent) details.appendChild(el('p', {}, [ fullContent ]));
        if (article.author) details.appendChild(el('div', { class: 'meta', style: 'margin-top:6px;' }, [ 'Author: ' + article.author ]));
        if (article.source && article.source.name) details.appendChild(el('div', { class: 'meta' }, [ 'Source: ' + article.source.name ]));
        details.appendChild(el('div', { style: 'margin-top:8px' }, [ el('a', { href: article.url || '#', target: '_blank', rel: 'noopener noreferrer' }, [ 'Read original' ]) ]));

        const viewBtn = el('button', { type: 'button', style: 'padding:6px 10px;border-radius:6px;border:1px solid rgba(15,23,42,0.08);background:#fff;cursor:pointer;' }, [ 'View more' ]);
        viewBtn.addEventListener('click', () => {
            if (details.style.display === 'none') {
                details.style.display = 'block';
                viewBtn.textContent = 'View less';
            } else {
                details.style.display = 'none';
                viewBtn.textContent = 'View more';
            }
        });

        const footer = el('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:auto;justify-content:space-between' }, [ meta, viewBtn ]);

        const articleElement = el('article', { class: 'article' }, [ h3, p, footer, details ]);
        newsDiv.appendChild(articleElement);
    });

    const btn = document.getElementById('show-more');
    if (!btn) return;

    if (visibleCount >= articlesCache.length && articlesCache.length >= totalResults) {
        btn.style.display = 'none';
    } else {
        btn.style.display = 'inline-block';
    }
}

async function showMoreHandler(){
    visibleCount += PAGE_SIZE;
    if (visibleCount <= articlesCache.length) {
        renderNews();
        return;
    }
    if (articlesCache.length < totalResults) {
        await ensureCachedAtLeast(visibleCount);
    }
    visibleCount = Math.min(visibleCount, articlesCache.length);
    renderNews();
}

async function initialLoad(){
    const added = await fetchPage(currentPage);
    if (articlesCache.length < PAGE_SIZE && articlesCache.length < totalResults) {
        await ensureCachedAtLeast(PAGE_SIZE);
    }
    visibleCount = Math.min(PAGE_SIZE, articlesCache.length);
    renderNews();
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('show-more');
    if (btn) btn.addEventListener('click', showMoreHandler);
    initialLoad();
});
// ...existing code...
const PEXELS_API_KEY = "CoSrFClsxLlIuMIG1OwriSXvvqAgWemyrJngxhVOD58GzC2DMKfk8Wij";
async function fetchPexelsImage(query) {
  if (!query) return null;
  try {
    const q = encodeURIComponent(query);
    const url = `https://api.pexels.com/v1/search?query=${q}&per_page=1&orientation=random`;
    const resp = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!resp.ok) {
      console.warn("Pexels fetch failed", resp.status);
      return null;
    }
    const data = await resp.json();
    const photo = data.photos && data.photos[0];
    return photo ? (photo.src.large2x || photo.src.landscape || photo.src.large || photo.src.original || photo.src.medium) : null;
  } catch (err) {
    console.error("fetchPexelsImage error:", err);
    return null;
  }
}
// ...existing code...

function loadMore(jobsArray) {
  const container = document.getElementById('jobs-container');
  if (!container) return;

  // Clear
  container.innerHTML = "";

  // show up to visibleJobs count
  const jobsToShow = jobsArray.slice(0, visibleJobs);

  jobsToShow.forEach(async singleJob => { // note: async to allow awaiting pexels if needed
    // derive safe values
    const title = escapeHtml(singleJob.title || singleJob.position || singleJob.company_name || 'Job');
    const company = escapeHtml(singleJob.company_name || '');
    const location = escapeHtml(singleJob.location || '');
    const descFull = String(singleJob.description || '').replace(/\n+/g, ' ').replace(/<[^>]*>?/gm, '');
    const desc = escapeHtml(descFull.length > 150 ? descFull.slice(0, 150) + '…' : descFull);
    const jobUrl = singleJob.url || '#';

    // prefer available image fields; if none, use placeholder then try Pexels
    const candidateImage = singleJob.company_logo || singleJob.image || singleJob.logo;
    const placeholder = `https://via.placeholder.com/900x280.png?text=${encodeURIComponent(singleJob.company_name || singleJob.title || 'Job')}`;
    const initialImage = candidateImage || placeholder;

    // build card element
    const jobWrapper = document.createElement('div');
    jobWrapper.className = 'job col-md-6 col-lg-4 mb-4';

    jobWrapper.innerHTML = `
      <div class="card h-100 job-card border-0 shadow-sm overflow-hidden">
        <div class="job-image-header" style="background-image: url('${initialImage}'); height: 180px; background-size: cover; background-position: center; position: relative;">
          <div class="image-gradient-overlay" style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.45));"></div>
          
        </div>

        <div class="card-body d-flex flex-column p-4">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="fw-bold text-dark mb-0">${title}</h5>
            <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>New</small>
          </div>
          
          <p class="text-primary small mb-3 fw-bold">
            <i class="bi bi-building-fill me-1"></i>${company}
          </p>

          <div class="text-muted small mb-4 description-truncate">
            ${desc}
          </div>
          
          <div class="mt-auto" style="display:flex;gap:8px;">
            <a href="${jobUrl}" target="_blank" class="btn btn-primary w-50 py-2 fw-bold rounded-pill view-role" data-id="${singleJob.__id}" style="display:inline-block;">View Role</a>
            <a href="apply.html?id=${singleJob.__id}" class="btn btn-outline-primary w-50 py-2 fw-bold rounded-pill apply-role" data-id="${singleJob.__id}" style="display:inline-block;">Apply</a>
          </div>
        </div>
      </div>
    `;

    container.appendChild(jobWrapper);

    // If there was no candidate image, try to fetch one from Pexels using company or title
    if (!candidateImage) {
      const query = singleJob.company_name || singleJob.title || singleJob.position || singleJob.tags || 'office';
      const fetched = await fetchPexelsImage(query);
      if (fetched) {
        // preload to ensure image loads
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const header = jobWrapper.querySelector('.job-image-header');
          if (header) {
            header.style.backgroundImage = `url("${fetched}")`;
            header.style.backgroundSize = 'cover';
            header.style.backgroundPosition = 'center';
          }
        };
        img.onerror = () => {
          // keep placeholder if pexels image fails
          console.warn('Pexels image failed to load for', query);
        };
        img.src = fetched;
      }
    }
  });

  // show/hide showMore button
  const button = document.getElementById('showMore');
  if (!button) return;
  if (visibleJobs >= jobsArray.length) {
    button.style.display = 'none';
  } else {
    button.style.display = 'block';
  }
}
