(()=>{
 const form=document.querySelector('#business-form'),input=document.querySelector('#business-input'),result=document.querySelector('#result');
 if(!form||!input||!result)return;
 const endpoint=()=>String(window.BUSINESSAI_AI_ENDPOINT||localStorage.getItem('businessai-ai-endpoint')||'https://businessai-api.zyzyll1993.workers.dev/').trim();
 const lang=()=>localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';
 const copy={
  sk:{loading:'BusinessAI premýšľa…',error:'AI služba je momentálne nedostupná.',badge:'AI odpoveď',code:'Kód chyby'},
  uk:{loading:'BusinessAI думає…',error:'AI-сервіс зараз недоступний.',badge:'AI-відповідь',code:'Код помилки'},
  en:{loading:'BusinessAI is thinking…',error:'The AI service is currently unavailable.',badge:'AI response',code:'Error code'}
 };
 const esc=value=>{const div=document.createElement('div');div.textContent=String(value??'');return div.innerHTML};
 const render=text=>{const t=copy[lang()]||copy.sk;result.hidden=false;result.dataset.ai='1';result.innerHTML=`<div class="ai-response-badge">✨ ${t.badge}</div><div class="ai-response-text">${esc(text).replace(/\n/g,'<br>')}</div>`;result.scrollIntoView({behavior:'smooth',block:'nearest'})};
 const showError=detail=>{const t=copy[lang()]||copy.sk;console.warn('[BusinessAI AI]',detail);const extra=detail?`<br><small>${esc(t.code)}: ${esc(detail)}</small>`:'';result.hidden=false;result.dataset.ai='0';result.innerHTML=`<p>${esc(t.error)}${extra}</p>`;result.scrollIntoView({behavior:'smooth',block:'nearest'})};
 form.addEventListener('submit',async event=>{
  const url=endpoint();
  if(!url)return;
  event.preventDefault();event.stopImmediatePropagation();
  const question=input.value.trim();if(!question)return;
  const t=copy[lang()]||copy.sk,button=form.querySelector('button[type="submit"]'),original=button?.textContent;
  if(button){button.disabled=true;button.textContent=t.loading}
  result.hidden=false;result.innerHTML=`<p>${esc(t.loading)}</p>`;
  try{
   const module=document.querySelector('#selected-module')?.textContent?.trim()||'';
   const project=(()=>{try{return JSON.parse(localStorage.getItem('businessai-project')||'null')}catch(_){return null}})();
   const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,module,lang:lang(),project})});
   let data=null;try{data=await response.json()}catch(_){data=null}
   if(!response.ok){const provider=data?.status?`provider ${data.status}`:'';const message=data?.error||'';throw new Error([`HTTP ${response.status}`,provider,message].filter(Boolean).join(' · '))}
   if(!data||typeof data.answer!=='string'||!data.answer.trim())throw new Error('Invalid response');
   render(data.answer.trim());
  }catch(error){showError(error?.message||String(error))}
  finally{if(button){button.disabled=false;button.textContent=original}}
 },true);
})();