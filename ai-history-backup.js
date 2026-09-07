(()=>{
 const AI_KEY='businessai-ai-history',AUTOPLAN_KEY='businessai-ai-autoplan',PROJECTS_KEY='businessai-projects-v1';
 const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||fallback);return v}catch(_){return JSON.parse(fallback)}};
 const projectFromForm=()=>{
  const stored=read('businessai-project','{}')||{};
  const val=id=>document.querySelector(id)?.value?.trim();
  return {
   name:val('#ws-name')??stored.name??'',
   product:val('#ws-product')??stored.product??'',
   customer:val('#ws-customer')??stored.customer??'',
   location:val('#ws-location')??stored.location??'',
   price:val('#ws-price')??stored.price??'',
   budget:stored.budget??'',
   experience:stored.experience??'',
   goal:stored.goal??''
  };
 };
 const lang=()=>localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';
 const statusText=()=>lang()==='uk'?'Повну копію з проєктами, історією AI та автопланом підготовлено':lang()==='en'?'Full backup with projects, AI history and autoplan prepared':'Úplná záloha s projektmi, AI históriou a autoplánom je pripravená';
 const status=text=>{const el=document.querySelector('#business-workspace .workspace-status');if(!el)return;el.textContent=text;setTimeout(()=>{if(el.textContent===text)el.textContent=''},1800)};
 const makeBackup=()=>({
  format:'businessai-sk-backup',
  version:5,
  createdAt:new Date().toISOString(),
  language:lang(),
  project:projectFromForm(),
  competitors:read('businessai-market-competitors','[]'),
  sales:read('businessai-sales-pipeline','[]'),
  cashflow:read('businessai-cashflow','[]'),
  goals:read('businessai-goals','[]'),
  aiHistory:read(AI_KEY,'[]'),
  aiAutoplan:read(AUTOPLAN_KEY,'null'),
  projectLibrary:read(PROJECTS_KEY,'{"version":1,"activeId":null,"projects":[]}')
 });
 document.addEventListener('click',event=>{
  const btn=event.target.closest('#ws-export');
  if(!btn)return;
  event.preventDefault();event.stopImmediatePropagation();
  window.BusinessAIProjects?.sync?.();
  const payload=makeBackup();
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  const safe=(payload.project.name||'businessai-project').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase()||'businessai-project';
  a.href=url;a.download=`${safe}-full-backup.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status(statusText());
 },true);
 document.addEventListener('change',event=>{
  const input=event.target.closest('#ws-file');if(!input)return;
  const file=input.files?.[0];if(!file)return;
  const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(String(reader.result||''));if(Array.isArray(payload?.aiHistory)){localStorage.setItem(AI_KEY,JSON.stringify(payload.aiHistory));window.dispatchEvent(new CustomEvent('businessai:ai-history-changed'))}if(payload?.aiAutoplan&&typeof payload.aiAutoplan==='object')localStorage.setItem(AUTOPLAN_KEY,JSON.stringify(payload.aiAutoplan));if(payload?.projectLibrary&&Array.isArray(payload.projectLibrary.projects))localStorage.setItem(PROJECTS_KEY,JSON.stringify(payload.projectLibrary))}catch(_){}};reader.readAsText(file);
 },true);
})();