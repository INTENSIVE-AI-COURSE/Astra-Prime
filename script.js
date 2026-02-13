const jobsList = document.getElementById('jobsList');
const searchInput = document.getElementById('searchInput');
const pagination = document.getElementById('pagination');

let allJobs = [];
let filteredJobs = [];
let currentPage = 1;
const jobsPerPage = 6;

// 1. Fetch Data
fetch("https://www.arbeitnow.com/api/job-board-api")
    .then(response => response.json())
    .then(result => {
        allJobs = result.data;
        filteredJobs = [...allJobs];
        renderUI();
    })
    .catch(error => {
        jobsList.innerHTML = `<div class="alert alert-danger">Error loading data. Please try again later.</div>`;
    });

// 2. Render Functions
function renderUI() {
    displayJobs();
    setupPagination();
}

function displayJobs() {
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    if (paginatedJobs.length === 0) {
        jobsList.innerHTML = `<p class="text-center py-5">No jobs found matching your criteria.</p>`;
        return;
    }

    jobsList.innerHTML = paginatedJobs.map(job => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 job-card shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-soft-primary text-primary border border-primary small">${job.location}</span>
                        <small class="text-muted">${new Date(job.created_at * 1000).toLocaleDateString()}</small>
                    </div>
                    <h5 class="card-title fw-bold text-dark mb-1">${job.title}</h5>
                    <p class="text-primary small mb-3 fw-semibold">${job.company_name}</p>
                    <div class="card-text text-secondary small mb-4" style="overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                        ${job.description.replace(/<[^>]*>?/gm, '')}
                    </div>
                    <div class="mt-auto">
                        <a href="${job.url}" target="_blank" class="btn btn-outline-primary btn-sm w-100 fw-bold">View Details</a>
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

    for (let i = 1; i <= pageCount; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#jobs-section">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderUI();
        });
        pagination.appendChild(li);
    }
}

// 3. Search Logic
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    filteredJobs = allJobs.filter(job => 
        job.title.toLowerCase().includes(term) || 
        job.company_name.toLowerCase().includes(term)
    );
    currentPage = 1; // Reset to page 1 on new search
    renderUI();
});

// Contact Form Intercept
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you! Your message has been sent to the Astra Prime team.');
    e.target.reset();
});