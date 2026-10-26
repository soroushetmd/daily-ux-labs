import{PROPOSALS,DURATIONS,createReview,decide,summary,consentReceipt}from"./model.mjs";

let review=createReview();
const list=document.querySelector("#proposal-list"),status=document.querySelector("#status"),exportButton=document.querySelector("#export");

function render(){
 const counts=summary(review);
 status.textContent=`${counts.approved} approved · ${counts.rejected} rejected · ${counts.pending} awaiting review`;
 exportButton.disabled=counts.pending>0;
 list.innerHTML=review.map(item=>`<article class="memory-card ${item.status}" data-id="${item.id}">
  <div class="card-top"><span class="sensitivity ${item.sensitivity.toLowerCase()}">${item.sensitivity} sensitivity</span><span class="decision">${item.status}</span></div>
  <h3>${item.label}</h3><p class="value">“${item.value}”</p><dl><div><dt>Why requested</dt><dd>${item.purpose}</dd></div><div><dt>Retention</dt><dd><select aria-label="Retention for ${item.label}" ${item.status==="rejected"?"disabled":""}>${Object.entries(DURATIONS).map(([value,label])=>`<option value="${value}" ${item.duration===value?"selected":""}>${label}</option>`).join("")}</select></dd></div></dl>
  <div class="actions"><button data-action="approved" class="approve">Allow memory</button><button data-action="rejected" class="reject">Do not store</button></div>
 </article>`).join("");
}

list.addEventListener("click",event=>{const button=event.target.closest("button[data-action]");if(!button)return;const card=button.closest("[data-id]");const duration=card.querySelector("select").value;review=decide(review,card.dataset.id,button.dataset.action,duration);render();});
list.addEventListener("change",event=>{if(!event.target.matches("select"))return;const card=event.target.closest("[data-id]");const item=review.find(entry=>entry.id===card.dataset.id);if(item.status==="approved")review=decide(review,item.id,"approved",event.target.value);render();});
document.querySelector("#approve-low").addEventListener("click",()=>{review=review.map(item=>item.sensitivity==="Low"&&item.status==="pending"?decide([item],item.id,"approved",item.defaultDuration)[0]:item);render();});
document.querySelector("#reset").addEventListener("click",()=>{review=createReview(PROPOSALS);render();});
exportButton.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(consentReceipt(review),null,2)],{type:"application/json"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"memory-consent-receipt.json"});a.click();URL.revokeObjectURL(a.href);});
render();
