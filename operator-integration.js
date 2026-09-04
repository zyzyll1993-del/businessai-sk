(()=>{
 const supported=['sk','uk','en'];
 const lang=()=>{const v=localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';return supported.includes(v)?v:'sk'};
 const done={sk:'Hotovo',uk:'Готово',en:'Done'};
 function apply(){
  const op=window.BusinessAIOperator;
  if(!op?.complete?.())return;
  const html=op.html?.()||'';
  const privacy=document.querySelector('#privacy-center .privacy-grid .privacy-item:last-child p');
  if(privacy&&html)privacy.innerHTML=html;
  const legal=document.querySelector('#legal-center .legal-operator span');
  if(legal&&html)legal.innerHTML=html;
  const rows=document.querySelectorAll('#legal-center .launch-row');
  const row=rows[4],state=row?.querySelector('.launch-state');
  if(state){state.className='launch-state done';state.textContent=done[lang()]||done.sk}
 }
 const schedule=()=>setTimeout(apply,0);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
 window.addEventListener('businessai:language-changed',schedule);
 const main=document.querySelector('main');
 if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
 window.BusinessAIOperatorApply=apply;
})();
