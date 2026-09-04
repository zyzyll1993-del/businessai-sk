(()=>{
 const data={
  legalName:'',
  legalForm:'',
  ico:'',
  address:'',
  email:'',
  country:'Slovakia',
  registered:false,
  commercialReady:false,
  mode:'mvp-testing'
 };
 const clean=v=>String(v??'').trim();
 const esc=v=>clean(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const complete=()=>Boolean(data.registered&&clean(data.legalName)&&clean(data.address)&&clean(data.email));
 function lines(){
  const out=[];
  if(clean(data.legalName))out.push(clean(data.legalName));
  if(clean(data.legalForm))out.push(clean(data.legalForm));
  if(clean(data.ico))out.push(`IČO: ${clean(data.ico)}`);
  if(clean(data.address))out.push(clean(data.address));
  if(clean(data.country))out.push(clean(data.country));
  if(clean(data.email))out.push(clean(data.email));
  return out;
 }
 function html(){return lines().map(esc).join('<br>')}
 window.BusinessAIOperator={...data,complete,lines,html};
})();
