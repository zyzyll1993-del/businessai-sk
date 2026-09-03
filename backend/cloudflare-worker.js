const SYSTEM_PROMPTS={
 sk:'Si BusinessAI.SK, praktický AI pomocník pre malých podnikateľov a živnostníkov na Slovensku. Odpovedaj po slovensky, stručne, konkrétne a po krokoch. Nevymýšľaj si trhové dáta, ceny, zákony ani daňové povinnosti. Ak chýbajú aktuálne údaje, jasne to povedz. Pri právnych, daňových a finančných témach pripomeň potrebu overenia u odborníka.',
 uk:'Ти BusinessAI.SK — практичний AI-помічник для малого бізнесу та підприємців у Словаччині. Відповідай українською, конкретно й практично. Не вигадуй ринкові дані, ціни, закони чи податкові вимоги. Якщо потрібні актуальні дані — прямо скажи про це. Для юридичних, податкових і фінансових питань рекомендуй перевірку у фахівця.',
 en:'You are BusinessAI.SK, a practical AI assistant for small businesses and sole traders in Slovakia. Answer in English, clearly and actionably. Do not invent market data, prices, laws, tax obligations, or live facts. Say when current data must be verified. For legal, tax, or financial matters, recommend professional verification.'
};
function cors(origin,allowed){const ok=!allowed||allowed==='*'||origin===allowed;return {'Access-Control-Allow-Origin':ok?origin||'*':'null','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Content-Type':'application/json; charset=utf-8'}}
function json(body,status,headers){return new Response(JSON.stringify(body),{status,headers})}
function outputText(data){if(typeof data?.output_text==='string')return data.output_text;const parts=[];for(const item of data?.output||[]){for(const c of item?.content||[]){if(typeof c?.text==='string')parts.push(c.text)}}return parts.join('\n').trim()}
export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'';const headers=cors(origin,env.ALLOWED_ORIGIN||'*');
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return json({error:'Method not allowed'},405,headers);
 if(!env.OPENAI_API_KEY)return json({error:'AI backend is not configured'},503,headers);
 if(env.ALLOWED_ORIGIN&&env.ALLOWED_ORIGIN!=='*'&&origin!==env.ALLOWED_ORIGIN)return json({error:'Origin not allowed'},403,headers);
 let body;try{body=await request.json()}catch(_){return json({error:'Invalid JSON'},400,headers)}
 const question=String(body?.question||'').trim().slice(0,4000);if(!question)return json({error:'Question is required'},400,headers);
 const lang=['sk','uk','en'].includes(body?.lang)?body.lang:'sk';
 const module=String(body?.module||'').slice(0,200);const project=body?.project&&typeof body.project==='object'?JSON.stringify(body.project).slice(0,2500):'';
 const userContext=[module&&`Selected module: ${module}`,project&&`Saved business workspace: ${project}`,`User request: ${question}`].filter(Boolean).join('\n\n');
 const upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-5.6-luna',input:[{role:'system',content:[{type:'input_text',text:SYSTEM_PROMPTS[lang]}]},{role:'user',content:[{type:'input_text',text:userContext}]}],max_output_tokens:1200})});
 let data;try{data=await upstream.json()}catch(_){data=null}
 if(!upstream.ok)return json({error:'AI provider error',status:upstream.status},502,headers);
 const answer=outputText(data);if(!answer)return json({error:'Empty AI response'},502,headers);
 return json({answer},200,headers)
}};