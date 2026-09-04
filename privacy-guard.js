(()=>{
 if(window.BusinessAIPrivacy?.ready)return;
 const WORKER_HOST='businessai-api.zyzyll1993.workers.dev';
 const HISTORY_KEY='businessai-ai-history',APPLY_KEY='businessai-ai-apply-cache',AUTOPLAN_KEY='businessai-ai-autoplan';
 const supported=['sk','uk','en'];
 const lang=()=>{const v=localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';return supported.includes(v)?v:'sk'};
 const copy={
  sk:{notice:'Ochrana údajov je aktívna: pred odoslaním do AI automaticky odstránime e-mail, telefón, IBAN, číslo platobnej karty a bežné tajné kľúče. Nevkladajte heslá, doklady, zdravotné údaje ani celé osobné spisy.',redacted:'Citlivé údaje boli pred odoslaním do AI odstránené.',clear:'Vymazať AI históriu',confirm:'Vymazať lokálnu AI históriu, AI autoplán a aktuálnu AI odpoveď na tomto zariadení?',cleared:'AI história a autoplán boli vymazané.'},
  uk:{notice:'Захист даних активний: перед відправленням в AI автоматично видаляємо e-mail, телефон, IBAN, номер платіжної картки та типові секретні ключі. Не вводьте паролі, документи, медичні дані або повні персональні досьє.',redacted:'Чутливі дані видалено перед відправленням в AI.',clear:'Очистити AI-історію',confirm:'Видалити локальну AI-історію, AI-автоплан і поточну AI-відповідь на цьому пристрої?',cleared:'AI-історію та автоплан видалено.'},
  en:{notice:'Data protection is active: before sending to AI we automatically remove email addresses, phone numbers, IBANs, payment-card numbers and common secret keys. Do not enter passwords, identity documents, health data or full personal records.',redacted:'Sensitive data was removed before sending to AI.',clear:'Clear AI history',confirm:'Delete local AI history, AI autoplan and the current AI response on this device?',cleared:'AI history and autoplan were deleted.'}
 };
 const t=()=>copy[lang()]||copy.sk;
 const luhn=value=>{const digits=String(value).replace(/\D/g,'');if(digits.length<13||digits.length>19)return false;let sum=0,alt=false;for(let i=digits.length-1;i>=0;i--){let n=Number(digits[i]);if(alt){n*=2;if(n>9)n-=9}sum+=n;alt=!alt}return sum%10===0};
 function sanitizeText(value){
  const original=String(value??'');let text=original;const types=new Set();
  const mark=(type,label)=>{types.add(type);return `[${label}_REMOVED]`};
  text=text.replace(/\b(?:sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g,()=>mark('secret','SECRET'));
  text=text.replace(/\b(password|heslo|пароль|api[_ -]?key|secret|token)\s*[:=]\s*[^\s,;]+/gi,(m,key)=>`${key}: ${mark('secret','SECRET')}`);
  text=text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,()=>mark('email','EMAIL'));
  text=text.replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]){11,30}\b/gi,m=>{const compact=m.replace(/\s/g,'');return compact.length>=15&&compact.length<=34?mark('iban','IBAN'):m});
  text=text.replace(/\b\d{6}\/?\d{3,4}\b/g,()=>mark('personal-id','PERSONAL_ID'));
  text=text.replace(/\b(?:\d[ -]*?){13,19}\b/g,m=>luhn(m)?mark('payment-card','CARD'):m);
  text=text.replace(/(?:\+|00)?\d(?:[\s().-]*\d){7,14}/g,m=>{const digits=m.replace(/\D/g,'');return digits.length>=8&&digits.length<=15?mark('phone','PHONE'):m});
  return{value:text,changed:text!==original,types:[...types]};
 }
 function sanitizeObject(value,depth=0){
  if(depth>6)return{value:null,changed:true,types:['depth']};
  if(typeof value==='string')return sanitizeText(value);
  if(Array.isArray(value)){let changed=false;const types=new Set();const out=value.map(v=>{const r=sanitizeObject(v,depth+1);changed||=r.changed;r.types.forEach(x=>types.add(x));return r.value});return{value:out,changed,types:[...types]}}
  if(value&&typeof value==='object'){let changed=false;const types=new Set(),out={};for(const[k,v]of Object.entries(value)){const r=sanitizeObject(v,depth+1);changed||=r.changed;r.types.forEach(x=>types.add(x));out[k]=r.value}return{value:out,changed,types:[...types]}}
  return{value,changed:false,types:[]};
 }
 window.BusinessAIPrivacy={ready:true,sanitizeText,sanitizeObject};
 const nativeSetItem=Storage.prototype.setItem;
 Storage.prototype.setItem=function(key,value){
  if(this===localStorage&&[HISTORY_KEY,APPLY_KEY,AUTOPLAN_KEY].includes(key)&&typeof value==='string'){
   try{const parsed=JSON.parse(value),safe=sanitizeObject(parsed);if(safe.changed)value=JSON.stringify(safe.value)}catch(_){}
  }
  return nativeSetItem.call(this,key,value);
 };
 for(const key of [HISTORY_KEY,APPLY_KEY,AUTOPLAN_KEY]){try{const raw=localStorage.getItem(key);if(!raw)continue;const parsed=JSON.parse(raw),safe=sanitizeObject(parsed);if(safe.changed)nativeSetItem.call(localStorage,key,JSON.stringify(safe.value))}catch(_){}}
 const originalFetch=window.fetch.bind(window);
 window.fetch=async function(input,init={}){
  const url=typeof input==='string'?input:(input?.url||'');
  const method=String(init?.method||'GET').toUpperCase();
  if(!url.includes(WORKER_HOST)||method!=='POST'||typeof init?.body!=='string')return originalFetch(input,init);
  try{
   const raw=JSON.parse(init.body),payload={...raw};
   if(payload.project&&typeof payload.project==='object'&&!Array.isArray(payload.project)){
    const allowed={};for(const key of ['name','product','customer','location','price'])if(payload.project[key]!==undefined)allowed[key]=payload.project[key];payload.project=allowed;
   }
   const safe=sanitizeObject(payload);
   if(safe.changed)window.dispatchEvent(new CustomEvent('businessai:privacy-redacted',{detail:{types:safe.types}}));
   return originalFetch(input,{...init,body:JSON.stringify(safe.value)});
  }catch(_){return originalFetch(input,init)}
 };
 function mount(){
  const form=document.querySelector('#business-form');if(!form)return;
  let box=form.querySelector('.privacy-guard');if(!box){box=document.createElement('div');box.className='privacy-guard';const footer=form.querySelector('.form-footer');footer?.insertAdjacentElement('beforebegin',box)}
  const render=()=>{const c=t();box.innerHTML=`<div class="privacy-guard-main"><span class="privacy-guard-icon">🛡️</span><span class="privacy-guard-text">${c.notice}</span></div><div class="privacy-guard-actions"><span class="privacy-guard-status" aria-live="polite"></span><button type="button" class="privacy-clear-history">${c.clear}</button></div>`;box.querySelector('.privacy-clear-history').onclick=()=>{if(!confirm(c.confirm))return;localStorage.removeItem(HISTORY_KEY);localStorage.removeItem(APPLY_KEY);localStorage.removeItem(AUTOPLAN_KEY);const result=document.querySelector('#result'),input=document.querySelector('#business-input');if(result){result.innerHTML='';result.hidden=true;result.dataset.ai='0'}if(input)input.value='';box.querySelector('.privacy-guard-status').textContent=c.cleared;window.dispatchEvent(new CustomEvent('businessai:ai-history-changed'))}}
  render();
  window.addEventListener('businessai:language-changed',render);
  window.addEventListener('businessai:privacy-redacted',()=>{const el=box.querySelector('.privacy-guard-status');if(el){el.textContent=t().redacted;setTimeout(()=>{if(el)el.textContent=''},5000)}});
 }
 const style=document.createElement('style');style.textContent=`.privacy-guard{margin:12px 0 2px;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#081625;color:var(--muted);font-size:.84rem}.privacy-guard-main{display:flex;gap:9px;align-items:flex-start}.privacy-guard-icon{flex:0 0 auto}.privacy-guard-text{line-height:1.45}.privacy-guard-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:8px}.privacy-guard-status{color:var(--accent);font-weight:700}.privacy-clear-history{border:0;background:transparent;color:var(--muted);text-decoration:underline;cursor:pointer;font:inherit;padding:2px 0}@media(max-width:600px){.privacy-guard-actions{align-items:flex-start;flex-direction:column}}`;document.head.appendChild(style);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();