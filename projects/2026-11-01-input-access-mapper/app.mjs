import{ACTIONS,PRESETS,clonePreset,updateBinding,audit,summary,exportReview}from"./model.mjs";
let preset="standard",bindings=clonePreset(preset);
const matrix=document.querySelector("#matrix"),findings=document.querySelector("#findings"),status=document.querySelector("#status"),presetSelect=document.querySelector("#preset");
function render(){
 matrix.innerHTML=ACTIONS.map(a=>`<tr><th scope="row"><strong>${a.label}</strong><small>${a.required?"Required":"Optional"} · ${a.mode}</small></th>${["keyboard","gamepad"].map(device=>`<td><input aria-label="${a.label} ${device} binding" data-device="${device}" data-action="${a.id}" value="${bindings[device][a.id]||""}"></td>`).join("")}</tr>`).join("");
 const issues=audit(bindings),counts=summary(issues);status.textContent=`${counts.blocking} blocking · ${counts.review} review`;
 findings.innerHTML=issues.length?issues.map(f=>`<li class="${f.severity}"><span>${f.severity}</span>${f.message}</li>`).join(""):`<li class="clear"><span>clear</span>No automated signals in this configuration.</li>`;
 document.querySelector("#download").onclick=()=>{const blob=new Blob([JSON.stringify(exportReview(bindings,issues,preset),null,2)],{type:"application/json"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"input-access-review.json"});a.click();URL.revokeObjectURL(a.href)};
}
matrix.addEventListener("change",e=>{if(!e.target.matches("input[data-action]"))return;bindings=updateBinding(bindings,e.target.dataset.device,e.target.dataset.action,e.target.value);preset="custom";presetSelect.value="custom";render()});
presetSelect.addEventListener("change",e=>{if(e.target.value==="custom")return;preset=e.target.value;bindings=clonePreset(preset);render()});
presetSelect.innerHTML=`${Object.keys(PRESETS).map(name=>`<option value="${name}">${name.replace("-"," ")}</option>`).join("")}<option value="custom">custom</option>`;render();
