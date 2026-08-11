
const SYSTEM_PROMPT = `
You are the Blackstone AI Concierge for Blackstone Signature Properties & Investments,
an East Bay California real-estate brokerage and property-management company.

Verified facts:
- Broker/Owner: Sal Gharibyar.
- Broker DRE #01418692; Corporate DRE #02117470.
- More than 20 years of experience and 300+ career home sales.
- Service areas include Discovery Bay, Brentwood, Oakley, Antioch, Pittsburg,
  Concord, Bay Point, Byron, Walnut Creek, and nearby East Bay communities.
- Property management is 6% of collected monthly rent; lease-up is one-half month's
  rent; renewal is $300. Third-party costs are separate.

Be professional and concise. Never invent live listings, rates, legal advice,
school ratings, market statistics, or company policies. Recommend contacting Sal
for property-specific and time-sensitive questions.
`;

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});

export async function onRequestOptions(){
  return new Response(null,{status:204,headers});
}

export async function onRequestPost(context){
  const key=context.env.GEMINI_API_KEY || context.env.Gemini_API_KEY;
  if(!key) return respond({error:"GEMINI_API_KEY is missing from this Cloudflare Pages project."},500);

  let input;
  try{input=await context.request.json();}
  catch{return respond({error:"Invalid JSON request."},400);}

  const message=typeof input?.message==="string"?input.message.trim():"";
  if(!message) return respond({error:"A message is required."},400);

  const history=Array.isArray(input.history)?input.history.slice(-10):[];
  const contents=history
    .filter(x=>x&&typeof x.text==="string"&&x.text.trim())
    .map(x=>({
      role:x.role==="model"||x.role==="assistant"?"model":"user",
      parts:[{text:x.text.trim().slice(0,5000)}]
    }));
  contents.push({role:"user",parts:[{text:message.slice(0,8000)}]});

  let response;
  try{
    response=await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method:"POST",
        headers:{"Content-Type":"application/json","x-goog-api-key":key},
        body:JSON.stringify({
          systemInstruction:{parts:[{text:SYSTEM_PROMPT}]},
          contents,
          generationConfig:{maxOutputTokens:700}
        })
      }
    );
  }catch{
    return respond({error:"The AI service could not be reached."},502);
  }

  const raw=await response.text();
  let data={};
  try{data=raw?JSON.parse(raw):{};}
  catch{return respond({error:`Gemini returned unreadable data (${response.status}).`},502);}

  if(!response.ok){
    return respond({error:data?.error?.message||`Gemini returned ${response.status}.`},502);
  }

  const reply=data?.candidates?.[0]?.content?.parts?.map(x=>x?.text||"").join("").trim();
  if(!reply) return respond({error:"The AI returned an empty response."},502);
  return respond({reply});
}

export async function onRequest(){
  return respond({error:"Use POST for this endpoint."},405);
}
