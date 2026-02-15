let alljobs = [];
let currentJobs = []; 
let visibleJobs = 6;

var requestOptions = {
  method: 'GET',
  redirect: 'follow'
};

fetch("https://www.arbeitnow.com/api/job-board-api", requestOptions)
  .then(response => response.json())
  .then(data => {

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
    container.innerHTML = "";

    const jobsToShow = jobsArray.slice(0, visibleJobs);

    jobsToShow.forEach(singleJob => {
        const jobElement = document.createElement('div');
        jobElement.classList.add('job');

        // format date nicely
        let dateText = '';
        try{
            const d = new Date(singleJob.created_at);
            if(!isNaN(d)) dateText = d.toLocaleDateString();
            else dateText = singleJob.created_at || '';
        }catch(e){ dateText = singleJob.created_at || ''; }

        const jobTypes = Array.isArray(singleJob.job_types) ? singleJob.job_types.join(', ') : (singleJob.job_types || '');
        const title = singleJob.title || singleJob.position || singleJob.company_name || 'Job';
        const company = singleJob.company_name || '';
        const descFull = (singleJob.description || '').replace(/\n+/g, ' ');
        const desc = descFull.length > 150 ? descFull.slice(0,150) + '…' : descFull;

        jobElement.innerHTML = `
            <h3>${title}</h3>
            <div class="company">${company}</div>
            <div class="meta">${dateText} · ${jobTypes}</div>
            <p>${desc}</p>
            <div class="cta">
                <button class="btn btn-outline" onclick="viewJob(${singleJob.__id})">View</button>
                <button class="btn btn-primary" onclick="applyJob(${singleJob.__id})">Apply</button>
            </div>
        `;

        container.appendChild(jobElement);
    });

    const button = document.getElementById('showMore');

    if (!button) return;
    if (visibleJobs >= jobsArray.length) {
        button.style.display = 'none';
    } else {
        button.style.display = 'block';
    }
}


document.getElementById('showMore').addEventListener('click', function () {
    visibleJobs += 6;
    loadMore(currentJobs);
});


function searchJobs() {
    const query = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    if(!query){
        currentJobs = alljobs.slice();
    } else {
        currentJobs = alljobs.filter(job => {
            const hay = ((job.title||'') + ' ' + (job.company_name||'') + ' ' + (Array.isArray(job.job_types)? job.job_types.join(' '): job.job_types || '') + ' ' + (job.description||'')).toLowerCase();
            return hay.indexOf(query) !== -1;
        });
    }
    visibleJobs = 6;
    loadMore(currentJobs);
}

// wire up search and clear buttons
const searchBtn = document.getElementById('searchBtn');
if(searchBtn) searchBtn.addEventListener('click', searchJobs);
const clearBtn = document.getElementById('clearBtn');
if(clearBtn) clearBtn.addEventListener('click', function(){ document.getElementById('searchInput').value = ''; currentJobs = alljobs.slice(); visibleJobs = 6; loadMore(currentJobs); });

// allow Enter key on search input
const searchInputEl = document.getElementById('searchInput');
if(searchInputEl) searchInputEl.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); searchJobs(); } });

// navigation helpers used by buttons in cards
function viewJob(id){
    // ensure currentJobs cached
    localStorage.setItem('currentJobs', JSON.stringify(currentJobs));
    window.location.href = `view.html?id=${id}`;
}

function applyJob(id){
    localStorage.setItem('currentJobs', JSON.stringify(currentJobs));
    window.location.href = `apply.html?id=${id}`;
}
