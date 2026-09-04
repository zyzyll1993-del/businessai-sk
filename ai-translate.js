(()=>{
 const result=document.querySelector('#result'),input=document.querySelector('#business-input');
 if(!result||!input)return;
 const HISTORY_KEY='businessai-ai-history';
 const supported=['sk','uk','en'];
 let timer=null,requestSeq=0;
 const endpoint=()=>String(window.BUSINESSAI_AI_ENDPOINT||localStorage.getItem('businessai-ai-endpoint')||'https://businessai-api.zyzyll1993.workers.dev/').trim();
 const lang=()=>{const v=localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';return supported.includes(v)?v:'sk'};
 const labels={
  sk:{loading:'Prekladám AI odpoveď…',error:'Preklad sa nepodaril. Zobrazuje sa posledná dostupná verzia.'},
  uk:{loading:'Перекладаю AI-відповідь…',error:'Не вдалося перекласти. Показано останню доступну версію.'},
  en:{loading:'Translating AI response…',error:'Translation failed. Showing the last available version.'}
 };
 const targetNames={sk:'Slovak',uk:'Ukrainian',en:'English'};
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
  const lines=String(text??'').replace(/\r\n?/g,'\n').split('\n'),out=[];let i=0;
  while(i<lines.length){const line=lines[i];if(!line.trim()){i++;continue}
   const heading=line.match(/^(#{1,4})\s+(.+)$/);if(heading){const level=Math.min(4,heading[1].length+1);out.push(`<h${level}>${inline(heading[2])}</h${level}>`);i++;continue}
   if(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)){out.push('<hr>');i++;continue}
   if(line.includes('|')&&isTableDivider(lines[i+1]||'')){const head=tableCells(line);i+=2;const rows=[];while(i<lines.length&&lines[i].trim()&&lines[i].includes('|')&&!isTableDivider(lines[i])){rows.push(tableCells(lines[i]));i++}const width=Math.max(head.length,...rows.map(r=>r.length),1);while(head.length<width)head.push('');rows.forEach(r=>{while(r.length<width)r.push('')});out.push(`<div class="ai-table-wrap"><table><thead><tr>${head.map(c=>`<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue}
   if(/^\s*[-*+]\s+/.test(line)){const items=[];while(i<lines.length){const m=lines[i].match(/^\s*[-*+]\s+(.+)$/);if(!m)break;items.push(m[1]);i++}out.push(`<ul>${items.map(x=>`<li>${inline(x)}</li>`).join('')}</ul>`);continue}
   if(/^\s*\d+[.)]\s+/.test(line)){const items=[];while(i<lines.length){const m=lines[i].match(/^\s*\d+[.)]\s+(.+)$/);if(!m)break;items.push(m[1]);i++}out.push(`<ol>${items.map(x=>`<li>${inline(x)}</li>`).join('')}</ol>`);continue}
   if(/^\s*>\s?/.test(line)){const parts=[];while(i<lines.length){const m=lines[i].match(/^\s*>\s?(.*)$/);if(!m)break;parts.push(m[1]);i++}out.push(`<blockquote>${parts.map(inline).join('<br>')}</blockquote>`);continue}
   const p=[];while(i<lines.length&&lines[i].trim()&&!isBlockStart(lines,i)){p.push(lines[i]);i++}if(!p.length){p.push(lines[i]);i++}out.push(`<p>${p.map(inline).join('<br>')}</p>`)}
  return out.join('');
 }
 function readHistory(){try{const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(h)?h:[]}catch(_){return[]}}
 function locate(){const h=readHistory();if(!h.length)return null;const q=input.value.trim();let index=h.findIndex(x=>x&&x.question===q);if(index<0)index=0;return{history:h,index,item:h[index]}}
 function persist(found,translations){found.history[found.index]={...found.item,translations};localStorage.setItem(HISTORY_KEY,JSON.stringify(found.history));window.dispatchEvent(new CustomEvent('businessai:ai-history-changed'))}
 function status(text,isError=false){let el=result.querySelector('.ai-translation-status');if(!el){el=document.createElement('div');el.className='ai-translation-status';const badge=result.querySelector('.ai-response-badge');badge?.insertAdjacentElement('afterend',el)}if(el){el.textContent=text;el.dataset.error=isError?'1':'0'}}
 function clearStatus(){result.querySelector('.ai-translation-status')?.remove()}
 function paint(text){const body=result.querySelector('.ai-response-text');if(!body)return false;body.innerHTML=markdown(text);clearStatus();return true}
 function chunks(text,max=2800){const blocks=String(text||'').split(/\n{2,}/),out=[];let current='';const push=()=>{if(current.trim()){out.push(current.trim());current=''}};for(const block of blocks){if(block.length>max){push();const lines=block.split('\n');let part='';for(const line of lines){if((part+'\n'+line).length>max){if(part.trim())out.push(part.trim());if(line.length>max){for(let i=0;i<line.length;i+=max)out.push(line.slice(i,i+max)) ;part=''}else part=line}else part+=(part?'\n':'')+line}if(part.trim())out.push(part.trim());continue}const candidate=current?current+'\n\n'+block:block;if(candidate.length>max){push();current=block}else current=candidate}push();return out.length?out:['']}
 async function translateChunk(text,target){const prompt=`Translate ONLY the text below into ${targetNames[target]}. Preserve all Markdown formatting, headings, bullet lists, numbered lists, tables, numbers, euro amounts, names and meaning. Do not summarize, explain, add facts or add commentary. Return only the translated text.\n\nTEXT:\n${text}`;const response=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:prompt,module:'translation',lang:target,project:null})});let data=null;try{data=await response.json()}catch(_){data=null}if(!response.ok)throw new Error([`HTTP ${response.status}`,data?.status?`provider ${data.status}`:'',data?.error||''].filter(Boolean).join(' · '));if(!data||typeof data.answer!=='string'||!data.answer.trim())throw new Error('Invalid translation response');return data.answer.trim()}
 async function translateVisible(target){
  const seq=++requestSeq,found=locate();if(!found||!found.item?.answer)return;
  const item=found.item,source=item.lang&&supported.includes(item.lang)?item.lang:null,translations={...(item.translations||{})};if(source&&!translations[source])translations[source]=item.answer;
  if(translations[target]){setTimeout(()=>{if(seq===requestSeq&&lang()===target)paint(translations[target])},0);return}
  if(source===target||(!source&&target===(item.lang||target))){translations[target]=item.answer;persist(found,translations);setTimeout(()=>{if(seq===requestSeq&&lang()===target)paint(item.answer)},0);return}
  status((labels[target]||labels.sk).loading);
  try{const translated=[];for(const part of chunks(item.answer)){if(seq!==requestSeq)return;translated.push(await translateChunk(part,target))}if(seq!==requestSeq)return;const text=translated.join('\n\n');translations[target]=text;persist(found,translations);if(lang()===target)paint(text)}catch(error){console.warn('[BusinessAI translation]',error);if(seq===requestSeq)status(`${(labels[target]||labels.sk).error} ${error?.message||''}`.trim(),true)}
 }
 function schedule(target=lang()){clearTimeout(timer);timer=setTimeout(()=>{if(result.dataset.ai==='1'||result.querySelector('.ai-response-text'))translateVisible(target)},180)}
 window.addEventListener('businessai:language-changed',event=>{const target=event.detail?.lang||lang();if(supported.includes(target))schedule(target)});
 document.addEventListener('click',event=>{const btn=event.target.closest('[data-lang]');if(btn&&supported.includes(btn.dataset.lang))schedule(btn.dataset.lang)},false);
 const style=document.createElement('style');style.textContent='.ai-translation-status{margin:10px 0 4px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:#081625;color:var(--muted);font-size:.88rem}.ai-translation-status[data-error="1"]{color:#ffb4b4}';document.head.appendChild(style);
})();