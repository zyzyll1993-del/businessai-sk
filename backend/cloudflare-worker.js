const SYSTEM_PROMPTS={
 sk:'Si BusinessAI.SK, praktický AI pomocník pre malých podnikateľov a živnostníkov na Slovensku. Odpovedaj po slovensky, stručne, konkrétne a po krokoch. Nevymýšľaj si trhové dáta, ceny, zákony ani daňové povinnosti. Ak chýbajú aktuálne údaje, jasne to povedz. Pri právnych, daňových a finančných témach pripomeň potrebu overenia u odborníka.',
 uk:'Ти BusinessAI.SK — практичний AI-помічник для малого бізнесу та підприємців у Словаччині. Відповідай українською, конкретно й практично. Не вигадуй ринкові дані, ціни, закони чи податкові вимоги. Якщо потрібні актуальні дані — прямо скажи про це. Для юридичних, податкових і фінансових питань рекомендуй перевірку у фахівця.',
 en:'You are BusinessAI.SK, a practical AI assistant for small businesses and sole traders in Slovakia. Answer in English, clearly and actionably. Do not invent market data, prices, laws, tax obligations, or live facts. Say when current data must be verified. For legal, tax, or financial matters, recommend professional verification.'
};
function cors(origin,allowed){const ok=!allowed||allowed==='*'||origin===allowed;return {'Access-Control-Allow-Origin':ok?origin||'*':'null','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate, max-age=0','Pragma':'no-cache','Expires':'0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}}
function json(body,status,headers){return new Response(JSON.stringify(body),{status,headers})}
function outputText(data){if(typeof data?.output_text==='string')return data.output_text;const parts=[];for(const item of data?.output||[]){for(const c of item?.content||[]){if(typeof c?.text==='string')parts.push(c.text)}}return parts.join('\n').trim()}
function luhn(value){const digits=String(value).replace(/\D/g,'');if(digits.length<13||digits.length>19)return false;let sum=0,alt=false;for(let i=digits.length-1;i>=0;i--){let n=Number(digits[i]);if(alt){n*=2;if(n>9)n-=9}sum+=n;alt=!alt}return sum%10===0}
function sanitizeText(value){let text=String(value??'');text=text.replace(/\b(?:sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g,'[SECRET_REMOVED]');text=text.replace(/\b(password|heslo|пароль|api[_ -]?key|secret|token)\s*[:=]\s*[^\s,;]+/gi,'$1: [SECRET_REMOVED]');text=text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[EMAIL_REMOVED]');text=text.replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]){11,30}\b/gi,m=>{const compact=m.replace(/\s/g,'');return compact.length>=15&&compact.length<=34?'[IBAN_REMOVED]':m});text=text.replace(/\b\d{6}\/?\d{3,4}\b/g,'[PERSONAL_ID_REMOVED]');text=text.replace(/\b(?:\d[ -]*?){13,19}\b/g,m=>luhn(m)?'[CARD_REMOVED]':m);text=text.replace(/(?:\+|00)?\d(?:[\s().-]*\d){7,14}/g,m=>{const digits=m.replace(/\D/g,'');return digits.length>=8&&digits.length<=15?'[PHONE_REMOVED]':m});return text}
function safeProject(value){if(!value||typeof value!=='object'||Array.isArray(value))return'';const out={};for(const key of ['name','product','customer','location','price']){const v=value[key];if(v===undefined||v===null)continue;out[key]=typeof v==='string'?sanitizeText(v).slice(0,600):v}return JSON.stringify(out).slice(0,2500)}
export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'';const headers=cors(origin,env.ALLOWED_ORIGIN||'*');
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return json({error:'Method not allowed'},405,headers);
 if(env.ALLOWED_ORIGIN&&env.ALLOWED_ORIGIN!=='*'&&origin!==env.ALLOWED_ORIGIN)return json({error:'Origin not allowed'},403,headers);
 if(!env.OPENAI_API_KEY)return json({error:'AI backend is not configured'},503,headers);
 let body;try{body=await request.json()}catch(_){return json({error:'Invalid JSON'},400,headers)}
 const question=sanitizeText(String(body?.question||'').trim()).slice(0,4000);if(!question)return json({error:'Question is required'},400,headers);
 const lang=['sk','uk','en'].includes(body?.lang)?body.lang:'sk';
 const module=sanitizeText(String(body?.module||'')).slice(0,200);const project=safeProject(body?.project);
 const userContext=[module&&`Selected module: ${module}`,project&&`Saved business workspace: ${project}`,`User request: ${question}`].filter(Boolean).join('\n\n');
 let upstream;try{upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-5.6-luna',input:[{role:'system',content:[{type:'input_text',text:SYSTEM_PROMPTS[lang]}]},{role:'user',content:[{type:'input_text',text:userContext}]}],max_output_tokens:1200})})}catch(_){return json({error:'AI provider unavailable'},502,headers)}
 let data;try{data=await upstream.json()}catch(_){data=null}
 if(!upstream.ok)return json({error:'AI provider error',status:upstream.status},502,headers);
 const answer=outputText(data);if(!answer)return json({error:'Empty AI response'},502,headers);
 return json({answer},200,headers)
}};