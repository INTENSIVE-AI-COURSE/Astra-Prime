const jobsList = document.getElementById('jobsList');
const searchInput = document.getElementById('searchInput');
const pagination = document.getElementById('pagination');

let allJobs = [];
let filteredJobs = [];
let currentPage = 1;
const jobsPerPage = 6;

// 1. Fetching Logic
fetch("https://www.arbeitnow.com/api/job-board-api")
    .then(response => response.json())
    .then(result => {
        allJobs = result.data;
        filteredJobs = [...allJobs];
        renderUI();
    })
    .catch(() => {
        jobsList.innerHTML = `<p class="text-center text-danger">Network error. Please refresh.</p>`;
    });

// 2. The Render Engine
function renderUI() {
    displayJobs();
    setupPagination();
    
    // Auto-English Force
    if (typeof google !== 'undefined' && google.translate) {
        setTimeout(() => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                select.value = 'en';
                select.dispatchEvent(new Event('change'));
            }
        }, 400);
    }
}

function displayJobs() {
    const startIndex = (currentPage - 1) * jobsPerPage;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

    if (paginatedJobs.length === 0) {
        jobsList.innerHTML = `<div class="col-12 text-center py-5"><h3>No jobs found.</h3></div>`;
        return;
    }

    jobsList.innerHTML = paginatedJobs.map(job => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 job-card p-2 border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge-location">
                            <i class="bi bi-geo-alt-fill me-1"></i>${job.location}
                        </span>
                        <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>New</small>
                    </div>
                    
                    <h5 class="fw-bold text-dark mb-1">${job.title}</h5>
                    <p class="text-primary small mb-3 fw-bold">
                        <i class="bi bi-building-fill me-1"></i>${job.company_name}
                    </p>
                    
                    <div class="text-muted small mb-4" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden; line-height:1.6;">
                        ${job.description.replace(/<[^>]*>?/gm, '')}
                    </div>
                    
                    <div class="mt-auto">
                        <a href="${job.url}" target="_blank" class="btn btn-primary w-100 py-2 shadow-sm">
                            View Role <i class="bi bi-arrow-right-short ms-1"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function setupPagination() {
    pagination.innerHTML = "";
    const pageCount = Math.ceil(filteredJobs.length / jobsPerPage);
    if (pageCount <= 1) return;

    // Show only 5 pages at a time for cleaner UI
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(pageCount, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.onclick = (e) => {
            e.preventDefault();
            currentPage = i;
            renderUI();
            window.scrollTo({ top: document.getElementById('jobs-section').offsetTop - 80, behavior: 'smooth' });
        };
        pagination.appendChild(li);
    }
}

// 3. Search Intercept
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    filteredJobs = allJobs.filter(job => 
        job.title.toLowerCase().includes(term) || 
        job.company_name.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term)
    );
    currentPage = 1;
    renderUI();
});
