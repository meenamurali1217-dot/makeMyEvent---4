// events_vendors_logic.js - Dynamic backend-integrated marketplace logic

const eventCategories = [
  {id:"wedding",    name:"Wedding",          icon:"fa-ring",              short:"Wedding"},
  {id:"birthday",   name:"Birthday Party",   icon:"fa-cake-candles",      short:"Birthday"},
  {id:"corporate",  name:"Corporate Event",  icon:"fa-briefcase",         short:"Corporate"},
  {id:"anniversary",name:"Anniversary",      icon:"fa-heart",             short:"Anniv"},
  {id:"babyshower", name:"Baby Shower",      icon:"fa-baby-carriage",     short:"Shower"},
  {id:"social",     name:"Social Gathering", icon:"fa-users",             short:"Social"},
  {id:"festival",   name:"Festivals",        icon:"fa-campground",        short:"Festival"},
  {id:"exhibition", name:"Exhibitions",      icon:"fa-palette",           short:"Exhibition"},
  {id:"charity",    name:"Charity & NGO",    icon:"fa-hand-holding-heart",short:"Charity"},
  {id:"party",      name:"Private Party",    icon:"fa-glass-cheers",      short:"Party"},
  {id:"cultural",   name:"Cultural Events",  icon:"fa-masks-theater",     short:"Cultural"},
  {id:"engagement", name:"Engagements",      icon:"fa-gem",               short:"Engagement"},
  {id:"religious",  name:"Religious Events", icon:"fa-place-of-worship",  short:"Religious"},
  {id:"sports",     name:"Sports Events",    icon:"fa-trophy",            short:"Sports"},
  {id:"concert",    name:"Concerts & Shows", icon:"fa-music",             short:"Concert"},
];

const serviceTypes=[
  {id:"all",         name:"All Services",    icon:"fa-th-large"},
  {id:"decoration",  name:"Decoration",      icon:"fa-wand-magic-sparkles"},
  {id:"catering",    name:"Catering",        icon:"fa-utensils"},
  {id:"photography", name:"Photography",     icon:"fa-camera"},
  {id:"music",       name:"Music & DJ",      icon:"fa-music"},
  {id:"makeup",      name:"Makeup & Styling",icon:"fa-spa"},
  {id:"mehendi",     name:"Mehendi",         icon:"fa-hand"},
  {id:"lighting",    name:"Lighting",        icon:"fa-lightbulb"},
  {id:"cake",        name:"Cake & Desserts", icon:"fa-cake-candles"},
  {id:"transport",   name:"Transport",       icon:"fa-bus"},
  {id:"anchoring",   name:"Anchoring & MC",  icon:"fa-microphone"},
  {id:"security",    name:"Security",        icon:"fa-shield-halved"},
  {id:"floral",      name:"Floral & Garlands",icon:"fa-seedling"},
  {id:"photobooth",  name:"Photo Booth",     icon:"fa-image"},
  {id:"entertainment",name:"Entertainment",  icon:"fa-masks-theater"},
];

let vendors = [];
let individualServices = [];
let wishlistItems = [];
let myRequests = [];
let activeCat = "wedding";
let activeServiceType = "all";
let currentMode = "packages";
let currentBookingData = null;
let currentIndData = null;

async function initData() {
  try {
    const res = await fetch('/api/vendors');
    const data = await res.json();
    vendors = data.vendors || [];
    individualServices = data.individualServices || [];
  } catch (e) {
    console.error("Error loading vendors data:", e);
  }
}

async function loadWishlist() {
  try {
    const res = await fetch('/api/user/wishlist');
    const data = await res.json();
    wishlistItems = (data.wishlist || []).map(w => {
      const isPackage = w.type === 'package';
      // Format to match expected structure in frontend UI:
      // Packages: id = "vendor_v_1", vendorId = "v_1"
      // Individuals: id = "service_ind_6", serviceId = "ind_6"
      const id = isPackage ? `vendor_v_${w.vendorId}` : `service_ind_${w.vendorId}`;
      return {
        id: id,
        type: w.type,
        vendorId: isPackage ? `v_${w.vendorId}` : undefined,
        serviceId: !isPackage ? `ind_${w.vendorId}` : undefined,
        packageCount: isPackage ? 1 : undefined,
        serviceType: !isPackage ? w.eventType : undefined,
        vendorName: w.vendorName,
        serviceName: w.vendorName,
        eventType: w.eventType
      };
    });
  } catch (e) {
    console.error("Error loading wishlist:", e);
  }
}

async function loadRequests() {
  try {
    const res = await fetch('/api/user/requests');
    const data = await res.json();
    myRequests = data.requests || [];
  } catch (e) {
    console.error("Error loading requests:", e);
  }
}

function byType(t){
  if(currentMode==='individual'){
    return getIndByCategory(t,'all');
  } else {
    return vendors.filter(v=>v.eventType===t);
  }
}
function fmtStars(s){const n=parseFloat(s),f=Math.floor(n),h=n%1>=.5?1:0,e=5-f-h;let r='';for(let i=0;i<f;i++)r+='<i class="fa-solid fa-star"></i>';if(h)r+='<i class="fa-solid fa-star-half-stroke"></i>';for(let i=0;i<e;i++)r+='<i class="fa-regular fa-star"></i>';return r;}
function fmtMoney(n){if(n>=10000000)return '\u20b9'+(n/10000000).toFixed(2).replace(/\.?0+$/,'')+' Cr';if(n>=100000)return '\u20b9'+(n/100000).toFixed(2).replace(/\.?0+$/,'')+' L';return '\u20b9'+n.toLocaleString('en-IN');}
function fmtDate(d){try{return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}catch(e){return d;}}
function fmtTime(t){if(!t)return 'Not specified';try{const[h,m]=t.split(':').map(Number);const ampm=h>=12?'PM':'AM';const hr=h%12||12;return `${hr}:${m.toString().padStart(2,'0')} ${ampm}`;}catch(e){return t;}}

function updateReqBadge(){
  const badge=document.getElementById('reqBadge');
  if(myRequests.length>0){badge.style.display='flex';badge.textContent=myRequests.length;}
  else{badge.style.display='none';}
}

function renderServicesGrid(){
  const grid=document.getElementById('servicesGrid');
  grid.innerHTML=eventCategories.map(c=>{
    const count=byType(c.id).length;
    const label=currentMode==='individual'?'service':'vendor';
    return `<div class="service-card${c.id===activeCat?' active':''}" onclick="selectCategory('${c.id}')">
      <div class="sc-icon-wrap"><i class="fa-solid ${c.icon}"></i></div>
      <div class="sc-name">${c.name}</div>
      <div class="sc-count">${count} ${label}${count!==1?'s':''}</div>
    </div>`;
  }).join('');
}

function selectCategory(catId){
  activeCat=catId;
  activeServiceType='all';
  renderServicesGrid();renderCats();
  document.getElementById('pkgView').style.display='none';
  if(currentMode==='individual'){
    document.getElementById('individualView').style.display='block';
    document.getElementById('indDetailView').style.display='none';
    document.getElementById('vendorGrid').style.display='none';
    renderIndividualCats();
    renderIndividualCards();
  } else {
    document.getElementById('individualView').style.display='none';
    document.getElementById('vendorGrid').style.display='block';
    renderVendors();
  }
  setTimeout(()=>{
    document.getElementById('catBar').scrollIntoView({behavior:'smooth',block:'nearest'});
    const ab=document.querySelector('.cat-btn.active');
    if(ab)ab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  },100);
}

function renderCats(){
  const bar=document.getElementById('catBar');
  bar.innerHTML=eventCategories.map(c=>`<button class="cat-btn${c.id===activeCat?' active':''}" data-cat="${c.id}"><i class="fa-solid ${c.icon}"></i> ${c.short}<span class="cat-count">${byType(c.id).length}</span></button>`).join('');
  bar.querySelectorAll('.cat-btn').forEach(b=>b.addEventListener('click',()=>selectCategory(b.dataset.cat)));
}

function renderVendors(){
  let list=byType(activeCat);
  const searchInput = document.getElementById('userSearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (query) {
    list = list.filter(v => 
      v.name.toLowerCase().includes(query) || 
      v.description.toLowerCase().includes(query) || 
      v.location.toLowerCase().includes(query) || 
      (v.badge && v.badge.toLowerCase().includes(query))
    );
  }
  const cat=eventCategories.find(c=>c.id===activeCat);
  document.getElementById('sectionHeading').innerHTML=`<i class="fa-solid ${cat.icon}" style="color:var(--teal);margin-right:10px;font-size:22px;"></i>${cat.name} <span>Vendors</span>`;
  document.getElementById('sectionMeta').textContent=`${list.length} verified vendor${list.length!==1?'s':''} \u00b7 Click any card to explore packages`;
  if(!list.length){document.getElementById('vendorCards').innerHTML=`<div class="empty"><div class="empty-icon"><i class="fa-solid fa-clock"></i></div><h3>Coming Soon</h3><p>We are onboarding vendors for this category.</p></div>`;return;}
  document.getElementById('vendorCards').innerHTML=list.map((v,i)=>{
    const descLimit = 85;
    const cleanDesc = (v.description || 'No description available.').trim();
    const hasMore = cleanDesc.length > descLimit;
    const shortDesc = hasMore ? cleanDesc.substring(0, descLimit) + '...' : cleanDesc;
    
    return `
    <div class="vendor-card" data-id="${v.id}" style="animation-delay:${i*55}ms">
      <div class="vc-img-wrap">
        <img class="vc-img" src="${v.img}" alt="${v.name}" loading="lazy"/>
        <div class="vc-badge">${v.badge}</div>
        <div class="vc-pkg-count"><i class="fa-solid fa-layer-group" style="font-size:10px;margin-right:4px;"></i>${v.packages.length} package${v.packages.length!==1?'s':''}</div>
        <button class="vc-wishlist-btn" data-wishlist-heart data-item-id="vendor_${v.id}" onclick="event.stopPropagation();addToWishlist('vendor_${v.id}',{type:'package',vendorId:'${v.id}',vendorName:'${v.name}',packageCount:${v.packages.length}})" style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.9);border:none;width:35px;height:35px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;">
          ${isInWishlist('vendor_'+v.id)?'<i class="fa-solid fa-heart" style="color:var(--teal);"></i>':'<i class="fa-regular fa-heart"></i>'}
        </button>
      </div>
      <div class="vc-body">
        <div class="vc-cat">${cat.name}</div>
        <div class="vc-name">${v.name}</div>
        <div class="vc-desc" id="desc_container_${v.id}" style="height: 48px; overflow: hidden; position: relative;">
          <span id="desc_short_${v.id}">${shortDesc} ${hasMore ? `<a href="#" onclick="event.stopPropagation(); toggleDesc('${v.id}')" style="color:var(--teal); font-weight:600; cursor:pointer; text-decoration:none; margin-left:3px;">Read more</a>` : ''}</span>
          <span id="desc_full_${v.id}" style="display:none;">${cleanDesc} <a href="#" onclick="event.stopPropagation(); toggleDesc('${v.id}')" style="color:var(--teal); font-weight:600; cursor:pointer; text-decoration:none; margin-left:3px;">Read less</a></span>
        </div>
        <div class="vc-rating"><span class="stars">${fmtStars(v.rating)}</span><span class="rating-num">${v.rating}</span><span style="color:var(--ink3);font-size:12px;">(${v.reviews})</span></div>
        <div class="vc-location"><i class="fa-solid fa-location-dot"></i>${v.location}</div>
        <div class="vc-footer"><div class="vc-price-hint">From <strong>${v.priceFrom}</strong></div><div class="vc-cta">View packages <i class="fa-solid fa-arrow-right"></i></div></div>
      </div>
    </div>`;
  }).join('');
  document.querySelectorAll('.vendor-card').forEach(c=>c.addEventListener('click',()=>openPackages(c.dataset.id)));
}

function openPackages(vid){
  const v=vendors.find(x=>x.id===vid);if(!v)return;
  document.getElementById('pkgVendorName').textContent=v.name;
  document.getElementById('pkgVendorMeta').innerHTML=`<i class="fa-solid fa-shield-halved" style="color:var(--teal);margin-right:5px;"></i>${v.badge} &bull; <i class="fa-solid fa-star" style="color:#d4a017;margin:0 3px 0 8px;"></i>${v.rating} (${v.reviews} reviews)`;
  document.getElementById('pkgVendorLocation').innerHTML=`<i class="fa-solid fa-location-dot"></i><span>${v.location}</span>`;
  document.getElementById('pkgTableBody').innerHTML=v.packages.map(p=>`
    <tr>
      <td class="td-pkg"><div class="pkg-thumb-wrap"><img class="pkg-thumb" src="${p.img}" alt="${p.title}" loading="lazy"/><span class="pkg-tier ${p.tierClass}">${p.tier}</span></div><div class="pkg-title">${p.title}</div><div class="pkg-subtitle">${p.subtitle}</div></td>
      <td><ul class="inc-list">${p.services.map(s=>`<li><i class="fa-solid ${s.icon}"></i>${s.label}</li>`).join('')}</ul></td>
      <td class="td-rev">
        <div class="rev-stars-row">${fmtStars(p.score)}</div>
        <div class="rev-score">${p.score}</div>
        <div class="rev-count"><i class="fa-regular fa-comment-dots" style="margin-right:4px;color:var(--ink3);"></i>${p.reviewCount}</div>
        <div class="rev-quote">${p.quote}<div class="rev-author">${p.author}</div></div>
        <button class="book-now-btn" data-vid="${v.id}" data-pkg="${encodeURIComponent(p.title)}"><i class="fa-solid fa-calendar-check"></i> Book &amp; Customise</button>
      </td>
    </tr>`).join('');
  document.querySelectorAll('.book-now-btn').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openBookingModal(btn.dataset.vid,decodeURIComponent(btn.dataset.pkg));}));
  document.getElementById('vendorGrid').style.display='none';
  document.getElementById('pkgView').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
  loadAndRenderVendorReviews(v.vendor_id, 'pkgVendorReviewsList');
}

function openBookingModal(vid,pkgTitle){
  const v=vendors.find(x=>x.id===vid);if(!v)return;
  const p=v.packages.find(x=>x.title===pkgTitle);if(!p)return;
  currentBookingData={vendor:v,pkg:p};
  currentIndData=null;
  document.getElementById('bookingForm').style.display='block';
  document.getElementById('successScreen').style.display='none';
  document.getElementById('bLabel').textContent=v.badge;
  document.getElementById('bName').textContent=p.title;
  document.getElementById('bSub').textContent=v.name+' \u00b7 Tick services and customise your event';
  const today=new Date(),minDate=new Date(today.getTime()+7*24*60*60*1000);
  const dateEl=document.getElementById('eventDate');
  dateEl.value='';dateEl.min=minDate.toISOString().split('T')[0];dateEl.classList.remove('error');
  document.getElementById('dateErrMsg').style.display='none';
  document.getElementById('dateHint').style.display='flex';
  document.getElementById('eventTime').value='';
  document.getElementById('customNote').value='';
  document.getElementById('svcTableBody').innerHTML=p.services.map((s,i)=>`
    <tr><td><label class="svc-row-label" for="cb_${i}"><input type="checkbox" class="svc-cb" id="cb_${i}" data-price="${s.price}" data-label="${s.label}"/><i class="fa-solid ${s.icon} svc-icon"></i>${s.label}</label></td><td>${fmtMoney(s.price)}</td></tr>`).join('');
  document.querySelectorAll('.svc-cb').forEach(cb=>cb.addEventListener('change',updateEstimate));
  updateEstimate();
  document.getElementById('bookingOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function validateDate(){
  const dateEl=document.getElementById('eventDate'),val=dateEl.value;
  const today=new Date();today.setHours(0,0,0,0);
  const min=new Date(today.getTime()+7*24*60*60*1000);
  const errMsg=document.getElementById('dateErrMsg'),hint=document.getElementById('dateHint');
  if(!val||new Date(val)<min){dateEl.classList.add('error');errMsg.style.display='flex';hint.style.display='none';}
  else{dateEl.classList.remove('error');errMsg.style.display='none';hint.style.display='flex';}
  updateEstimate();
}

function updateEstimate(){
  const checked=[...document.querySelectorAll('.svc-cb:checked')];
  const total=checked.reduce((s,c)=>s+parseInt(c.dataset.price),0);
  document.getElementById('estAmount').textContent=fmtMoney(total);
  document.getElementById('estNote').textContent=checked.length?`${checked.length} service${checked.length>1?'s':''} selected`:'Select services above to build your estimate';
  const dateVal=document.getElementById('eventDate').value,today=new Date();
  today.setHours(0,0,0,0);
  const min=new Date(today.getTime()+7*24*60*60*1000);
  document.getElementById('submitBtn').disabled=checked.length===0||!dateVal||new Date(dateVal)<min;
}

function closeModal(){document.getElementById('bookingOverlay').classList.remove('open');document.body.style.overflow='';}

async function submitBooking(){
  const checked=[...document.querySelectorAll('.svc-cb:checked')];
  const total=checked.reduce((s,c)=>s+parseInt(c.dataset.price),0);
  const {vendor,pkg}=currentBookingData;
  const dateVal=document.getElementById('eventDate').value;
  const timeVal=document.getElementById('eventTime').value;
  const customNote=document.getElementById('customNote').value.trim();

  try {
    const res = await fetch('/api/user/request', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        vendor_listing_id: vendor.id,
        package_title: pkg.title,
        event_date: dateVal,
        event_time: timeVal,
        services: checked.map(c=>({label:c.dataset.label,price:parseInt(c.dataset.price)})),
        total: total,
        custom_note: customNote
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      const reqId = data.booking_id; // Use real booking_id or reqId
      document.getElementById('successSummary').innerHTML=
        `<div class="sum-row"><span>Request ID</span><span><strong style="color:var(--teal);">${reqId}</strong></span></div>`+
        `<div class="sum-row"><span>Status</span><span><strong style="color:var(--pending);">\u23f3 Pending Review</strong></span></div>`+
        `<div class="sum-row"><span>Vendor</span><span><strong>${vendor.name}</strong></span></div>`+
        `<div class="sum-row"><span>Package</span><span><strong>${pkg.title}</strong></span></div>`+
        `<div class="sum-row"><span><i class="fa-regular fa-calendar" style="color:var(--teal);margin-right:5px;"></i>Event Date</span><span><strong>${fmtDate(dateVal)}</strong></span></div>`+
        `<div class="sum-row"><span><i class="fa-regular fa-clock" style="color:var(--teal);margin-right:5px;"></i>Start Time</span><span><strong>${fmtTime(timeVal)}</strong></span></div>`+
        (customNote?`<div class="sum-row"><span><i class="fa-solid fa-pen-nib" style="color:var(--teal);margin-right:5px;"></i>Custom Note</span><span style="font-style:italic;color:var(--ink3);max-width:200px;text-align:right;">${customNote.substring(0,80)}${customNote.length>80?'\u2026':''}</span></div>`:'')+
        checked.map(c=>`<div class="sum-row"><span>${c.dataset.label.substring(0,40)}${c.dataset.label.length>40?'\u2026':''}</span><span>${fmtMoney(parseInt(c.dataset.price))}</span></div>`).join('')+
        `<div class="sum-row total"><span><strong>Estimated Total</strong></span><span><strong>${fmtMoney(total)}</strong></span></div>`;
      document.getElementById('bookingForm').style.display='none';
      const ss=document.getElementById('successScreen');ss.style.display='flex';ss.style.flexDirection='column';
      
      await loadRequests();
      updateReqBadge();
      currentBookingData=null;
    } else {
      showNotification('Failed to submit request: ' + data.message, 'error');
    }
  } catch (e) {
    console.error("Error creating booking:", e);
    showNotification('An error occurred during submission', 'error');
  }
}

const statusConfig={
  'pending':     {label:'Pending Review',  icon:'fa-clock',         steps:[{active:true,done:false},{done:false},{done:false},{done:false}]},
  'in-progress': {label:'In Progress',     icon:'fa-spinner',       steps:[{done:true},{active:true,done:false},{done:false},{done:false}]},
  'confirmed':   {label:'Confirmed',       icon:'fa-circle-check',  steps:[{done:true},{done:true},{done:true},{done:true}]},
  'rejected':    {label:'Not Available',   icon:'fa-circle-xmark',  steps:[{done:false},{done:false},{done:false},{done:false}]},
  'cancelled':   {label:'Cancelled',       icon:'fa-circle-xmark',  steps:[{done:false},{done:false},{done:false},{done:false}]},
};
const stepLabels=['Submitted','Reviewing','Confirmed','Booked'];

function renderRequestsPanel(){
  const body=document.getElementById('rpBody');
  if(!myRequests.length){
    body.innerHTML=`<div class="rp-empty"><i class="fa-solid fa-clipboard-list"></i><p>No requests yet. Browse vendors and send your first customisation request!</p></div>`;return;
  }
  body.innerHTML=myRequests.map(r=>{
    const sc=statusConfig[r.status]||statusConfig['pending'];
    const stepsHtml=stepLabels.map((sl,i)=>{
      const s=sc.steps[i]||{};
      const cls=s.done?(s.active?'active done':'done'):(s.active?'active':'');
      return `<div class="sp-step ${cls}"><div class="sp-dot">${s.done?'<i class="fa-solid fa-check" style="font-size:8px;"></i>':s.active?'<i class="fa-solid fa-circle" style="font-size:6px;"></i>':''}</div><div class="sp-label">${sl}</div></div>`;
    }).join('');
    return `<div class="request-item status-${r.status}">
      <div class="ri-top">
        <div><div class="ri-vendor">${r.vendorName}</div><div class="ri-pkg">${r.packageTitle}</div></div>
        <div class="ri-status status-${r.status}"><i class="fa-solid ${sc.icon}"></i> ${sc.label}</div>
      </div>
      <div class="ri-meta">
        <span><i class="fa-regular fa-calendar"></i> ${r.eventDateDisplay||'Date TBD'}</span>
        <span><i class="fa-regular fa-clock"></i> ${r.eventTimeDisplay||'TBD'}</span>
        <span><i class="fa-solid fa-tag"></i> ${r.id}</span>
      </div>
      ${r.customNote?`<div class="ri-custom-note"><i class="fa-solid fa-pen-nib" style="margin-right:6px;color:var(--teal);"></i>${r.customNote.substring(0,120)}${r.customNote.length>120?'\u2026':''}</div>`:''}
      <div class="status-progress">${stepsHtml}</div>
      <div class="ri-total"><span>${r.services.length} service${r.services.length!==1?'s':''} selected</span><span>${fmtMoney(r.total)}</span></div>
    </div>`;
  }).join('');
}

function openRequestsPanel(){renderRequestsPanel();document.getElementById('requestsOverlay').classList.add('open');document.getElementById('requestsPanel').classList.add('open');document.body.style.overflow='hidden';}
function closeRequestsPanel(){document.getElementById('requestsOverlay').classList.remove('open');document.getElementById('requestsPanel').classList.remove('open');document.body.style.overflow='';}

function switchMode(mode){
  currentMode=mode;
  document.getElementById('modePackages').classList.toggle('active',mode==='packages');
  document.getElementById('modeIndividual').classList.toggle('active',mode==='individual');
  document.getElementById('pkgView').style.display='none';
  if(mode==='individual'){
    document.getElementById('individualView').style.display='block';
    document.getElementById('indDetailView').style.display='none';
    document.getElementById('vendorGrid').style.display='none';
    renderIndividualCats();
    renderIndividualCards();
  } else {
    document.getElementById('individualView').style.display='none';
    document.getElementById('vendorGrid').style.display='block';
    renderVendors();
  }
  renderServicesGrid();
  renderCats();
}

function getFlattenedServices() {
  let list = [];
  individualServices.forEach(prov => {
    (prov.items || []).forEach((item, idx) => {
      list.push({
        serviceId: `${prov.id}_${idx}`,
        providerId: prov.id,
        providerName: prov.name,
        providerBusiness: prov.provider,
        location: prov.location,
        rating: prov.rating,
        reviews: prov.reviews,
        features: prov.features,
        // Service details
        label: item.label,
        category: item.category, // e.g. 'catering', 'photography'
        icon: item.icon,
        price: item.price,
        description: item.description || prov.description,
        img: item.image_url || prov.img || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600&auto=format&fit=crop',
        eventTags: prov.eventTags,
        itemIdx: idx
      });
    });
  });
  return list;
}

function toggleDesc(serviceId) {
  const shortEl = document.getElementById(`desc_short_${serviceId}`);
  const fullEl = document.getElementById(`desc_full_${serviceId}`);
  const container = document.getElementById(`desc_container_${serviceId}`);
  
  const isVendor = serviceId.startsWith('v_');
  const defaultHeight = isVendor ? '48px' : '70px';
  
  if (shortEl.style.display === 'none') {
    shortEl.style.display = 'inline';
    fullEl.style.display = 'none';
    container.style.height = defaultHeight;
    container.style.overflow = 'hidden';
  } else {
    shortEl.style.display = 'none';
    fullEl.style.display = 'inline';
    container.style.height = 'auto';
    container.style.overflow = 'visible';
  }
}

function getIndByCategory(eventCat, type) {
  let list = getFlattenedServices();
  if(eventCat!=='all') list=list.filter(s=>s.eventTags.includes(eventCat));
  if(type&&type!=='all') list=list.filter(s=>s.category===type);
  return list;
}

function renderIndividualCats(){
  const cat=eventCategories.find(c=>c.id===activeCat);
  const allForCat=getIndByCategory(activeCat,'all');
  document.getElementById('indHeading').innerHTML=
    `<i class="fa-solid ${cat.icon}" style="color:var(--teal);margin-right:10px;font-size:22px;"></i>${cat.name} <span style="color:var(--teal);">Individual Services</span>`;
  document.getElementById('indMeta').textContent=
    `${allForCat.length} service${allForCat.length!==1?'s':''} available \u00b7 Click any card to explore`;
  const availableTypes=serviceTypes.map(t=>{
    const count=t.id==='all'?allForCat.length:getIndByCategory(activeCat,t.id).length;
    return {...t,count};
  }).filter(t=>t.count>0);
  const bar=document.getElementById('svcTypeBar');
  bar.innerHTML=availableTypes.map(t=>`
    <button class="svc-type-pill${t.id===activeServiceType?' active':''}" data-type="${t.id}">
      <i class="fa-solid ${t.icon}"></i> ${t.name}<span class="pill-count">${t.count}</span>
    </button>`).join('');
  bar.querySelectorAll('.svc-type-pill').forEach(b=>b.addEventListener('click',()=>{
    activeServiceType=b.dataset.type;
    renderIndividualCats();
    renderIndividualCards();
  }));
}

function renderIndividualCards(){
  let list=getIndByCategory(activeCat,activeServiceType);
  const searchInput = document.getElementById('userSearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (query) {
    list = list.filter(s => 
      s.label.toLowerCase().includes(query) || 
      s.providerName.toLowerCase().includes(query) || 
      s.description.toLowerCase().includes(query) || 
      s.location.toLowerCase().includes(query)
    );
  }
  const container=document.getElementById('indCards');
  if(!list.length){
    container.innerHTML=`<div class="empty" style="grid-column:1/-1;"><div class="empty-icon"><i class="fa-solid fa-puzzle-piece"></i></div><h3>No services found</h3><p>Try a different filter or category.</p></div>`;
    return;
  }
  container.innerHTML=list.map((s,i)=>{
    const typeName=serviceTypes.find(t=>t.id===s.category)?.name||s.category;
    const typeIcon=serviceTypes.find(t=>t.id===s.category)?.icon||'fa-star';
    const wishlistId='service_'+s.providerId;
    
    // Setup Description limits & read more toggle details
    const descLimit = 85;
    const cleanDesc = (s.description || 'No description available.').trim();
    const hasMore = cleanDesc.length > descLimit;
    const shortDesc = hasMore ? cleanDesc.substring(0, descLimit) + '...' : cleanDesc;
    
    return `<div class="prov-card" data-providerid="${s.providerId}" style="animation-delay:${i*50}ms;position:relative;">
      <div class="prov-img-wrap">
        <img src="${s.img}" alt="${s.label}" loading="lazy"/>
        <div class="prov-type-badge" style="background:var(--teal);">
          <i class="fa-solid ${typeIcon}" style="margin-right:5px;"></i>${typeName}
        </div>
        <button class="prov-wishlist-btn" data-wishlist-heart data-item-id="${wishlistId}" onclick="event.stopPropagation();addToWishlist('${wishlistId}',{type:'individual',serviceId:'${s.providerId}',serviceName:'${s.providerName}',serviceType:'${s.category}'})" style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.9);border:none;width:35px;height:35px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.2s ease;">
          ${isInWishlist(wishlistId)?'<i class="fa-solid fa-heart" style="color:var(--teal);"></i>':'<i class="fa-regular fa-heart"></i>'}
        </button>
      </div>
      <div class="prov-body">
        <div class="prov-type-label">${typeName}</div>
        <div class="prov-name" style="height: 48px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 5px;">${s.label}</div>
        <div class="prov-by"><i class="fa-solid fa-user-tie"></i>${s.providerName}</div>
        
        <div class="prov-desc-container" id="desc_container_${s.serviceId}" style="height: 70px; overflow: hidden; margin-top: 8px; font-size: 13px; line-height: 1.5; color: var(--ink3); position: relative;">
          <span id="desc_short_${s.serviceId}">${shortDesc} ${hasMore ? `<a href="#" onclick="event.stopPropagation(); toggleDesc('${s.serviceId}')" style="color:var(--teal); font-weight:600; cursor:pointer; text-decoration:none; margin-left:3px;">Read more</a>` : ''}</span>
          <span id="desc_full_${s.serviceId}" style="display:none;">${cleanDesc} <a href="#" onclick="event.stopPropagation(); toggleDesc('${s.serviceId}')" style="color:var(--teal); font-weight:600; cursor:pointer; text-decoration:none; margin-left:3px;">Read less</a></span>
        </div>
        
        <div class="prov-rating"><span class="stars">${fmtStars(s.rating)}</span><span class="rating-num">${s.rating}</span><span style="color:var(--ink3);font-size:12px;">(${s.reviews} reviews)</span></div>
        <div class="prov-location"><i class="fa-solid fa-location-dot"></i>${s.location}</div>
        <div class="prov-footer" style="display:block; margin-top:12px; padding-top:12px; border-top:1px solid var(--border); width:100%;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:10px;">
            <div class="prov-price">Price: <strong>${fmtMoney(s.price)}</strong></div>
            <div style="color:var(--teal); font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px;" onclick="event.stopPropagation(); openIndProvider('${s.providerId}')">View Vendor <i class="fa-solid fa-arrow-right" style="font-size:10px;"></i></div>
          </div>
          <button class="ind-book-now-btn" onclick="event.stopPropagation(); openSingleItemModal('${s.providerId}', ${s.itemIdx}, false)"><i class="fa-solid fa-calendar-check"></i> Book Now</button>
          <button class="ind-custom-now-btn" onclick="event.stopPropagation(); openSingleItemModal('${s.providerId}', ${s.itemIdx}, true)"><i class="fa-solid fa-pen-nib"></i> Customise Service</button>
        </div>
      </div>
    </div>`;
  }).join('');
  container.querySelectorAll('.prov-card').forEach(c=>c.addEventListener('click',()=>openIndProvider(c.dataset.providerid)));
}

function openIndProvider(svcId){
  const svc=individualServices.find(s=>s.id===svcId);
  if(!svc)return;
  const typeName=serviceTypes.find(t=>t.id===svc.type)?.name||svc.type;
  const typeIcon=serviceTypes.find(t=>t.id===svc.type)?.icon||'fa-star';
  document.getElementById('indProviderName').textContent=svc.name;
  document.getElementById('indProviderMeta').innerHTML=
    `<i class="fa-solid ${typeIcon}" style="color:var(--teal);margin-right:6px;"></i><strong>${typeName}</strong>`+
    ` &bull; <i class="fa-solid fa-user-tie" style="color:var(--teal);margin:0 4px 0 10px;"></i>${svc.provider}`+
    ` &bull; <i class="fa-solid fa-star" style="color:#d4a017;margin:0 3px 0 10px;"></i>${svc.rating} (${svc.reviews} reviews)`;
  document.getElementById('indProviderLoc').innerHTML=
    `<i class="fa-solid fa-location-dot"></i><span>${svc.location}</span>`;
  const iconColors=['#2d9da8','#8b1a2b','#c9952a','#2d6a9a','#6a2d8b','#2d8b4a','#8b6a2d','#4a2d8b'];
  document.getElementById('indTableBody').innerHTML=svc.items.map((item,i)=>{
    const bgColor=iconColors[i%iconColors.length];
    const allFeats=[...svc.features];
    return `<tr>
      <td class="td-ind-svc">
        <div class="ind-svc-icon-wrap" style="background:${bgColor}18;border:1.5px solid ${bgColor}35;">
          <i class="fa-solid ${item.icon}" style="color:${bgColor};font-size:22px;"></i>
        </div>
        <div class="ind-svc-title">${item.label}</div>
        <div class="ind-svc-price">${fmtMoney(item.price)}</div>
        <div class="ind-svc-price-note">per booking / unit</div>
      </td>
      <td class="ind-svc-features">
        <ul>
          <li><i class="fa-solid fa-store"></i>${svc.name}</li>
          <li><i class="fa-solid fa-user-tie"></i>${svc.provider}</li>
          ${allFeats.map(f=>`<li><i class="fa-solid fa-check"></i>${f}</li>`).join('')}
          <li><i class="fa-solid fa-location-dot"></i>${svc.location}</li>
          <li><i class="fa-solid fa-star" style="color:#d4a017;"></i>Rated ${svc.rating} &middot; ${svc.reviews} reviews</li>
        </ul>
      </td>
      <td class="td-ind-book">
        <div class="rev-stars-row">${fmtStars(svc.rating)}</div>
        <div class="rev-score">${svc.rating}</div>
        <div class="rev-count"><i class="fa-regular fa-comment-dots" style="margin-right:4px;color:var(--ink3);"></i>${svc.reviews} reviews</div>
        <button class="ind-book-now-btn" onclick="openSingleItemModal('${svc.id}',${i},false)">
          <i class="fa-solid fa-calendar-check"></i> Book Now
        </button>
        <button class="ind-custom-now-btn" onclick="openSingleItemModal('${svc.id}',${i},true)">
          <i class="fa-solid fa-pen-nib"></i> Customise
        </button>
      </td>
    </tr>`;
  }).join('');
  document.getElementById('individualView').style.display='none';
  document.getElementById('indDetailView').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
  loadAndRenderVendorReviews(svc.vendor_id, 'indVendorReviewsList');
}

function openSingleItemModal(svcId,itemIdx,customiseOnly){
  const svc=individualServices.find(s=>s.id===svcId);
  if(!svc)return;
  const item=svc.items[itemIdx];
  const typeName=serviceTypes.find(t=>t.id===svc.type)?.name||svc.type;
  currentIndData={svc,itemIdx,isIndividual:true};
  currentBookingData=null;
  document.getElementById('bookingForm').style.display='block';
  document.getElementById('successScreen').style.display='none';
  document.getElementById('bLabel').textContent=typeName+' \u2014 Individual Service';
  document.getElementById('bName').textContent=item.label;
  document.getElementById('bSub').textContent=svc.name+' \u00b7 '+svc.provider+(customiseOnly?' \u00b7 Describe your requirements below':'');
  const today=new Date(),minDate=new Date(today.getTime()+7*24*60*60*1000);
  const dateEl=document.getElementById('eventDate');
  dateEl.value='';dateEl.min=minDate.toISOString().split('T')[0];dateEl.classList.remove('error');
  document.getElementById('dateErrMsg').style.display='none';
  document.getElementById('dateHint').style.display='flex';
  document.getElementById('eventTime').value='';
  document.getElementById('customNote').value='';
  document.getElementById('customNote').placeholder=customiseOnly
    ?'Describe your customisation \u2014 colours, quantity, timing, special requirements...'
    :'Any special requirements or additional notes (optional)...';
  document.getElementById('svcTableBody').innerHTML=svc.items.map((it,i)=>`
    <tr><td><label class="svc-row-label" for="scb_${i}">
      <input type="checkbox" class="svc-cb" id="scb_${i}" data-price="${it.price}" data-label="${it.label}"${i===itemIdx?' checked':''}/>
      <i class="fa-solid ${it.icon} svc-icon"></i>${it.label}
    </label></td><td>${fmtMoney(it.price)}</td></tr>`).join('');
  document.querySelectorAll('.svc-cb').forEach(cb=>cb.addEventListener('change',updateEstimate));
  if(customiseOnly) setTimeout(()=>document.getElementById('customNote').focus(),400);
  updateEstimate();
  document.getElementById('bookingOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function openIndModal(svcId, customiseOnly){
  const svc=individualServices.find(s=>s.id===svcId);
  if(!svc)return;
  currentIndData={svc,isIndividual:true};
  document.getElementById('bookingForm').style.display='block';
  document.getElementById('successScreen').style.display='none';
  document.getElementById('bLabel').textContent=serviceTypes.find(t=>t.id===svc.type)?.name||svc.type;
  document.getElementById('bName').textContent=svc.name;
  document.getElementById('bSub').textContent=svc.provider+' \u00b7 '+svc.location+(customiseOnly?' \u00b7 Describe your custom requirements below':'');
  const today=new Date(),minDate=new Date(today.getTime()+7*24*60*60*1000);
  const dateEl=document.getElementById('eventDate');
  dateEl.value='';dateEl.min=minDate.toISOString().split('T')[0];dateEl.classList.remove('error');
  document.getElementById('dateErrMsg').style.display='none';
  document.getElementById('dateHint').style.display='flex';
  document.getElementById('eventTime').value='';
  document.getElementById('customNote').value='';
  document.getElementById('svcTableBody').innerHTML=svc.items.map((item,i)=>`
    <tr><td><label class="svc-row-label" for="icb_${i}"><input type="checkbox" class="svc-cb" id="icb_${i}" data-price="${item.price}" data-label="${item.label}"/><i class="fa-solid ${item.icon} svc-icon"></i>${item.label}</label></td><td>${fmtMoney(item.price)}</td></tr>`).join('');
  if(customiseOnly){
    document.getElementById('customNote').placeholder='Describe your customisation — e.g. specific colours, quantity, timing, special requests, preferences...';
    document.getElementById('customNote').focus();
  } else {
    document.getElementById('customNote').placeholder="Add any special requirements or customisations (optional)...";
  }
  document.querySelectorAll('.svc-cb').forEach(cb=>cb.addEventListener('change',updateEstimate));
  updateEstimate();
  document.getElementById('bookingOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}

async function handleSubmit(){
  const warningMsg = "⚠️ Booking Confirmation & Cancellation Policy:\n\nPlease make sure your event details are confirmed. If you pay an advance to the vendor, please note that in case of cancellation, the advance payment will not be refunded.\n\nDo you want to proceed with this booking request?";
  if(!confirm(warningMsg)) {
    return;
  }
  if(currentIndData&&currentIndData.isIndividual){
    const checked=[...document.querySelectorAll('.svc-cb:checked')];
    const total=checked.reduce((s,c)=>s+parseInt(c.dataset.price),0);
    const svc=currentIndData.svc;
    const dateVal=document.getElementById('eventDate').value;
    const timeVal=document.getElementById('eventTime').value;
    const customNote=document.getElementById('customNote').value.trim();
    
    try {
      const res = await fetch('/api/user/request', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          vendor_listing_id: svc.id,
          package_title: null,
          event_date: dateVal,
          event_time: timeVal,
          services: checked.map(c=>({label:c.dataset.label,price:parseInt(c.dataset.price)})),
          total: total,
          custom_note: customNote
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const reqId = data.booking_id;
        const typeName=serviceTypes.find(t=>t.id===svc.type)?.name||svc.type;
        
        document.getElementById('successSummary').innerHTML=
          `<div class="sum-row"><span>Request ID</span><span><strong style="color:var(--teal);">${reqId}</strong></span></div>`+
          `<div class="sum-row"><span>Status</span><span><strong style="color:var(--pending);">\u23f3 Pending Review</strong></span></div>`+
          `<div class="sum-row"><span>Service Provider</span><span><strong>${svc.name}</strong></span></div>`+
          `<div class="sum-row"><span>Service Type</span><span><strong>${typeName}</strong></span></div>`+
          `<div class="sum-row"><span><i class="fa-regular fa-calendar" style="color:var(--teal);margin-right:5px;"></i>Event Date</span><span><strong>${fmtDate(dateVal)}</strong></span></div>`+
          `<div class="sum-row"><span><i class="fa-regular fa-clock" style="color:var(--teal);margin-right:5px;"></i>Start Time</span><span><strong>${fmtTime(timeVal)}</strong></span></div>`+
          (customNote?`<div class="sum-row"><span><i class="fa-solid fa-pen-nib" style="color:var(--teal);margin-right:5px;"></i>Custom Note</span><span style="font-style:italic;color:var(--ink3);max-width:200px;text-align:right;">${customNote.substring(0,80)}${customNote.length>80?'\u2026':''}</span></div>`:'')+
          checked.map(c=>`<div class="sum-row"><span>${c.dataset.label.substring(0,40)}${c.dataset.label.length>40?'\u2026':''}</span><span>${fmtMoney(parseInt(c.dataset.price))}</span></div>`).join('')+
          `<div class="sum-row total"><span><strong>Estimated Total</strong></span><span><strong>${fmtMoney(total)}</strong></span></div>`;
        document.getElementById('bookingForm').style.display='none';
        const ss=document.getElementById('successScreen');ss.style.display='flex';ss.style.flexDirection='column';
        
        await loadRequests();
        updateReqBadge();
        currentIndData=null;
        currentBookingData=null;
      } else {
        showNotification('Failed to submit request: ' + data.message, 'error');
      }
    } catch(e) {
      console.error("Error creating request:", e);
      showNotification('An error occurred during submission', 'error');
    }
  } else {
    await submitBooking();
  }
}

function loadCategoryFromURL(){
  const urlParams=new URLSearchParams(window.location.search);
  const category=urlParams.get('category');
  if(category&&eventCategories.find(c=>c.id===category)){
    activeCat=category;
    activeServiceType='all';
    renderServicesGrid();renderCats();
    document.getElementById('pkgView').style.display='none';
    document.getElementById('vendorGrid').style.display='block';
    renderVendors();
    setTimeout(()=>{
      document.getElementById('catBar').scrollIntoView({behavior:'smooth',block:'nearest'});
      const ab=document.querySelector('.cat-btn.active');
      if(ab)ab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    },100);
  }
}

async function addToWishlist(itemId,itemData){
  const vendorName = itemData.vendorName || itemData.serviceName || '';
  const eventType = itemData.serviceType || itemData.eventType || '';
  try {
    const res = await fetch('/api/user/wishlist/toggle', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        itemId: itemId,
        vendorName: vendorName,
        eventType: eventType
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      await loadWishlist();
      updateWishlistUI();
      if (data.action === 'added') {
        showNotification('Added to wishlist! ❤️','success');
      } else {
        showNotification('Removed from wishlist','info');
      }
    }
  } catch (e) {
    console.error("Error toggling wishlist:", e);
  }
}

async function removeFromWishlist(itemId){
  try {
    const res = await fetch('/api/user/wishlist/toggle', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        itemId: itemId
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      await loadWishlist();
      updateWishlistUI();
      renderWishlistUI();
      showNotification('Removed from wishlist','info');
    }
  } catch (e) {
    console.error("Error removing from wishlist:", e);
  }
}

function isInWishlist(itemId){
  return wishlistItems.some(w=>w.id===itemId);
}

function updateWishlistUI(){
  const badge=document.getElementById('wishlist-count');
  if(wishlistItems.length>0){
    badge.style.display='inline';
    badge.textContent=`(${wishlistItems.length})`;
  } else {
    badge.style.display='none';
  }
  document.querySelectorAll('[data-wishlist-heart]').forEach(btn=>{
    const itemId=btn.dataset.itemId;
    if(isInWishlist(itemId)){
      btn.classList.add('in-wishlist');
      btn.innerHTML='<i class="fa-solid fa-heart"></i>';
    } else {
      btn.classList.remove('in-wishlist');
      btn.innerHTML='<i class="fa-regular fa-heart"></i>';
    }
  });
}

function openWishlistModal(){
  const overlay=document.getElementById('wishlistOverlay');
  const body=document.getElementById('wishlistBody');
  if(!wishlistItems.length){
    body.innerHTML='<div style="text-align:center;padding:60px 20px;"><div style="font-size:48px;margin-bottom:20px;">❤️</div><h3>Your Wishlist is Empty</h3><p style="color:var(--ink3);margin-bottom:20px;">Add vendors to your wishlist to save them for later</p><button class="book-now-btn" onclick="closeWishlistModal();selectCategory(\'wedding\');" style="background:var(--teal);">Browse Vendors</button></div>';
  } else {
    body.innerHTML=`<div style="padding:20px;"><h4 style="margin-bottom:15px;"><i class="fa-solid fa-list"></i> ${wishlistItems.length} Item${wishlistItems.length!==1?'s':''} in Wishlist</h4>`+
    wishlistItems.map(w=>{
      let vendor,individual;
      if(w.type==='package'){
        vendor=vendors.find(v=>v.id===w.vendorId);
        if(!vendor)return'';
        return `<div style="background:#f9f9f9;padding:15px;margin:10px 0;border-radius:8px;border-left:4px solid var(--teal);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:15px;">
            <div style="flex:1;">
              <div style="font-weight:600;color:var(--ink);margin-bottom:5px;">${vendor.name}</div>
              <div style="color:var(--ink3);font-size:13px;margin-bottom:8px;"><i class="fa-solid fa-layer-group" style="margin-right:6px;color:var(--teal);"></i>${w.packageCount} package${w.packageCount!==1?'s':''}</div>
              <div style="color:var(--ink3);font-size:13px;"><i class="fa-solid fa-star" style="color:gold;margin-right:6px;"></i>${vendor.rating} • ${vendor.location}</div>
            </div>
            <div style="text-align:right;">
              <button class="book-now-btn" style="padding:8px 12px;font-size:12px;background:var(--teal);color:white;border:none;border-radius:4px;cursor:pointer;margin-bottom:5px;" onclick="removeFromWishlist('${w.id}');"><i class="fa-solid fa-trash"></i> Remove</button>
              <button class="book-now-btn" style="padding:8px 12px;font-size:12px;background:#50a0d0;color:white;border:none;border-radius:4px;cursor:pointer;display:block;" onclick="closeWishlistModal();openPackages('${w.vendorId}');"><i class="fa-solid fa-arrow-right"></i> View</button>
            </div>
          </div>
        </div>`;
      } else {
        individual=individualServices.find(s=>s.id===w.serviceId);
        if(!individual)return'';
        return `<div style="background:#f9f9f9;padding:15px;margin:10px 0;border-radius:8px;border-left:4px solid var(--teal);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:15px;">
            <div style="flex:1;">
              <div style="font-weight:600;color:var(--ink);margin-bottom:5px;">${individual.name}</div>
              <div style="color:var(--ink3);font-size:13px;margin-bottom:8px;"><i class="fa-solid fa-tag" style="margin-right:6px;color:var(--teal);"></i>${w.serviceType}</div>
              <div style="color:var(--ink3);font-size:13px;"><i class="fa-solid fa-star" style="color:gold;margin-right:6px;"></i>${individual.rating} • ${individual.location}</div>
            </div>
            <div style="text-align:right;">
              <button class="book-now-btn" style="padding:8px 12px;font-size:12px;background:var(--teal);color:white;border:none;border-radius:4px;cursor:pointer;margin-bottom:5px;" onclick="removeFromWishlist('${w.id}');"><i class="fa-solid fa-trash"></i> Remove</button>
              <button class="book-now-btn" style="padding:8px 12px;font-size:12px;background:#50a0d0;color:white;border:none;border-radius:4px;cursor:pointer;display:block;" onclick="closeWishlistModal();openIndProvider('${w.serviceId}');"><i class="fa-solid fa-arrow-right"></i> View</button>
            </div>
          </div>
        </div>`;
      }
    }).join('')+'</div>';
  }
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
}

function renderWishlistUI(){
  openWishlistModal();
}

function closeWishlistModal(){
  document.getElementById('wishlistOverlay').classList.remove('open');
  document.body.style.overflow='';
}

function showNotification(msg,type='info'){
  const n=document.createElement('div');
  n.textContent=msg;
  n.style.cssText=`position:fixed;bottom:20px;right:20px;padding:12px 20px;background:${type==='success'?'#4caf50':type==='error'?'#f44336':'#2196f3'};color:white;border-radius:4px;font-size:14px;z-index:9999;animation:slideIn 0.3s ease;`;
  document.body.appendChild(n);
  setTimeout(()=>{n.style.animation='slideOut 0.3s ease';setTimeout(()=>n.remove(),300);},3000);
}

// Add style for notification animation
const style=document.createElement('style');
style.textContent=`
  @keyframes slideIn{from{transform:translateX(400px);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes slideOut{from{transform:translateX(0);opacity:1;}to{transform:translateX(400px);opacity:0;}}
  button[data-wishlist-heart]{background:none;border:none;cursor:pointer;font-size:18px;padding:5px;transition:all 0.2s ease;}
  button[data-wishlist-heart].in-wishlist i{color:var(--teal);}
`;
document.head.appendChild(style);


// --------------user menu and dropdown logic--------------//

function toggleDropdown(id) {
  closeAll();
  let el = document.getElementById(id);
  el.style.display = el.style.display === "block" ? "none" : "block";
}

function toggleUserMenu() {
  closeAll();
  let menu = document.getElementById("userDropdown");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function selectOption(el) {
  let btn = el.parentElement.previousElementSibling;
  btn.innerText = el.innerText + " ⌄";
  el.parentElement.style.display = "none";
}

function logout() {
  const userConfirmed = confirm("Are you sure you want to log out?");
  if (userConfirmed) {
    window.location.href = "/logout";
  }
}

function changePassword() {
  alert("Change Password feature coming soon!\n\nYou will be able to change your password by:\n1. Verifying your current password\n2. Setting a new password\n3. Confirming the new password");
}

/* Close all dropdowns */
function closeAll() {
  document.querySelectorAll(".dropdown-content, .user-dropdown")
    .forEach(d => d.style.display = "none");
}

window.onclick = function(e) {
  if (!e.target.closest('.dropdown') && !e.target.closest('.user-menu')) {
    closeAll();
  }
}

// Wait for DOM to be ready before initializing
document.addEventListener('DOMContentLoaded', async function(){
  // 1. Fetch data from backend API
  await initData();
  await loadWishlist();
  await loadRequests();
  await loadNotifications();

  // 2. Render all components
  renderServicesGrid();
  renderCats();
  renderVendors();
  updateReqBadge();
  updateWishlistUI();
  loadCategoryFromURL();

  // 3. Set up event listeners
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('pkgView').style.display='none';
      document.getElementById('vendorGrid').style.display='block';
    });
  }

  const indBackBtn = document.getElementById('indBackBtn');
  if (indBackBtn) {
    indBackBtn.addEventListener('click', () => {
      document.getElementById('indDetailView').style.display='none';
      document.getElementById('individualView').style.display='block';
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

  const closeSuccessBtn = document.getElementById('closeSuccessBtn');
  if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeModal);

  const viewRequestsBtn = document.getElementById('viewRequestsBtn');
  if (viewRequestsBtn) {
    viewRequestsBtn.addEventListener('click', () => {
      closeModal();
      openRequestsPanel();
    });
  }

  const bookingOverlay = document.getElementById('bookingOverlay');
  if (bookingOverlay) {
    bookingOverlay.addEventListener('click', function(e) {
      if(e.target===this) closeModal();
    });
  }

  const myRequestsBtn = document.getElementById('myRequestsBtn');
  if (myRequestsBtn) myRequestsBtn.addEventListener('click', openRequestsPanel);

  const rpCloseBtn = document.getElementById('rpCloseBtn');
  if (rpCloseBtn) rpCloseBtn.addEventListener('click', closeRequestsPanel);

  const requestsOverlay = document.getElementById('requestsOverlay');
  if (requestsOverlay) requestsOverlay.addEventListener('click', closeRequestsPanel);

  const searchInput = document.getElementById('userSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (currentMode === 'individual') {
        renderIndividualCards();
      } else {
        renderVendors();
      }
    });
  }

  document.addEventListener('keydown', e => {
    if(e.key==='Escape') {
      closeModal();
      closeRequestsPanel();
    }
  });
});

async function loadAndRenderVendorReviews(vendorId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `<div style="color:var(--ink3); font-size:14px; font-style:italic;"><i class="fa-solid fa-spinner fa-spin"></i> Loading reviews...</div>`;
  
  try {
    const res = await fetch(`/api/vendor/${vendorId}/reviews`);
    const data = await res.json();
    const reviews = data.reviews || [];
    
    if (reviews.length === 0) {
      container.innerHTML = `<div style="color:var(--ink3); font-size:14px; font-style:italic; padding:10px 0;">No reviews yet for this vendor. Be the first to book and rate them!</div>`;
      return;
    }
    
    container.innerHTML = reviews.map(r => {
      const stars = '★'.repeat(Math.round(r.rating)) + '☆'.repeat(5 - Math.round(r.rating));
      const img = r.profile_image || '/static/images/default_avatar.svg';
      const replyHtml = r.reply_text ? `
        <div style="margin-top: 10px; padding: 10px 15px; background: #f8fafc; border-left: 3px solid #64748b; border-radius: 4px; font-size: 13px; color: #475569;">
          <strong>Vendor's Reply:</strong> "${r.reply_text}"
        </div>
      ` : '';
      
      return `
        <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 8px; margin-bottom:10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${img}" alt="${r.username}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
              <div>
                <div style="font-weight: 600; font-size: 14px; color: #1e293b;">${r.username}</div>
                <div style="font-size: 11px; color: #64748b;">Reviewed on ${r.created_at}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="color: #fbbf24; font-size: 14px;">${stars}</span>
              <span style="font-size: 13px; font-weight: 600; color: #1e293b;">${r.rating}</span>
            </div>
          </div>
          <div style="font-size: 14px; color: #1e293b; font-weight: 500; line-height: 1.6; font-style: italic;">
            "${r.review_text}"
          </div>
          ${replyHtml}
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error("Error loading vendor reviews:", e);
    container.innerHTML = `<div style="color:var(--maroon-lt); font-size:14px; font-style:italic;">Failed to load reviews.</div>`;
  }
}

// Toggle notification dropdown visibility
function toggleNotificationDropdown(e) {
  if (e) e.stopPropagation();
  closeAll();
  const dropdown = document.getElementById("notificationDropdown");
  if (dropdown) {
    const isHidden = dropdown.style.display === "none" || !dropdown.style.display;
    dropdown.style.display = isHidden ? "flex" : "none";
  }
}

// Mark all notifications as read and refresh the UI
async function markNotificationsAsRead(e) {
  if (e) e.stopPropagation();
  try {
    const res = await fetch('/api/user/notifications/read', { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      const badge = document.getElementById('notification-badge');
      if (badge) badge.style.display = 'none';
      await loadNotifications();
    }
  } catch (err) {
    console.error("Error marking notifications as read:", err);
  }
}

// Load and display user notifications (bell badge, dropdown alerts)
async function loadNotifications() {
  try {
    const res = await fetch('/api/user/notifications');
    const data = await res.json();
    const notifications = data.notifications || [];
    
    // 1. Update the notification badge
    const unread = notifications.filter(n => n.is_read === 0);
    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (unread.length > 0) {
        badge.textContent = unread.length;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    // 2. Populate the notification dropdown list
    const dropdownList = document.getElementById('notificationDropdownList');
    if (dropdownList) {
      if (!notifications.length) {
        dropdownList.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
            No new alerts.
          </div>
        `;
      } else {
        dropdownList.innerHTML = notifications.map(n => {
          const bgStyle = n.is_read === 0 ? 'background-color: #f0f9ff;' : '';
          let dotColor = '#3b82f6';
          if (n.message.toLowerCase().includes('confirm') || n.message.toLowerCase().includes('approve')) dotColor = '#22c55e';
          if (n.message.toLowerCase().includes('cancel') || n.message.toLowerCase().includes('reject')) dotColor = '#ef4444';
          
          return `
            <div style="padding: 10px 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; display: flex; align-items: flex-start; gap: 8px; ${bgStyle}">
              <span style="height: 8px; width: 8px; border-radius: 50%; background-color: ${dotColor}; display: inline-block; margin-top: 5px; flex-shrink: 0;"></span>
              <div style="flex-grow: 1; color: #334155;">
                <p style="margin: 0; line-height: 1.4;">${n.message}</p>
                <span style="font-size: 10px; color: #94a3b8;">${new Date(n.created_at).toLocaleString()}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error("Error loading notifications:", err);
  }
}
