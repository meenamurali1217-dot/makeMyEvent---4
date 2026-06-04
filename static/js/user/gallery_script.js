// gallery_script.js - User gallery page logic and wishlist/user management

function toggleDropdown(id) {
  closeAll();
  let el = document.getElementById(id);
  if (el) el.style.display = el.style.display === "block" ? "none" : "block";
}

function toggleUserMenu() {
  closeAll();
  let menu = document.getElementById("userDropdown");
  if (menu) menu.style.display = menu.style.display === "block" ? "none" : "block";
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

/* FILTER */
const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.card');

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const value = btn.dataset.filter;

    cards.forEach(card => {
      if(value === "all" || card.classList.contains(value)){
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  });
});

/* MODAL IMAGE */
function openModal(card){
  document.getElementById("modal").style.display="flex";
  document.getElementById("modalImg").src = card.querySelector("img").src;
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}

let index = 0;
const slides = document.querySelector(".slides");
const total = slides ? slides.children.length : 0;

function showSlide() {
  if (slides) {
    slides.style.transform = `translateX(-${index * 100}%)`;
  }
}

function nextSlide() {
  if (total) {
    index = (index + 1) % total;
    showSlide();
  }
}

function prevSlide() {
  if (total) {
    index = (index - 1 + total) % total;
    showSlide();
  }
}

function openSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  if (sidebar && overlay) {
    sidebar.style.left = "0";
    overlay.style.display = "block";
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  if (sidebar && overlay) {
    sidebar.style.left = "-300px";
    overlay.style.display = "none";
  }
}

//  WISHLIST MANAGEMENT FOR GALLERY PAGE

let wishlistItems=[];

async function loadWishlist() {
  try {
    const res = await fetch('/api/user/wishlist');
    const data = await res.json();
    wishlistItems = (data.wishlist || []).map(w => {
      const isPackage = w.type === 'package';
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

function updateWishlistBadge(){
  const badge=document.getElementById('wishlist-count');
  if(!badge) return;
  if(wishlistItems.length>0){
    badge.style.display='inline';
    badge.textContent=`(${wishlistItems.length})`;
  } else {
    badge.style.display='none';
  }
}

function openWishlistModal(){
  const overlay = document.getElementById('wishlistOverlay');
  const body = document.getElementById('wishlistBody');
  if(!wishlistItems.length){
    body.innerHTML=`
      <div style="text-align:center;padding:40px 0;">
        <div style="font-size:60px;margin-bottom:20px;">❤️</div>
        <h3 style="margin-bottom:10px;color:#333;">Your Wishlist is Empty</h3>
        <p style="color:#666;margin-bottom:20px;">Add vendors to your wishlist to save them for later</p>
        <button onclick="closeWishlistModal();location.href='/user/services'" style="background:#18aef3;color:white;border:none;padding:10px 25px;border-radius:6px;cursor:pointer;font-weight:600;">Browse Vendors</button>
      </div>
    `;
  } else {
    body.innerHTML=`
      <div style="border-top:1px solid #eee;padding-top:15px;">
        ${wishlistItems.map(w=>`
          <div style="padding:15px;background:#f9f9f9;margin-bottom:10px;border-radius:6px;border-left:4px solid #18aef3;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:600;margin-bottom:4px;color:#333;">${w.vendorName}</div>
              <div style="color:#666;font-size:14px;">
                ${w.type==='package'?`<i class="fa-solid fa-layer-group" style="margin-right:6px;color:#18aef3;"></i>Package`:`<i class="fa-solid fa-tag" style="margin-right:6px;color:#18aef3;"></i>${w.eventType}`}
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button onclick="removeWishlistItem('${w.id}');this.parentElement.parentElement.remove();" style="background:#ff6b6b;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;">Remove</button>
              <button onclick="closeWishlistModal();location.href='/user/services?category=${w.eventType}'" style="background:#50a0d0;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;">View</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;">
        <button onclick="closeWishlistModal();location.href='/user/services'" style="width:100%;background:#18aef3;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:15px;">Browse More Vendors</button>
      </div>
    `;
  }
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeWishlistModal(){
  document.getElementById('wishlistOverlay').style.display='none';
  document.body.style.overflow='';
}

async function removeWishlistItem(itemId){
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
      updateWishlistBadge();
    }
  } catch (e) {
    console.error("Error removing from wishlist:", e);
  }
}

// Initialize wishlist and notifications on page load
document.addEventListener('DOMContentLoaded', async function(){
  await loadWishlist();
  updateWishlistBadge();
  await loadNotifications();
});

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
