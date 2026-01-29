const STORAGE_KEYS = {
  inspections: 'rt_inspections',
  issues: 'rt_issues',
  photos: 'rt_photos'
};

function readStore(key, fallback = []) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function todayISO(){ return new Date().toISOString().slice(0,10); }

function updateDateTime(){
  const now = new Date();
  const dateEl = document.getElementById('current-date');
  const timeEl = document.getElementById('current-time');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}

function computeStats(){
  const inspections = readStore(STORAGE_KEYS.inspections);
  const issues = readStore(STORAGE_KEYS.issues);
  const todaysInspections = inspections.filter(i => (i.date||'').startsWith(todayISO())).length;
  const completed = inspections.filter(i => i.status==='Completed').length;
  const total = inspections.length || 1;
  const completionRate = Math.round(completed/total*100);
  const pendingIssues = issues.filter(i => i.status!=='Closed').length;
  const elToday = document.getElementById('stat-today-count');
  const elDelta = document.getElementById('stat-today-delta');
  const elPending = document.getElementById('stat-pending-issues');
  const elProgress = document.getElementById('stat-issues-progress');
  const elRate = document.getElementById('stat-completion-rate');
  const elRateLbl = document.getElementById('stat-completion-label');
  if (elToday) elToday.textContent = String(todaysInspections);
  if (elDelta) elDelta.textContent = '+0 from yesterday';
  if (elPending) elPending.textContent = String(pendingIssues);
  if (elProgress) elProgress.style.width = `${Math.min(100, pendingIssues*20)}%`;
  if (elRate) elRate.textContent = `${completionRate}%`;
  if (elRateLbl) elRateLbl.textContent = completionRate>=90?'Excellent':completionRate>=70?'Good':'Needs Attention';
}

async function loadRecentInspections(limit=3){
  const container = document.getElementById('recent-inspections');
  if (!container) return;
  container.innerHTML = '<div class="p-4 text-gray-500 flex items-center"><i data-feather="loader" class="w-4 h-4 mr-2 animate-spin"></i> Loading...</div>';
  let local = readStore(STORAGE_KEYS.inspections);
  local = local.sort((a,b)=> new Date(b.date||0)-new Date(a.date||0)).slice(0,limit);
  let remote = [];
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit='+limit);
    remote = await res.json();
  } catch {
    remote = Array.from({length:limit}).map((_,i)=>({id:100+i,title:`Sample inspection note ${i+1}`}));
  }
  const items = [];
  for(let i=0;i<limit;i++){
    if(local[i]){
      items.push({ id: local[i].id, title: `${local[i].site} - ${local[i].equipment}`, status: local[i].status, date: local[i].date });
    } else if (remote[i]){
      items.push({ id: remote[i].id, title: remote[i].title, status: ['Completed','In Progress','Pending'][i%3], date: new Date(Date.now()-i*86400000).toISOString() });
    }
  }
  const statuses=['Completed','In Progress','Pending'];
  const colors=['text-rig-success','text-rig-warning','text-gray-500'];
  const icons=['check-circle','clock','alert-circle'];
  container.innerHTML='';
  items.forEach((item,idx)=>{
    const sIdx = statuses.indexOf(item.status);
    const ix = sIdx>=0?sIdx:(idx%3);
    const row = document.createElement('div');
    row.className='flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors';
    row.innerHTML = `
      <div class="flex items-center">
        <div class="mr-4">
          <div class="w-12 h-12 bg-gradient-to-br from-rig-blue to-rig-accent rounded-lg flex items-center justify-center">
            <i data-feather="${icons[ix]}" class="w-6 h-6 text-white"></i>
          </div>
        </div>
        <div>
          <h3 class="font-semibold text-gray-800">${item.title.substring(0,60)}</h3>
          <div class="flex items-center mt-1">
            <span class="text-xs ${colors[ix]} font-medium flex items-center">
              <i data-feather="${icons[ix]}" class="w-3 h-3 mr-1"></i>${statuses[ix]}
            </span>
            <span class="text-xs text-gray-500 ml-3">${new Date(item.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <a href="inspection-detail.html?id=${encodeURIComponent(item.id)}" class="text-rig-blue hover:text-rig-accent">
        <i data-feather="chevron-right" class="w-5 h-5"></i>
      </a>`;
    container.appendChild(row);
  });
  if (window.feather) feather.replace();
}

function startNewInspection(){ window.location.href = 'new-inspection.html'; }
window.startNewInspection = startNewInspection;

document.addEventListener('DOMContentLoaded', ()=>{
  updateDateTime();
  setInterval(updateDateTime, 60000);
  loadRecentInspections();
  computeStats();
  if (window.feather) feather.replace();
});
