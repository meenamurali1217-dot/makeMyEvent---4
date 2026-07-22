// about_logic.js - User about page logic and wishlist/user management

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

/* =========================================
   CUSTOM REQUEST FORM HANDLING
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    const requestForm = document.querySelector('.request-form');
    
    if(requestForm) {
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const eventType = document.getElementById('eventType').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const requirements = document.getElementById('requirements').value;
            
            if(!eventType || !email.trim() || !phone.trim() || !requirements.trim()) {
                alert('Please fill in all fields');
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(!emailPattern.test(email.trim())) {
                alert('Please enter a valid email address');
                return;
            }

            const phonePattern = /^\+?[0-9\s\-]{8,20}$/;
            if(!phonePattern.test(phone.trim())) {
                alert('Please enter a valid phone number');
                return;
            }
            
            // Create success toast notification
            const toast = document.createElement('div');
            toast.textContent = '✓ Your inquiry has been submitted successfully!';
            Object.assign(toast.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: 'linear-gradient(135deg, #89c3ea, #18aef3)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '25px',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 8px 20px rgba(24, 174, 243, 0.3)',
                zIndex: 9999,
                animation: 'slideInRight 0.4s ease'
            });
            
            document.body.appendChild(toast);
            
            // Reset form
            requestForm.reset();
            
            // Remove toast after 4 seconds
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.4s ease';
                setTimeout(() => toast.remove(), 400);
            }, 4000);
        });
    }
});

// Add animation styles
if(!document.querySelector('style[data-form-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-form-animations', 'true');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }
    `;
    document.head.appendChild(style);
}

//  WISHLIST MANAGEMENT FOR ABOUT PAGE

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

async function loadWebsiteReviews() {
  try {
    const res = await fetch('/api/public/website-reviews');
    const data = await res.json();
    const reviews = data.reviews || [];
    if (reviews.length > 0) {
      const grid = document.getElementById('dynamic-reviews') || document.querySelector('.reviews-grid');
      if (grid) {
        grid.innerHTML = reviews.map(r => {
          const img = r.profile_image || '/static/images/default_avatar.svg';
          let starHtml = '';
          const rating = Math.round(r.rating);
          for(let i=1; i<=5; i++) {
              if (i <= rating) {
                  starHtml += '<i class="fa-solid fa-star"></i>';
              } else {
                  starHtml += '<i class="fa-regular fa-star"></i>';
              }
          }
          return `
            <div class="testimonial-card">
              <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
              <div class="rating-stars">${starHtml}</div>
              <p class="testimonial-text">"${r.feedback}"</p>
              <div class="client-info">
                <img src="${img}" alt="${r.username}">
                <div>
                  <h4>${r.username}</h4>
                  <p>Customer</p>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch(e) {
    console.error("Error loading website reviews:", e);
  }
}

// Initialize wishlist and notifications on page load
document.addEventListener('DOMContentLoaded', async function(){
  await loadWishlist();
  updateWishlistBadge();
  await loadWebsiteReviews();
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
