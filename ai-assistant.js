(()=>{
 const form=document.querySelector('#business-form'),input=document.querySelector('#business-input'),result=document.querySelector('#result');
 if(!form||!input||!result)return;
 const endpoint=()=>String(window.BUSINESSAI_AI_ENDPOINT||localStorage.getItem('businessai-ai-endpoint')||'https://businessai-api.zyzyll1993.workers.dev/').trim();
 const lang=()=>localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';
 const copy={
  sk:{loading:'BusinessAI premýšľa…',error:'AI služba je momentálne nedostupná. Použijem lokálny MVP režim.',badge:'AI odpoveď'},
  uk:{loading:'BusinessAI думає…',error:'AI-сервіс зараз недоступний. Використовую локальний MVP-режим.',badge:'AI-відповідь'},
  en:{loading:'BusinessAI is thinking…',error:'The AI service is currently unavailable. Falling back to local MVP mode.',badge:'AI response'}
 };
 const esc=value=>{const div=document.createElement('div');div.textContent=String(value??'');return div.innerHTML};
 const render=(text)=>{const t=copy[lang()]||copy.sk;result.hidden=false;result.dataset.ai='1';result.innerHTML=`<div class="ai-response-badge">✨ ${t.badge}</div><div class="ai-response-text">${esc(text).replace(/\n/g,'<br>')}</div>`;result.scrollIntoView({behavior:'smooth',block:'nearest'})};
 const fallback=(message)=>{const t=copy[lang()]||copy.sk;console.warn('[BusinessAI AI]',message);result.hidden=false;result.innerHTML=`<p>${esc(t.error)}</p>`};
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
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const data=await response.json();
   if(!data||typeof data.answer!=='string'||!data.answer.trim())throw new Error('Invalid response');
   render(data.answer.trim());
  }catch(error){
   fallback(error);
  }finally{
   if(button){button.disabled=false;button.textContent=original}
  }
 },true);
})();