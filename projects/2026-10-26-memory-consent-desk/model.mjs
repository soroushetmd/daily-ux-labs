export const PROPOSALS = [
  { id:"language", label:"Preferred explanation language", value:"Plain English", purpose:"Use clearer language in future explanations.", sensitivity:"Low", defaultDuration:"30-days" },
  { id:"location", label:"Current city", value:"Ottawa", purpose:"Make local recommendations more relevant.", sensitivity:"Medium", defaultDuration:"session" },
  { id:"health", label:"Health-related context", value:"Avoid storing this detail", purpose:"Personalize wellbeing suggestions.", sensitivity:"High", defaultDuration:"session" }
];

export const DURATIONS={ session:"Until this session ends", "30-days":"30 days", indefinite:"Until I delete it" };

export function createReview(proposals=PROPOSALS){
  return proposals.map(item=>({...item,status:"pending",duration:item.defaultDuration}));
}

export function decide(items,id,status,duration){
  if(!["approved","rejected"].includes(status)) throw new TypeError("Unknown decision.");
  if(status==="approved"&&!DURATIONS[duration]) throw new TypeError("Choose a valid duration.");
  return items.map(item=>item.id===id?{...item,status,duration:status==="rejected"?null:duration}:item);
}

export function summary(items){
  return items.reduce((result,item)=>({...result,[item.status]:result[item.status]+1}),{pending:0,approved:0,rejected:0});
}

export function consentReceipt(items,createdAt=new Date().toISOString()){
  if(items.some(item=>item.status==="pending")) throw new Error("Review every proposal before exporting.");
  return {
    schema:"memory-consent-receipt/v1",createdAt,
    notice:"Prototype receipt using fictional data. It does not connect to an AI system.",
    decisions:items.map(({id,label,value,purpose,sensitivity,status,duration})=>({id,label,value,purpose,sensitivity,status,duration,durationLabel:duration?DURATIONS[duration]:null}))
  };
}
