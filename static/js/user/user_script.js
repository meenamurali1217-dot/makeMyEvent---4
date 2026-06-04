// user_script.js - User profile dashboard logic and dynamic booking fetching

// Sidebar Navigation
function openSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (sidebar && overlay) {
        sidebar.style.left = "0";
        overlay.style.display = "block";
        document.body.style.overflow = "hidden";
    }
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (sidebar && overlay) {
        sidebar.style.left = "-300px";
        overlay.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

// Glow effect on search
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
    searchInput.addEventListener('focus', function() {
        this.parentElement.style.boxShadow = "0 0 8px rgba(33, 150, 243, 0.3)";
    });
    searchInput.addEventListener('blur', function() {
        this.parentElement.style.boxShadow = "none";
    });
}

// User Menu Dropdown
function toggleUserMenu() {
    closeAll();
    let menu = document.getElementById("userDropdown");
    if (menu) {
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    }
}

function closeAll() {
    document.querySelectorAll(".user-dropdown").forEach(d => d.style.display = "none");
}

window.addEventListener('click', function(e) {
    if (!e.target.closest('.user-menu') && !e.target.closest('.icon-btn')) {
        closeAll();
    }
});

// Logout
function logout() {
    const userConfirmed = confirm("Are you sure you want to log out?");
    if (userConfirmed) {
        window.location.href = "/logout";
    }
}

function changePassword() {
    alert("Change Password feature coming soon!\n\nYou will be able to change your password by:\n1. Verifying your current password\n2. Setting a new password\n3. Confirming the new password");
}

// Edit Profile Modal
function openEditProfileModal() {
    document.getElementById('editProfileOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditProfileModal() {
    document.getElementById('editProfileOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

// WISHLIST MANAGEMENT
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

// DYNAMIC BOOKINGS FETCHING
let userRequests = [];

function fmtMoney(n){
  if(n>=10000000)return '\u20b9'+(n/10000000).toFixed(2).replace(/\.?0+$/,'')+' Cr';
  if(n>=100000)return '\u20b9'+(n/100000).toFixed(2).replace(/\.?0+$/,'')+' L';
  return '\u20b9'+n.toLocaleString('en-IN');
}

async function loadBookings() {
  try {
    const res = await fetch('/api/user/requests');
    const data = await res.json();
    userRequests = data.requests || [];
    renderDashboard();
  } catch(e) {
    console.error("Error loading bookings:", e);
  }
}

function renderDashboard() {
  // Update stats
  const activeBookings = userRequests.filter(r => ['in-progress', 'confirmed'].includes(r.status));
  const pendingBookings = userRequests.filter(r => r.status === 'pending');
  const totalSpent = userRequests.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.total, 0);

  document.getElementById('statActive').textContent = activeBookings.length;
  document.getElementById('statPending').textContent = pendingBookings.length;
  document.getElementById('statSpent').textContent = fmtMoney(totalSpent);

  // Render bookings list
  const container = document.getElementById('bookingsList');
  if(!userRequests.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; background:#f9f9f9; border-radius:10px; border:1px dashed #ddd; margin-top:15px;">
        <i class="fa-solid fa-calendar-xmark" style="font-size:36px; color:#aaa; margin-bottom:15px;"></i>
        <h3 style="color:#666; margin-bottom:5px;">No bookings found</h3>
        <p style="color:#888; font-size:14px; margin-bottom:15px;">You haven't requested any vendor services yet.</p>
        <button onclick="location.href='/user/services'" style="background:var(--teal); color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">Plan Your Event</button>
      </div>
    `;
    return;
  }

  // Event category images fallback mapping
  const imgFallback = {
    'wedding': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
    'birthday': 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?q=80&w=2069&auto=format&fit=crop',
    'corporate': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop'
  };

  container.innerHTML = userRequests.map(r => {
    const img = imgFallback[r.category] || imgFallback['default'];
    const statusClass = r.status; // pending, confirmed, rejected, in-progress, completed
    const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);
    
    let reviewBtnHtml = '';
    if (r.status === 'completed' || r.status === 'confirmed') {
      if (r.hasReview) {
        reviewBtnHtml = `<span style="font-size:12px; color:var(--teal); font-weight:600; display:block; margin-top:5px; text-align:center;"><i class="fa-solid fa-circle-check"></i> Reviewed</span>`;
      } else {
        reviewBtnHtml = `<button class="action-btn" style="margin-top:5px; width:100%;" onclick="openVendorReviewModal(${r.booking_id_raw}, ${r.vendorId}, '${r.vendorName.replace(/'/g, "\\'")}')">Rate Vendor</button>`;
      }
    }

    let cancelBtnHtml = '';
    if (r.status === 'pending' || r.status === 'confirmed' || r.status === 'approved') {
      cancelBtnHtml = `<button class="action-btn outline" style="margin-top:5px; width:100%; border-color:#ef4444; color:#ef4444;" onclick="openCancelBookingModal(${r.booking_id_raw}, '${r.vendorName.replace(/'/g, "\\'")}')">Cancel Booking</button>`;
    }

    let messageBtnHtml = '';
    if (r.vendorUserId) {
      messageBtnHtml = `<button class="action-btn outline" style="margin-top:5px; width:100%;" onclick="location.href='/user/messages?vendor_user_id=${r.vendorUserId}'">Message Vendor</button>`;
    }

    let detailsAlert = `Booking details:\\nVendor: ${r.vendorName}\\nPackage: ${r.packageTitle || 'Custom'}\\nDate: ${r.eventDateDisplay}\\nTime: ${r.eventTimeDisplay}\\nTotal: ${fmtMoney(r.total)}\\nStatus: ${statusLabel}`;
    if (r.status === 'cancelled' && r.cancellationReason) {
      detailsAlert += `\\nCancellation Reason: ${r.cancellationReason.replace(/'/g, "\\'")}`;
    }
    detailsAlert += `\\n\\nServices Requested:\\n${r.services.map(s => '- ' + s.label + ' (' + fmtMoney(s.price) + ')').join('\\n')}`;

    return `
      <div class="booking-item">
        <img src="${img}" alt="${r.vendorName}">
        <div class="booking-info">
          <h3>${r.vendorName}</h3>
          <p style="font-size:14px; font-weight:600; color:var(--teal); margin: 3px 0 6px 0;">${r.packageTitle || 'Custom Services'}</p>
          <span class="date"><i class="fa-regular fa-calendar"></i> ${r.eventDateDisplay} at ${r.eventTimeDisplay}</span>
          <span class="service-type">Total: ${fmtMoney(r.total)} &bull; ${r.services.length} items</span>
        </div>
        <div class="booking-status">
          <span class="status-badge ${statusClass}">${statusLabel}</span>
          <button class="action-btn outline" onclick="alert('${detailsAlert}')">View Details</button>
          ${reviewBtnHtml}
          ${cancelBtnHtml}
          ${messageBtnHtml}
        </div>
      </div>
    `;
  }).join('');

  // Handled by loadNotifications()
}

// WEBSITE FEEDBACK RATING FUNCTIONS
function openWebsiteFeedbackModal() {
  document.getElementById('websiteFeedbackOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setWebsiteRating(5); // Default to 5 stars
  document.getElementById('websiteFeedbackText').value = '';
}

function closeWebsiteFeedbackModal() {
  document.getElementById('websiteFeedbackOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

function setWebsiteRating(val) {
  document.getElementById('websiteRatingVal').value = val;
  const stars = document.querySelectorAll('.rating-stars .star');
  stars.forEach((s, idx) => {
    if (idx < val) {
      s.style.color = '#fbbf24';
    } else {
      s.style.color = '#ccc';
    }
  });
}

// VENDOR REVIEW RATING FUNCTIONS
function openVendorReviewModal(bookingId, vendorId, vendorName) {
  document.getElementById('reviewBookingId').value = bookingId;
  document.getElementById('reviewVendorId').value = vendorId;
  document.getElementById('vendorReviewTitle').textContent = `Rate ${vendorName}`;
  document.getElementById('vendorReviewOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setVendorRating(5); // Default to 5 stars
  document.getElementById('vendorReviewText').value = '';
}

function closeVendorReviewModal() {
  document.getElementById('vendorReviewOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

function setVendorRating(val) {
  document.getElementById('vendorRatingVal').value = val;
  const stars = document.querySelectorAll('.rating-stars-vendor .star-vendor');
  stars.forEach((s, idx) => {
    if (idx < val) {
      s.style.color = '#fbbf24';
    } else {
      s.style.color = '#ccc';
    }
  });
}

// Notification Helper
function showNotification(msg, type='success') {
  const n = document.createElement('div');
  n.textContent = msg;
  let bg = '#4caf50'; // success
  if (type === 'error') bg = '#f44336';
  else if (type === 'info') bg = '#2196f3';
  n.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 20px;background:${bg};color:white;border-radius:4px;font-size:14px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
  document.body.appendChild(n);
  setTimeout(() => { n.remove(); }, 3000);
}

// Form Submission handling
document.addEventListener('DOMContentLoaded', function() {
  const websiteForm = document.getElementById('websiteFeedbackForm');
  if (websiteForm) {
    websiteForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const rating = document.getElementById('websiteRatingVal').value;
      const feedback = document.getElementById('websiteFeedbackText').value.trim();
      
      if (!rating) {
        alert('Please select a rating');
        return;
      }
      
      try {
        const res = await fetch('/api/user/website-feedback', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ rating: parseFloat(rating), feedback: feedback })
        });
        const data = await res.json();
        if (data.status === 'success') {
          showNotification('Feedback submitted! Thank you! ❤️');
          closeWebsiteFeedbackModal();
        } else {
          showNotification(data.message || 'Submission failed', 'error');
        }
      } catch (err) {
        console.error('Error submitting feedback:', err);
        showNotification('Submission error', 'error');
      }
    });
  }

  const vendorForm = document.getElementById('vendorReviewForm');
  if (vendorForm) {
    vendorForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const bookingId = document.getElementById('reviewBookingId').value;
      const rating = document.getElementById('vendorRatingVal').value;
      const reviewText = document.getElementById('vendorReviewText').value.trim();
      
      if (!rating) {
        alert('Please select a rating');
        return;
      }
      
      try {
        const res = await fetch(`/api/user/booking/${bookingId}/review`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ rating: parseFloat(rating), review_text: reviewText })
        });
        const data = await res.json();
        if (data.status === 'success') {
          showNotification('Review submitted successfully! 🤝');
          closeVendorReviewModal();
          await loadBookings(); // Reload bookings to update UI state (Reviewed)
        } else {
          showNotification(data.message || 'Submission failed', 'error');
        }
      } catch (err) {
        console.error('Error submitting vendor review:', err);
        showNotification('Submission error', 'error');
      }
    });
  }

  const cancelForm = document.getElementById('cancelBookingForm');
  if (cancelForm) {
    cancelForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const bookingId = document.getElementById('cancelBookingId').value;
      const reasonType = document.getElementById('cancelReasonSelect').value;
      const explanation = document.getElementById('cancelExplanation').value.trim();
      const fullReason = `${reasonType}: ${explanation}`;
      
      if (!reasonType || !explanation) {
        alert('Please fill out all cancellation fields');
        return;
      }
      
      try {
        const res = await fetch(`/api/user/booking/${bookingId}/cancel`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ reason: fullReason })
        });
        const data = await res.json();
        if (data.status === 'success') {
          showNotification('Booking cancelled successfully.');
          closeCancelBookingModal();
          await loadBookings();
        } else {
          showNotification(data.message || 'Cancellation failed', 'error');
        }
      } catch (err) {
        console.error('Error cancelling booking:', err);
        showNotification('Cancellation error', 'error');
      }
    });
  }
});

function openCancelBookingModal(bookingId, vendorName) {
  document.getElementById('cancelBookingId').value = bookingId;
  document.getElementById('cancelBookingTitle').textContent = `Cancel ${vendorName}`;
  document.getElementById('cancelReasonSelect').value = '';
  document.getElementById('cancelExplanation').value = '';
  document.getElementById('cancelBookingOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeCancelBookingModal() {
  document.getElementById('cancelBookingOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// Initialise page logic
document.addEventListener('DOMContentLoaded', async function(){
  await loadWishlist();
  updateWishlistBadge();
  await loadBookings();
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
      await loadNotifications(); // Refresh dropdown and activity list
    }
  } catch (err) {
    console.error("Error marking notifications as read:", err);
  }
}

// Load and display user notifications (bell badge, dropdown alerts, and recent activity list)
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
          // Unread notifications get a soft blue background highlighting
          const bgStyle = n.is_read === 0 ? 'background-color: #f0f9ff;' : '';
          let dotColor = '#3b82f6'; // info/default (blue)
          if (n.message.toLowerCase().includes('confirm') || n.message.toLowerCase().includes('approve')) dotColor = '#22c55e'; // success (green)
          if (n.message.toLowerCase().includes('cancel') || n.message.toLowerCase().includes('reject')) dotColor = '#ef4444'; // danger (red)
          
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
    
    // 3. Show unread notifications as toasts (sequential pop-ups)
    // To prevent toast spam on every page load, we only toast them if they haven't been shown in this page session.
    if (!window.toastedNotifications) {
      window.toastedNotifications = new Set();
    }
    
    unread.forEach((n, idx) => {
      if (!window.toastedNotifications.has(n.notification_id)) {
        window.toastedNotifications.add(n.notification_id);
        setTimeout(() => {
          showNotification(n.message, 'info');
        }, idx * 1000);
      }
    });
    
    // 4. Populate recent activity list in the profile sidebar
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
      if (!notifications.length) {
        activityList.innerHTML = '<li><span class="dot blue"></span> Welcome to your dashboard! No recent updates.</li>';
      } else {
        activityList.innerHTML = notifications.slice(0, 5).map(n => {
          let dotColor = 'blue';
          if (n.message.toLowerCase().includes('confirm') || n.message.toLowerCase().includes('approve')) dotColor = 'green';
          if (n.message.toLowerCase().includes('cancel') || n.message.toLowerCase().includes('reject')) dotColor = 'red';
          
          return `<li><span class="dot ${dotColor}"></span> ${n.message}</li>`;
        }).join('');
      }
    }
  } catch (e) {
    console.error("Error loading notifications:", e);
  }
}
