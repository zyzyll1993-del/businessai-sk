(()=>{
 if(document.querySelector('#businessai-mvp-status'))return;
 const supported=['sk','uk','en'];
 const lang=()=>{const v=localStorage.getItem('businessai-language')||document.documentElement.lang||'sk';return supported.includes(v)?v:'sk'};
 const copy={
  sk:{title:'Testovacia MVP verzia',text:'BusinessAI.SK je momentálne vo vývoji a prevádzkovateľ ešte nemá doplnené finálne právne registračné údaje. Služba preto zatiaľ nie je označená ako pripravená na platený komerčný verejný predaj.',short:'MVP · nie je pripravené na platený verejný predaj'},
  uk:{title:'Тестова MVP-версія',text:'BusinessAI.SK зараз у розробці, а фінальні юридичні реєстраційні дані оператора ще не заповнені. Тому сервіс поки не позначається як готовий до платного комерційного публічного запуску.',short:'MVP · ще не готовий до платного публічного запуску'},
  en:{title:'Testing MVP version',text:'BusinessAI.SK is currently under development and the operator’s final legal registration details have not yet been completed. The service is therefore not currently presented as ready for paid commercial public launch.',short:'MVP · not yet ready for paid public launch'}
 };
 const t=()=>copy[lang()]||copy.sk;
 const banner=document.createElement('div');banner.id='businessai-mvp-status';banner.className='mvp-status-banner';
 const style=document.createElement('style');style.textContent=`.mvp-status-banner{position:relative;z-index:20;border-bottom:1px solid var(--line);background:#2a2110;color:#ffe6a6;padding:9px 18px;text-align:center;font-size:.86rem;font-weight:700;line-height:1.35}.mvp-status-details{max-width:1180px;margin:0 auto;padding:0 24px 12px}.mvp-status-card{border:1px solid #6b5524;background:#201a0d;color:#f4e7bf;border-radius:14px;padding:14px 16px;line-height:1.5}.mvp-status-card strong{display:block;color:#ffe6a6;margin-bottom:4px}@media(max-width:700px){.mvp-status-banner{font-size:.78rem;padding:8px 12px}.mvp-status-details{padding:0 18px 10px}}`;document.head.appendChild(style);
 const details=document.createElement('div');details.className='mvp-status-details';details.innerHTML='<div class="mvp-status-card"></div>';
 function render(){const c=t();banner.textContent=c.short;const card=details.querySelector('.mvp-status-card');if(card)card.innerHTML=`<strong>${c.title}</strong>${c.text}`}
 const header=document.querySelector('.site-header');if(header)header.insertAdjacentElement('afterend',banner);else document.body.prepend(banner);
 const privacy=document.querySelector('#privacy-center');if(privacy)privacy.insertAdjacentElement('beforebegin',details);else (document.querySelector('main')||document.body).appendChild(details);
 render();
 window.addEventListener('businessai:language-changed',render);
 document.querySelectorAll('[data-lang]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(render,0)));
})();
