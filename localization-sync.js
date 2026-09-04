(()=>{
 const supported=['sk','uk','en'];
 const primaryKey='businessai-language';
 const legacyKey='businessai-lang';
 const result=document.querySelector('#result');
 function current(){
  const primary=localStorage.getItem(primaryKey);
  if(supported.includes(primary))return primary;
  const legacy=localStorage.getItem(legacyKey);
  if(supported.includes(legacy))return legacy;
  const html=(document.documentElement.lang||'sk').toLowerCase();
  return supported.includes(html)?html:'sk';
 }
 function apply(next){
  const lang=supported.includes(next)?next:'sk';
  localStorage.setItem(primaryKey,lang);
  localStorage.setItem(legacyKey,lang);
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-lang]').forEach(btn=>{
   const active=btn.dataset.lang===lang;
   btn.classList.toggle('active',active);
   btn.setAttribute('aria-pressed',active?'true':'false');
  });
  window.dispatchEvent(new CustomEvent('businessai:language-changed',{detail:{lang}}));
  return lang;
 }
 function preserveAIWhileSwitching(lang){
  const keepAI=!!(result&&result.dataset.ai==='1'&&!result.hidden);
  if(keepAI)result.hidden=true;
  apply(lang);
  if(keepAI)setTimeout(()=>{if(result&&result.dataset.ai==='1')result.hidden=false},0);
 }
 document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-lang]');
  if(!btn)return;
  const next=btn.dataset.lang;
  if(!supported.includes(next))return;
  preserveAIWhileSwitching(next);
 },true);
 window.addEventListener('storage',e=>{
  if((e.key===primaryKey||e.key===legacyKey)&&supported.includes(e.newValue))apply(e.newValue);
 });
 window.BusinessAILanguage={apply,current};
 const lang=apply(current());
 const marketPlaceholder=document.querySelector('#market-output .market-placeholder');
 if(marketPlaceholder&&marketPlaceholder.textContent.includes('спустіть')){
  marketPlaceholder.textContent=lang==='uk'?'Заповніть дані та запустіть аналіз.':lang==='en'?'Fill in the details and run the analysis.':'Vyplňte údaje a spustite analýzu.';
 }
})();