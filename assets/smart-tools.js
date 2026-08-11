(function(){
  const pages=JSON.parse(localStorage.getItem('bs_pages')||'[]');
  const current=location.pathname.split('/').pop()||'index.html';
  if(!pages.includes(current)) pages.push(current);
  localStorage.setItem('bs_pages',JSON.stringify(pages.slice(-20)));
  const map={"search.html":12,"properties.html":10,"mortgage-calculator.html":8,"buyers.html":7,"sellers.html":9,"home-value.html":12,"property-management.html":9,"rental-evaluation.html":12,"apply.html":10,"contact.html":15,"ai-tools.html":5};
  let score=Math.min(100,10+pages.reduce((s,p)=>s+(map[p]||2),0));
  const scoreEl=document.getElementById('leadScore'); if(scoreEl) scoreEl.textContent=score;
  const label=score<30?'Early research':score<60?'Actively exploring':score<85?'High-interest visitor':'Ready for direct follow-up';
  const labelEl=document.getElementById('leadLabel'); if(labelEl) labelEl.textContent=label;
  const list=document.getElementById('activityList'); if(list) list.innerHTML='<strong>Recent interests:</strong><br>'+pages.slice(-7).map(p=>'• '+p.replace('.html','').replaceAll('-',' ')).join('<br>')+'<p class="privacy-note">This score is a simple browser-based readiness estimate, not an AI decision or credit score.</p>';

  document.querySelectorAll('.lead-capture').forEach(f=>f.addEventListener('submit',()=>{
    localStorage.setItem('bs_lead_submitted','yes');
    let hidden=document.createElement('input'); hidden.type='hidden'; hidden.name='submitted_pacific_time'; hidden.value=new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'}); f.appendChild(hidden);
    let scoreInput=document.createElement('input'); scoreInput.type='hidden'; scoreInput.name='browser_readiness_score'; scoreInput.value=score; f.appendChild(scoreInput);
  }));
})();
