export const ACTIONS=[
 {id:"move-left",label:"Move left",required:true,mode:"press",sharedGroup:"horizontal-axis"},{id:"move-right",label:"Move right",required:true,mode:"press",sharedGroup:"horizontal-axis"},{id:"jump",label:"Jump",required:true,mode:"press"},{id:"interact",label:"Interact",required:true,mode:"hold"},{id:"pause",label:"Pause",required:true,mode:"press"},{id:"map",label:"Open map",required:false,mode:"press"}
];
export const PRESETS={
 standard:{keyboard:{"move-left":"A","move-right":"D",jump:"Space",interact:"E",pause:"Escape",map:"M"},gamepad:{"move-left":"Left stick","move-right":"Left stick",jump:"A",interact:"X",pause:"Menu",map:"View"}},
 "one-hand":{keyboard:{"move-left":"J","move-right":"L",jump:"I",interact:"K",pause:"P",map:"U"},gamepad:{"move-left":"Left stick","move-right":"Left stick",jump:"Left bumper",interact:"Left trigger",pause:"View",map:"D-pad up"}},
 conflict:{keyboard:{"move-left":"A","move-right":"D",jump:"Space",interact:"Space",pause:"",map:"M"},gamepad:{"move-left":"Left stick","move-right":"Left stick",jump:"A",interact:"A",pause:"Menu",map:""}}
};
export function clonePreset(name){if(!PRESETS[name])throw new TypeError("Unknown preset");return structuredClone(PRESETS[name]);}
export function updateBinding(bindings,device,actionId,value){if(!["keyboard","gamepad"].includes(device))throw new TypeError("Unknown device");return{...bindings,[device]:{...bindings[device],[actionId]:value.trim()}};}
function conflictsFor(deviceBindings,actions){const byInput=new Map(),byId=new Map(actions.map(a=>[a.id,a]));for(const[id,input]of Object.entries(deviceBindings)){if(!input)continue;const ids=byInput.get(input)||[];ids.push(id);byInput.set(input,ids)}return[...byInput.entries()].filter(([,ids])=>{if(ids.length<2)return false;const groups=ids.map(id=>byId.get(id)?.sharedGroup).filter(Boolean);return groups.length!==ids.length||new Set(groups).size!==1}).map(([input,ids])=>({input,actions:ids}));}
export function audit(bindings,actions=ACTIONS){
 const findings=[];
 for(const action of actions){const keyboard=bindings.keyboard[action.id]||"",gamepad=bindings.gamepad[action.id]||"";if(action.required&&!keyboard&&!gamepad)findings.push({severity:"blocking",action:action.id,message:`${action.label} has no binding.`});else if(action.required&&(!keyboard||!gamepad))findings.push({severity:"review",action:action.id,message:`${action.label} is missing a ${keyboard?"gamepad":"keyboard"} alternative.`});if(action.mode==="hold")findings.push({severity:"review",action:action.id,message:`${action.label} is hold-only; consider a toggle option.`});}
 for(const device of["keyboard","gamepad"])for(const conflict of conflictsFor(bindings[device],actions))findings.push({severity:"blocking",action:conflict.actions.join(","),message:`${device} input “${conflict.input}” controls ${conflict.actions.length} actions.`});
 return findings;
}
export function summary(findings){return{blocking:findings.filter(f=>f.severity==="blocking").length,review:findings.filter(f=>f.severity==="review").length};}
export function exportReview(bindings,findings,preset){return{schema:"input-access-review/v1",preset,notice:"Synthetic prototype review; validate with players and target hardware.",bindings,findings,summary:summary(findings)};}
