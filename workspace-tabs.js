(()=>{
 const KEY='businessai-workspace-tab';
 const tabs=[
  {key:'overview',icon:'🏠',target:'#business-dashboard',sk:'Prehľad',uk:'Огляд',en:'Overview'},
  {key:'ai',icon:'✨',target:'#assistant',sk:'AI pomocník',uk:'AI-помічник',en:'AI assistant'},
  {key:'idea',icon:'💡',target:'#idea-validator',sk:'Nápad',uk:'Ідея',en:'Idea'},
  {key:'market',icon:'🔎',target:'#market-analysis',sk:'Trh',uk:'Ринок',en:'Market'},
  {key:'price',icon:'€',target:'#calculator',sk:'Cena',uk:'Ціна',en:'Price'},
  {key:'plan',icon:'📊',target:'#business-plan-builder',sk:'Biznis plán',uk:'Бізнес-план',en:'Business plan'},
  {key:'marketing',icon:'📣',target:'#marketing-builder',sk:'Marketing',uk:'Маркетинг',en:'Marketing'},
  {key:'documents',icon:'📄',target:'#documents-builder',sk:'Dokumenty',uk:'Документи',en:'Documents'},
  {key:'sales',icon:'🤝',target:'#sales-pipeline',sk:'Predaj',uk:'Продажі',en:'Sales'},
  {key:'finance',icon:'💶',target:'#cashflow-tracker',sk:'Financie',uk:'Фінанси',en:'Finance'},
  {key:'goals',icon:'🎯',target:'#goals-tracker',sk:'Ciele',uk:'Цілі',en:'Goals'},
  {key:'health',icon:'📈',target:'#business-health',sk:'Health',uk:'Health',en:'Health'},
  {key:'review',icon:'📋',target:'#weekly-review',sk:'Týždeň',uk:'Тиждень',en:'Week'}
 ];
 const byModule={idea:'idea',market:'market',price:'price',plan:'plan',marketing:'marketing',documents:'documents',sales:'sales',finance:'finance',goals:'goals',health:'health',review:'review'};
 const lang=()=>{const v=localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';return ['sk','uk','en'].includes(v)?v:'sk'};
 let active=localStorage.getItem(KEY)||'overview';
 if(!tabs.some(x=>x.key===active))active='overview';
 const style=document.createElement('style');
 style.textContent=`
  body.businessai-tabs-ready{overflow-x:hidden}
  .businessai-workspace-tabs{position:sticky;top:0;z-index:40;background:rgba(5,15,27,.96);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);box-shadow:0 12px 28px rgba(0,0,0,.18)}
  .businessai-workspace-tabs-inner{max-width:1180px;margin:0 auto;display:flex;gap:8px;overflow-x:auto;padding:10px 18px;scrollbar-width:thin;scroll-snap-type:x proximity}
  .businessai-workspace-tab{flex:0 0 auto;min-height:44px;border:1px solid var(--line);background:#0b1a2c;color:var(--muted);border-radius:13px;padding:9px 13px;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap;scroll-snap-align:start}
  .businessai-workspace-tab:hover{color:var(--text);border-color:rgba(255,255,255,.22)}
  .businessai-workspace-tab.active{background:var(--accent);color:#07111f;border-color:var(--accent)}
  .businessai-workspace-tab span{margin-right:6px}
  .businessai-tab-hidden{display:none!important}
  body.businessai-tabs-ready .hero,body.businessai-tabs-ready #tools,body.businessai-tabs-ready #how{display:none!important}
  body.businessai-tabs-ready main{min-height:70vh}
  body.businessai-tabs-ready #business-dashboard,body.businessai-tabs-ready #assistant,body.businessai-tabs-ready #idea-validator,body.businessai-tabs-ready #market-analysis,body.businessai-tabs-ready #calculator,body.businessai-tabs-ready #business-plan-builder,body.businessai-tabs-ready #marketing-builder,body.businessai-tabs-ready #documents-builder,body.businessai-tabs-ready #sales-pipeline,body.businessai-tabs-ready #cashflow-tracker,body.businessai-tabs-ready #goals-tracker,body.businessai-tabs-ready #business-health,body.businessai-tabs-ready #weekly-review{padding-top:34px}
  @media(max-width:640px){.businessai-workspace-tabs-inner{padding:8px 12px;gap:7px}.businessai-workspace-tab{padding:8px 11px;font-size:.92rem}body.businessai-tabs-ready #business-dashboard,body.businessai-tabs-ready #assistant,body.businessai-tabs-ready #idea-validator,body.businessai-tabs-ready #market-analysis,body.businessai-tabs-ready #calculator,body.businessai-tabs-ready #business-plan-builder,body.businessai-tabs-ready #marketing-builder,body.businessai-tabs-ready #documents-builder,body.businessai-tabs-ready #sales-pipeline,body.businessai-tabs-ready #cashflow-tracker,body.businessai-tabs-ready #goals-tracker,body.businessai-tabs-ready #business-health,body.businessai-tabs-ready #weekly-review{padding-top:24px}}
 `;
 document.head.appendChild(style);
 const nav=document.createElement('nav');
 nav.className='businessai-workspace-tabs';
 nav.setAttribute('aria-label','BusinessAI workspace');
 const inner=document.createElement('div');
 inner.className='businessai-workspace-tabs-inner';
 inner.setAttribute('role','tablist');
 nav.appendChild(inner);
 const header=document.querySelector('.site-header');
 if(header)header.insertAdjacentElement('afterend',nav);else document.body.prepend(nav);
 function tabLabel(item){return item[lang()]||item.sk}
 function renderTabs(){
  inner.innerHTML=tabs.map(item=>`<button type="button" class="businessai-workspace-tab${item.key===active?' active':''}" data-workspace-tab="${item.key}" role="tab" aria-selected="${item.key===active?'true':'false'}"><span>${item.icon}</span>${tabLabel(item)}</button>`).join('');
  inner.querySelectorAll('[data-workspace-tab]').forEach(btn=>btn.addEventListener('click',()=>activate(btn.dataset.workspaceTab,true)));
  const selected=inner.querySelector('.active');if(selected)selected.scrollIntoView({block:'nearest',inline:'nearest'});
 }
 function managedElements(){return tabs.map(item=>document.querySelector(item.target)).filter(Boolean)}
 function applyVisibility(){
  const current=tabs.find(x=>x.key===active)||tabs[0];
  managedElements().forEach(el=>el.classList.add('businessai-tab-hidden'));
  const target=document.querySelector(current.target);
  if(target)target.classList.remove('businessai-tab-hidden');
  document.querySelectorAll('.research-box').forEach(el=>el.classList.toggle('businessai-tab-hidden',active!=='market'));
  document.body.classList.add('businessai-tabs-ready');
 }
 function activate(key,scroll){
  if(!tabs.some(x=>x.key===key))key='overview';
  active=key;localStorage.setItem(KEY,key);renderTabs();applyVisibility();
  if(scroll){nav.scrollIntoView({behavior:'smooth',block:'start'})}
  history.replaceState(null,'',`#workspace-${key}`);
  window.dispatchEvent(new CustomEvent('businessai:workspace-tab-changed',{detail:{tab:key}}));
 }
 function fromHash(){const m=(location.hash||'').match(/^#workspace-([a-z-]+)$/);return m&&tabs.some(x=>x.key===m[1])?m[1]:null}
 const hashed=fromHash();if(hashed)active=hashed;
 renderTabs();applyVisibility();
 document.addEventListener('click',e=>{
  const dashboard=e.target.closest('[data-go]');if(dashboard&&byModule[dashboard.dataset.go])activate(byModule[dashboard.dataset.go],false);
  const module=e.target.closest('[data-module]');if(module&&byModule[module.dataset.module])activate(byModule[module.dataset.module],false);
  const link=e.target.closest('a[href="#tools"]');if(link){e.preventDefault();activate('overview',true)}
  const how=e.target.closest('a[href="#how"]');if(how){e.preventDefault();activate('overview',true)}
 },true);
 window.addEventListener('hashchange',()=>{const k=fromHash();if(k)activate(k,false)});
 window.addEventListener('businessai:language-changed',()=>renderTabs());
 document.querySelectorAll('[data-lang]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(renderTabs,0)));
 let scheduled=false;
 const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;applyVisibility()})});
 observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:false});
 window.BusinessAITabs={open:key=>activate(key,true),current:()=>active};
})();