(()=>{
 const result=document.querySelector('#result'),input=document.querySelector('#business-input');
 if(!result||!input)return;
 const PROJECT_KEY='businessai-project',CACHE_KEY='businessai-ai-apply-cache';
 const supported=['sk','uk','en'];
 const lang=()=>{const v=localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';return supported.includes(v)?v:'sk'};
 const endpoint=()=>String(window.BUSINESSAI_AI_ENDPOINT||localStorage.getItem('businessai-ai-endpoint')||'https://businessai-api.zyzyll1993.workers.dev/').trim();
 const copy={
  sk:{apply:'Použiť všetko',working:'Analyzujem a vypĺňam moduly…',done:'Údaje boli uložené a prenesené do modulov.',error:'Automatické vyplnenie sa nepodarilo.',again:'Použiť znova'},
  uk:{apply:'Застосувати все',working:'Аналізую та заповнюю модулі…',done:'Дані збережено й перенесено в модулі.',error:'Не вдалося автоматично заповнити модулі.',again:'Застосувати знову'},
  en:{apply:'Apply all',working:'Analyzing and filling modules…',done:'Data saved and applied across the modules.',error:'Automatic module filling failed.',again:'Apply again'}
 };
 const t=()=>copy[lang()]||copy.sk;
 const clean=v=>typeof v==='string'?v.trim():v;
 const number=v=>{if(v===null||v===undefined||v==='')return null;if(typeof v==='number')return Number.isFinite(v)?v:null;const n=parseFloat(String(v).replace(/[^0-9,.-]/g,'').replace(',','.'));return Number.isFinite(n)?n:null};
 const has=v=>v!==null&&v!==undefined&&String(v).trim()!=='';
 const set=(id,value)=>{if(!has(value))return false;const el=document.querySelector('#'+id);if(!el)return false;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true};
 const readProject=()=>{try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'{}')||{}}catch(_){return{}}};
 const readCache=()=>{try{const v=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}');return v&&typeof v==='object'?v:{}}catch(_){return{}}};
 const hash=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)+'-'+text.length};
 const writeCache=(key,data)=>{const c=readCache();c[key]={data,at:Date.now()};const entries=Object.entries(c).sort((a,b)=>(b[1]?.at||0)-(a[1]?.at||0)).slice(0,20);localStorage.setItem(CACHE_KEY,JSON.stringify(Object.fromEntries(entries)))};
 const parseJson=text=>{let s=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a<0||b<=a)throw new Error('No JSON object');s=s.slice(a,b+1);return JSON.parse(s)};
 const status=(text,error=false)=>{let el=result.querySelector('.ai-apply-status');if(!el){el=document.createElement('div');el.className='ai-apply-status';const actions=result.querySelector('.ai-workflow-actions');actions?.insertAdjacentElement('afterend',el)}if(el){el.textContent=text;el.dataset.error=error?'1':'0'}};
 function normalize(raw){
  const d=raw&&typeof raw==='object'?raw:{};const calc=d.calculator&&typeof d.calculator==='object'?d.calculator:{};
  return{
   name:clean(d.name)||null,product:clean(d.product)||null,customer:clean(d.customer)||null,location:clean(d.location)||null,
   budget:number(d.budget),price:number(d.price),sales_target:number(d.sales_target),channels:clean(d.channels)||null,
   benefit:clean(d.benefit)||null,problem:clean(d.problem)||null,goal:clean(d.goal)||null,
   marketing_channel:['instagram','marketplace','website'].includes(d.marketing_channel)?d.marketing_channel:null,
   marketing_tone:['friendly','professional','direct'].includes(d.marketing_tone)?d.marketing_tone:null,
   calculator:{materials:number(calc.materials),packaging:number(calc.packaging),shipping:number(calc.shipping),fees:number(calc.fees),other:number(calc.other),hours:number(calc.hours),rate:number(calc.rate),overhead:number(calc.overhead),margin:number(calc.margin)}
  };
 }
 function applyData(data){
  let count=0;const put=(id,v)=>{if(set(id,v))count++};
  const old=readProject(),project={...old};
  ['name','product','customer','location','price','budget','benefit','problem','goal','channels'].forEach(k=>{if(has(data[k]))project[k]=data[k]});
  localStorage.setItem(PROJECT_KEY,JSON.stringify(project));
  window.dispatchEvent(new CustomEvent('businessai:project-updated',{detail:{project,source:'ai-apply-all'}}));
  put('ws-name',data.name);put('ws-product',data.product);put('ws-customer',data.customer);put('ws-location',data.location);put('ws-price',data.price);
  put('idea-product',data.product);put('idea-customer',data.customer);put('idea-problem',data.problem);put('idea-price',data.price);put('idea-advantage',data.benefit);
  put('market-business',data.product);put('market-location',data.location);put('market-customer',data.customer);put('market-price',data.price);put('market-advantage',data.benefit);
  put('plan-name',data.name);put('plan-idea',data.product);put('plan-customer',data.customer);put('plan-market',data.location);put('plan-price',data.price);put('plan-sales',data.sales_target);put('plan-budget',data.budget);put('plan-channels',data.channels);put('plan-advantage',data.benefit);put('plan-goal',data.goal);
  put('marketing-product',data.product);put('marketing-customer',data.customer);put('marketing-price',data.price);put('marketing-benefit',data.benefit);put('marketing-channel',data.marketing_channel);put('marketing-tone',data.marketing_tone);
  put('documents-business',data.name);put('documents-product',data.product);put('documents-price',data.price);put('documents-details',data.benefit);
  const c=data.calculator||{};put('calc-materials',c.materials);put('calc-packaging',c.packaging);put('calc-shipping',c.shipping);put('calc-fees',c.fees);put('calc-other',c.other);put('calc-hours',c.hours);put('calc-rate',c.rate);if(c.overhead!==null&&c.overhead>=0&&c.overhead<100)put('calc-overhead',c.overhead);if(c.margin!==null&&c.margin>=0&&c.margin<100)put('calc-margin',c.margin);
  window.dispatchEvent(new CustomEvent('businessai:ai-applied-all',{detail:{data,project,count}}));
  return count;
 }
 async function extract(question,answer){
  const prompt=`Extract structured business data from the user's question and the AI answer below. Return ONLY valid JSON with EXACTLY these keys and no Markdown:\n{"name":null,"product":null,"customer":null,"location":null,"budget":null,"price":null,"sales_target":null,"channels":null,"benefit":null,"problem":null,"goal":null,"marketing_channel":null,"marketing_tone":null,"calculator":{"materials":null,"packaging":null,"shipping":null,"fees":null,"other":null,"hours":null,"rate":null,"overhead":null,"margin":null}}\nRules: use JSON numbers with a dot and no currency symbols. Use null when a value is not stated or cannot be inferred reliably. name may be a short practical working title derived from the offer. price must be one clearly recommended selling price; if only a range exists, use null. calculator costs are PER ONE ORDER/UNIT only; NEVER put startup budget items there. marketing_channel must be instagram, marketplace, website or null. marketing_tone must be friendly, professional, direct or null. Do not translate the JSON keys.\nUSER QUESTION:\n${String(question||'').slice(0,550)}\nAI ANSWER:\n${String(answer||'').slice(0,2550)}`;
  const response=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:prompt,module:'structured-extraction',lang:lang(),project:readProject()})});
  let body=null;try{body=await response.json()}catch(_){body=null}
  if(!response.ok)throw new Error([`HTTP ${response.status}`,body?.status?`provider ${body.status}`:'',body?.error||''].filter(Boolean).join(' · '));
  if(!body||typeof body.answer!=='string'||!body.answer.trim())throw new Error('Invalid structured response');
  return normalize(parseJson(body.answer));
 }
 async function run(button){
  const body=result.querySelector('.ai-response-text'),answer=body?.innerText?.trim()||'',question=input.value.trim();if(!answer)return;
  const key=hash(question+'\n'+answer),cache=readCache();button.disabled=true;button.textContent='⏳ '+t().working;status(t().working);
  try{let data=cache[key]?.data?normalize(cache[key].data):null;if(!data){data=await extract(question,answer);writeCache(key,data)}const count=applyData(data);status(`${t().done} (${count})`);button.textContent='✓ '+t().again}
  catch(error){console.warn('[BusinessAI apply all]',error);status(`${t().error} ${error?.message||''}`.trim(),true);button.textContent='✨ '+t().apply}
  finally{button.disabled=false}
 }
 function ensure(){
  const actions=result.querySelector('.ai-workflow-actions');if(!actions)return;
  let button=actions.querySelector('[data-ai-action="apply-all"]');if(!button){button=document.createElement('button');button.type='button';button.className='ai-apply-all';button.dataset.aiAction='apply-all';actions.prepend(button);button.addEventListener('click',()=>run(button))}
  if(!button.disabled&&!button.textContent.startsWith('✓'))button.textContent='✨ '+t().apply;
 }
 const observer=new MutationObserver(()=>ensure());observer.observe(result,{childList:true,subtree:true});
 window.addEventListener('businessai:language-changed',()=>setTimeout(ensure,0));document.addEventListener('click',e=>{if(e.target.closest('[data-lang]'))setTimeout(ensure,250)});
 const style=document.createElement('style');style.textContent='.ai-apply-status{margin-top:10px;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:#081625;color:var(--muted);font-size:.9rem}.ai-apply-status[data-error="1"]{color:#ffb4b4}.ai-apply-all:disabled{opacity:.65;cursor:wait}';document.head.appendChild(style);
 ensure();
})();