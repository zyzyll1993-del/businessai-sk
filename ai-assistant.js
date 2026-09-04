(()=>{
 const form=document.querySelector('#business-form'),input=document.querySelector('#business-input'),result=document.querySelector('#result');
 if(!form||!input||!result)return;
 const HISTORY_KEY='businessai-ai-history';
 const PROJECT_KEY='businessai-project';
 let currentAI=null,restoreTimer=null;
 const endpoint=()=>String(window.BUSINESSAI_AI_ENDPOINT||localStorage.getItem('businessai-ai-endpoint')||'https://businessai-api.zyzyll1993.workers.dev/').trim();
 const lang=()=>{const v=localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';return ['sk','uk','en'].includes(v)?v:'sk'};
 const copy={
  sk:{loading:'BusinessAI premýšľa…',error:'AI služba je momentálne nedostupná.',badge:'AI odpoveď',code:'Kód chyby',save:'Uložiť do projektu',saved:'Uložené v projekte',market:'Overiť trh',price:'Vypočítať cenu',plan:'Preniesť do biznis plánu',marketing:'Vytvoriť marketing',history:'História AI',historyEmpty:'Zatiaľ bez uložených analýz',prefilled:'Údaje z projektu boli predvyplnené.'},
  uk:{loading:'BusinessAI думає…',error:'AI-сервіс зараз недоступний.',badge:'AI-відповідь',code:'Код помилки',save:'Зберегти в проєкт',saved:'Збережено в проєкті',market:'Перевірити ринок',price:'Розрахувати ціну',plan:'Перенести в бізнес-план',marketing:'Створити маркетинг',history:'Історія AI',historyEmpty:'Поки немає збережених аналізів',prefilled:'Дані з проєкту автоматично заповнено.'},
  en:{loading:'BusinessAI is thinking…',error:'The AI service is currently unavailable.',badge:'AI response',code:'Error code',save:'Save to project',saved:'Saved to project',market:'Validate market',price:'Calculate price',plan:'Send to business plan',marketing:'Create marketing',history:'AI history',historyEmpty:'No saved analyses yet',prefilled:'Project data has been prefilled.'}
 };
 const t=()=>copy[lang()]||copy.sk;
 const esc=value=>{const div=document.createElement('div');div.textContent=String(value??'');return div.innerHTML};
 const inline=value=>esc(value)
  .replace(/`([^`]+)`/g,'<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
  .replace(/__([^_]+)__/g,'<strong>$1</strong>')
  .replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
 const tableCells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
 const isTableDivider=line=>/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
 const isBlockStart=(lines,i)=>{const line=lines[i]||'',next=lines[i+1]||'';return /^#{1,4}\s+/.test(line)||/^\s*[-*+]\s+/.test(line)||/^\s*\d+[.)]\s+/.test(line)||/^\s*>\s?/.test(line)||/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)||(line.includes('|')&&isTableDivider(next))};
 function markdown(text){
  const lines=String(text??'').replace(/\r\n?/g,'\n').split('\n'),out=[];
  let i=0;
  while(i<lines.length){
   const line=lines[i];
   if(!line.trim()){i++;continue}
   const heading=line.match(/^(#{1,4})\s+(.+)$/);
   if(heading){const level=Math.min(4,heading[1].length+1);out.push(`<h${level}>${inline(heading[2])}</h${level}>`);i++;continue}
   if(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)){out.push('<hr>');i++;continue}
   if(line.includes('|')&&isTableDivider(lines[i+1]||'')){
    const head=tableCells(line);i+=2;const rows=[];
    while(i<lines.length&&lines[i].trim()&&lines[i].includes('|')&&!isTableDivider(lines[i])){rows.push(tableCells(lines[i]));i++}
    const width=Math.max(head.length,...rows.map(r=>r.length),1);
    while(head.length<width)head.push('');rows.forEach(r=>{while(r.length<width)r.push('')});
    out.push(`<div class="ai-table-wrap"><table><thead><tr>${head.map(c=>`<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue
   }
   if(/^\s*[-*+]\s+/.test(line)){
    const items=[];while(i<lines.length){const m=lines[i].match(/^\s*[-*+]\s+(.+)$/);if(!m)break;items.push(m[1]);i++}out.push(`<ul>${items.map(x=>`<li>${inline(x)}</li>`).join('')}</ul>`);continue
   }
   if(/^\s*\d+[.)]\s+/.test(line)){
    const items=[];while(i<lines.length){const m=lines[i].match(/^\s*\d+[.)]\s+(.+)$/);if(!m)break;items.push(m[1]);i++}out.push(`<ol>${items.map(x=>`<li>${inline(x)}</li>`).join('')}</ol>`);continue
   }
   if(/^\s*>\s?/.test(line)){
    const parts=[];while(i<lines.length){const m=lines[i].match(/^\s*>\s?(.*)$/);if(!m)break;parts.push(m[1]);i++}out.push(`<blockquote>${parts.map(inline).join('<br>')}</blockquote>`);continue
   }
   const p=[];while(i<lines.length&&lines[i].trim()&&!isBlockStart(lines,i)){p.push(lines[i]);i++}if(!p.length){p.push(lines[i]);i++}out.push(`<p>${p.map(inline).join('<br>')}</p>`);
  }
  return out.join('');
 }
 const readProject=()=>{try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'{}')||{}}catch(_){return{}}};
 const readHistory=()=>{try{const x=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
 const saveHistory=item=>{const h=readHistory();const dupe=h.find(x=>x.question===item.question&&x.answer===item.answer);if(!dupe)h.unshift(item);localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(0,20)));window.dispatchEvent(new CustomEvent('businessai:ai-history-changed'))};
 const setField=(id,value,force=false)=>{const el=document.querySelector('#'+id);if(!el||value===undefined||value===null||String(value).trim()==='')return;if(force||!el.value){el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}};
 const inferLocation=text=>{const cities=['Bratislava','Košice','Prešov','Žilina','Nitra','Banská Bystrica','Trnava','Trenčín','Martin','Poprad','Prievidza','Zvolen','Považská Bystrica','Nové Zámky','Michalovce','Spišská Nová Ves','Komárno','Levice','Humenné','Bardejov','Liptovský Mikuláš'];return cities.find(city=>text.toLocaleLowerCase().includes(city.toLocaleLowerCase()))||''};
 function mergeProject(structured,question){
  const old=readProject(),src=structured&&typeof structured==='object'?structured:{};
  const next={...old};
  ['name','product','customer','location','price'].forEach(k=>{const v=src[k];if(v!==undefined&&v!==null&&String(v).trim()&&!next[k])next[k]=String(v).trim()});
  if(!next.location){const city=inferLocation(question);if(city)next.location=city}
  localStorage.setItem(PROJECT_KEY,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('businessai:project-updated'));
  return next;
 }
 function prefill(tab,question,structured){
  const p=mergeProject(structured,question);
  if(tab==='market'){
   setField('market-business',p.product);setField('market-location',p.location);setField('market-customer',p.customer);setField('market-price',p.price);
  }else if(tab==='plan'){
   setField('plan-name',p.name);setField('plan-idea',p.product);setField('plan-customer',p.customer);setField('plan-market',p.location);setField('plan-price',p.price);setField('plan-goal',question);
  }else if(tab==='marketing'){
   setField('marketing-product',p.product);setField('marketing-customer',p.customer);setField('marketing-price',p.price);setField('marketing-benefit',structured?.benefit||structured?.advantage||'');
  }
  window.BusinessAITabs?.open?.(tab);
 }
 function historyHtml(){
  const c=t(),h=readHistory().slice(0,5);
  if(!h.length)return `<details class="ai-history"><summary>${c.history}</summary><p class="ai-history-empty">${c.historyEmpty}</p></details>`;
  return `<details class="ai-history"><summary>${c.history}</summary><div class="ai-history-list">${h.map((x,i)=>`<button type="button" class="ai-history-item" data-ai-history="${i}"><strong>${esc(x.question).slice(0,110)}</strong><span>${new Date(x.createdAt).toLocaleString()}</span></button>`).join('')}</div></details>`;
 }
 function bindActions(question,answer,structured){
  result.querySelector('[data-ai-action="save"]')?.addEventListener('click',e=>{mergeProject(structured,question);saveHistory({question,answer,structured:structured||null,createdAt:new Date().toISOString(),lang:lang()});e.currentTarget.textContent='✓ '+t().saved});
  result.querySelector('[data-ai-action="market"]')?.addEventListener('click',()=>prefill('market',question,structured));
  result.querySelector('[data-ai-action="price"]')?.addEventListener('click',()=>{mergeProject(structured,question);window.BusinessAITabs?.open?.('price')});
  result.querySelector('[data-ai-action="plan"]')?.addEventListener('click',()=>prefill('plan',question,structured));
  result.querySelector('[data-ai-action="marketing"]')?.addEventListener('click',()=>prefill('marketing',question,structured));
  const h=readHistory().slice(0,5);result.querySelectorAll('[data-ai-history]').forEach(btn=>btn.addEventListener('click',()=>{const item=h[Number(btn.dataset.aiHistory)];if(item){input.value=item.question;render(item.answer,item.question,item.structured,false)}}));
 }
 function render(text,question=input.value.trim(),structured=null,store=true,scroll=true){
  const c=t();currentAI={question,answer:text,structured:structured||null};if(store)saveHistory({question,answer:text,structured:structured||null,createdAt:new Date().toISOString(),lang:lang()});
  result.hidden=false;result.dataset.ai='1';
  result.innerHTML=`<div class="ai-response-badge">✨ ${c.badge}</div><div class="ai-response-text">${markdown(text)}</div><div class="ai-workflow-actions"><button type="button" data-ai-action="save">💾 ${c.save}</button><button type="button" data-ai-action="market">🔎 ${c.market}</button><button type="button" data-ai-action="price">€ ${c.price}</button><button type="button" data-ai-action="plan">📊 ${c.plan}</button><button type="button" data-ai-action="marketing">📣 ${c.marketing}</button></div>${historyHtml()}`;
  bindActions(question,text,structured);if(scroll)result.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 function scheduleRestore(){
  if(result.dataset.ai!=='1')return;
  const snapshot=currentAI||readHistory()[0];if(!snapshot||!snapshot.answer)return;
  clearTimeout(restoreTimer);restoreTimer=setTimeout(()=>{input.value=snapshot.question||input.value;render(snapshot.answer,snapshot.question||input.value,snapshot.structured||null,false,false)},0);
 }
 document.addEventListener('click',event=>{if(event.target.closest('[data-lang]'))scheduleRestore()},true);
 window.addEventListener('businessai:language-changed',scheduleRestore);
 const style=document.createElement('style');style.textContent=`
 .ai-response-text{line-height:1.58;overflow-wrap:anywhere}.ai-response-text h2,.ai-response-text h3,.ai-response-text h4,.ai-response-text h5{margin:24px 0 10px;line-height:1.25;color:var(--text)}.ai-response-text h2{font-size:1.45rem}.ai-response-text h3{font-size:1.25rem}.ai-response-text h4,.ai-response-text h5{font-size:1.08rem}.ai-response-text p{margin:10px 0}.ai-response-text ul,.ai-response-text ol{margin:10px 0 16px;padding-left:24px}.ai-response-text li{margin:5px 0}.ai-response-text strong{color:var(--text)}.ai-response-text code{background:#071320;border:1px solid var(--line);border-radius:6px;padding:2px 5px;font-size:.92em}.ai-response-text blockquote{margin:14px 0;padding:10px 14px;border-left:3px solid var(--accent);background:#091727;color:var(--muted);border-radius:0 10px 10px 0}.ai-response-text hr{border:0;border-top:1px solid var(--line);margin:22px 0}.ai-table-wrap{width:100%;overflow-x:auto;margin:14px 0 20px;border:1px solid var(--line);border-radius:12px}.ai-response-text table{width:100%;border-collapse:collapse;min-width:480px;background:#081625}.ai-response-text th,.ai-response-text td{padding:10px 12px;border-bottom:1px solid var(--line);border-right:1px solid var(--line);text-align:left;vertical-align:top}.ai-response-text th:last-child,.ai-response-text td:last-child{border-right:0}.ai-response-text tbody tr:last-child td{border-bottom:0}.ai-response-text th{background:#0b1a2c;color:var(--text)}
 .ai-workflow-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}.ai-workflow-actions button{border:1px solid var(--line);background:#0b1a2c;color:var(--text);border-radius:11px;padding:10px 12px;font:inherit;font-weight:700;cursor:pointer}.ai-workflow-actions button:first-child{background:var(--accent);color:#07111f;border-color:var(--accent)}.ai-history{margin-top:16px;border-top:1px solid var(--line);padding-top:13px}.ai-history summary{cursor:pointer;font-weight:700;color:var(--muted)}.ai-history-list{display:grid;gap:8px;margin-top:10px}.ai-history-item{display:flex;justify-content:space-between;gap:12px;text-align:left;border:1px solid var(--line);background:#081625;color:var(--text);border-radius:10px;padding:10px;cursor:pointer}.ai-history-item span{font-size:.78rem;color:var(--muted);white-space:nowrap}.ai-history-empty{color:var(--muted)}@media(max-width:600px){.ai-workflow-actions button{width:100%}.ai-history-item{display:block}.ai-history-item span{display:block;margin-top:4px}.ai-table-wrap{margin-left:0;margin-right:0}}
 `;document.head.appendChild(style);
 const showError=detail=>{const c=t();console.warn('[BusinessAI AI]',detail);const extra=detail?`<br><small>${esc(c.code)}: ${esc(detail)}</small>`:'';result.hidden=false;result.dataset.ai='0';currentAI=null;result.innerHTML=`<p>${esc(c.error)}${extra}</p>${historyHtml()}`;result.scrollIntoView({behavior:'smooth',block:'nearest'})};
 form.addEventListener('submit',async event=>{
  const url=endpoint();if(!url)return;event.preventDefault();event.stopImmediatePropagation();
  const question=input.value.trim();if(!question)return;
  const c=t(),button=form.querySelector('button[type="submit"]'),original=button?.textContent;if(button){button.disabled=true;button.textContent=c.loading}result.hidden=false;result.innerHTML=`<p>${esc(c.loading)}</p>`;
  try{
   const module=document.querySelector('#selected-module')?.textContent?.trim()||'',project=readProject();
   const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,module,lang:lang(),project})});
   let data=null;try{data=await response.json()}catch(_){data=null}
   if(!response.ok){const provider=data?.status?`provider ${data.status}`:'',message=data?.error||'';throw new Error([`HTTP ${response.status}`,provider,message].filter(Boolean).join(' · '))}
   if(!data||typeof data.answer!=='string'||!data.answer.trim())throw new Error('Invalid response');
   render(data.answer.trim(),question,data.project||data.business||null,true);
  }catch(error){showError(error?.message||String(error))}
  finally{if(button){button.disabled=false;button.textContent=original}}
 },true);
})();