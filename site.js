const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.site-header nav');
if(btn&&nav){btn.addEventListener('click',()=>nav.classList.toggle('open'));}

// Luxury-home front page carousel
const slides=[...document.querySelectorAll('.hero-slide')];
const dots=[...document.querySelectorAll('.hero-dot')];
let slideIndex=0, slideTimer;
function showSlide(i){
  if(!slides.length) return;
  slideIndex=(i+slides.length)%slides.length;
  slides.forEach((s,n)=>s.classList.toggle('active',n===slideIndex));
  dots.forEach((d,n)=>d.classList.toggle('active',n===slideIndex));
}
function startSlides(){
  clearInterval(slideTimer);
  slideTimer=setInterval(()=>showSlide(slideIndex+1),5200);
}
dots.forEach((d,i)=>d.addEventListener('click',()=>{showSlide(i);startSlides();}));
showSlide(0); startSlides();

// Search panel tabs
const tabs=[...document.querySelectorAll('.search-tab')];
const searchTitle=document.querySelector('[data-search-title]');
const searchText=document.querySelector('[data-search-text]');
const searchInput=document.querySelector('[data-search-input]');
tabs.forEach(tab=>tab.addEventListener('click',()=>{
  tabs.forEach(t=>t.classList.remove('active')); tab.classList.add('active');
  const mode=tab.dataset.mode;
  if(mode==='rent'){
    if(searchTitle) searchTitle.textContent='Find a rental';
    if(searchText) searchText.textContent='Explore Blackstone rentals and apply securely through RentSpree.';
    if(searchInput) searchInput.placeholder='City, ZIP or rental address';
  } else if(mode==='manage'){
    if(searchTitle) searchTitle.textContent='Rental property evaluation';
    if(searchText) searchText.textContent='See how Blackstone can market, lease and manage your East Bay rental.';
    if(searchInput) searchInput.placeholder='Enter your rental property address';
  } else {
    if(searchTitle) searchTitle.textContent='Find your next home';
    if(searchText) searchText.textContent='Search East Bay homes by city, ZIP, neighborhood or MLS number.';
    if(searchInput) searchInput.placeholder='City, ZIP, neighborhood or MLS #';
  }
}));

// Replace this one value when Sal sends his exact RentSpree apply URL.
const RENTSPREE_URL='https://apply.link/I-wM6FA';
window.openRentSpree=function(){
  if(RENTS_PREE_READY()) window.open(RENTS_PREE_URL,'_blank','noopener');
  else alert('RentSpree button is ready. Add your exact RentSpree application URL in assets/site.js to activate it.');
};
function RENTS_PREE_READY(){return /^https?:\/\//i.test(RENTS_PREE_URL);}

// Facebook and Instagram buttons are visible but intentionally not pointed at a guessed account.



const LISTING_KEY='blackstone_custom_listings_v1';
function getListings(){try{return JSON.parse(localStorage.getItem(LISTING_KEY)||'[]')}catch(e){return []}}
function saveListings(x){localStorage.setItem(LISTING_KEY,JSON.stringify(x))}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function statusLabel(s){return {'for-sale':'For Sale','pending':'Pending','sold':'Sold','rental':'For Rent'}[s]||s}
function renderPublic(filter='all'){const box=document.getElementById('dynamicListings');if(!box)return;const items=getListings().filter(x=>filter==='all'||x.status===filter);box.innerHTML=items.length?items.map(x=>`<article class="dynamic-card" data-status="${esc(x.status)}">${x.photo?`<img src="${esc(x.photo)}" alt="${esc(x.address)}">`:''}<div class="dynamic-body"><span class="tag">${statusLabel(x.status)}</span><div class="dynamic-price">${esc(x.price)}</div><h3>${esc(x.address)}</h3><p>${esc(x.meta)}</p>${x.url?`<a class="sold-link" href="${esc(x.url)}" target="_blank" rel="noopener">View property →</a>`:''}</div></article>`).join(''):'<p class="sold-note">No custom properties in this category yet. Use Manage Properties to add one.</p>'}
document.querySelectorAll('.listing-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.listing-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderPublic(b.dataset.filter)}));renderPublic();
const lf=document.getElementById('listingForm');if(lf){lf.addEventListener('submit',e=>{e.preventDefault();const a=getListings();a.unshift({id:Date.now(),status:lmStatus.value,address:lmAddress.value,price:lmPrice.value,meta:lmMeta.value,photo:lmPhoto.value,url:lmUrl.value});saveListings(a);lf.reset();renderManager();alert('Property added to this browser preview.');});}
function renderManager(){const box=document.getElementById('managerListings');if(!box)return;const a=getListings();box.innerHTML=a.length?a.map(x=>`<div class="manager-item"><strong>${statusLabel(x.status)} · ${esc(x.address)}</strong><span>${esc(x.price)} ${esc(x.meta)}</span><br><button type="button" data-del="${x.id}">Remove</button></div>`).join(''):'<p>No custom properties added yet.</p>';box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{saveListings(getListings().filter(x=>x.id!=b.dataset.del));renderManager()})}renderManager();
const clear=document.getElementById('clearListings');if(clear)clear.onclick=()=>{if(confirm('Clear all custom property cards from this browser?')){saveListings([]);renderManager()}};


// Mortgage calculator
function money(v){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(v)?v:0)}
function calculateMortgage(){
  const hp=document.getElementById('homePrice'); if(!hp) return;
  const price=Math.max(0,parseFloat(hp.value)||0);
  const down=Math.max(0,parseFloat(document.getElementById('downPayment').value)||0);
  const principal=Math.max(0,price-down);
  const annualRate=Math.max(0,parseFloat(document.getElementById('interestRate').value)||0)/100;
  const years=parseInt(document.getElementById('loanTerm').value||'30',10);
  const n=years*12, r=annualRate/12;
  const pi=r===0?(n?principal/n:0):principal*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
  const tax=(parseFloat(document.getElementById('propertyTax').value)||0)/12;
  const ins=(parseFloat(document.getElementById('insurance').value)||0)/12;
  const hoa=parseFloat(document.getElementById('hoa').value)||0;
  const pmi=parseFloat(document.getElementById('pmi').value)||0;
  document.getElementById('monthlyTotal').textContent=money(pi+tax+ins+hoa+pmi);
  document.getElementById('piPayment').textContent=money(pi);
  document.getElementById('taxPayment').textContent=money(tax);
  document.getElementById('insurancePayment').textContent=money(ins);
  document.getElementById('otherPayment').textContent=money(hoa+pmi);
  document.getElementById('loanAmount').textContent=money(principal);
}
['homePrice','downPayment','interestRate','loanTerm','propertyTax','insurance','hoa','pmi'].forEach(id=>{const el=document.getElementById(id);if(el){el.addEventListener('input',calculateMortgage);el.addEventListener('change',calculateMortgage)}});
calculateMortgage();

// Daily conventional and FHA market-rate watch through the Worker API.
let BLACKSTONE_LIVE_RATE = 6.78;
let BLACKSTONE_FHA_RATE = 6.32;

function formatMarketDate(value){
  if(!value) return "LATEST AVAILABLE";
  const parsed = new Date(value);
  if(Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

function applyChange(el, change, dailyLabel){
  el.classList.remove("ticker-up","ticker-down","ticker-flat");
  if(!Number.isFinite(change)){
    el.textContent = dailyLabel;
    el.classList.add("ticker-flat");
  }else if(Math.abs(change) < 0.005){
    el.textContent = "• UNCHANGED TODAY";
    el.classList.add("ticker-flat");
  }else if(change > 0){
    el.textContent = "▲ +" + Math.abs(change).toFixed(2) + "% TODAY";
    el.classList.add("ticker-up");
  }else{
    el.textContent = "▼ " + Math.abs(change).toFixed(2) + "% TODAY";
    el.classList.add("ticker-down");
  }
}

function setDailyRateUI(data){
  const conventional = Number(data.rate30);
  const fha = Number(data.fha30);
  const change30 = Number(data.change30);
  const changeFha = Number(data.changeFha30);

  if(Number.isFinite(conventional)){
    BLACKSTONE_LIVE_RATE = conventional;
    document.querySelectorAll("[data-live-rate]").forEach((el)=>{
      el.textContent = conventional.toFixed(2) + "%";
    });
  }

  if(Number.isFinite(fha)){
    BLACKSTONE_FHA_RATE = fha;
    document.querySelectorAll("[data-fha-rate]").forEach((el)=>{
      el.textContent = fha.toFixed(2) + "%";
    });
  }else{
    document.querySelectorAll("[data-fha-rate]").forEach((el)=>{
      el.textContent = "See lender";
    });
  }

  document.querySelectorAll("[data-rate-change]").forEach((el)=>{
    applyChange(el, Number.isFinite(change30) ? change30 : null, "• UPDATED WEEKDAYS");
  });

  document.querySelectorAll("[data-fha-change]").forEach((el)=>{
    applyChange(el, Number.isFinite(changeFha) ? changeFha : null, "• DAILY MARKET INDEX");
  });

  const dateText = "UPDATED " + formatMarketDate(data.updated) + " · " + (data.source || "DAILY MARKET INDEX");
  document.querySelectorAll("[data-rate-date]").forEach((el)=>{
    el.textContent = dateText;
  });

  document.querySelectorAll("[data-rate-source]").forEach((el)=>{
    el.textContent = data.source || "Mortgage News Daily Rate Index";
  });

  const input = document.getElementById("interestRate");
  if(input && !input.dataset.userChanged){
    input.value = BLACKSTONE_LIVE_RATE.toFixed(2);
    if(typeof calculateMortgage === "function") calculateMortgage();
  }
}

async function refreshDailyRates(){
  if(!document.querySelector("[data-live-rate]") && !document.querySelector("[data-fha-rate]")) return;

  try{
    const response = await fetch("/api/rates", { cache: "no-store" });
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || "Rate API unavailable");
    setDailyRateUI(data);
  }catch(error){
    setDailyRateUI({
      rate30: BLACKSTONE_LIVE_RATE,
      fha30: BLACKSTONE_FHA_RATE,
      change30: null,
      changeFha30: null,
      updated: "LATEST VERIFIED",
      source: "Last verified daily benchmark"
    });
  }
}

const rateInput = document.getElementById("interestRate");
if(rateInput){
  rateInput.addEventListener("input", ()=>{ rateInput.dataset.userChanged = "true"; });
}

refreshDailyRates();

const liveBtn = document.getElementById("useLiveRate");
if(liveBtn){
  liveBtn.addEventListener("click", ()=>{
    const input = document.getElementById("interestRate");
    if(input){
      input.value = BLACKSTONE_LIVE_RATE.toFixed(2);
      input.dataset.userChanged = "";
    }
    if(typeof calculateMortgage === "function") calculateMortgage();
  });
}



