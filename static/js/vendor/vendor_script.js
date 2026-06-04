/* =========================================
   SEARCH BOX HIGHLIGHT EFFECT
   ========================================= */
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
    searchInput.addEventListener('focus', function() {
        this.parentElement.style.boxShadow = "0 0 8px rgba(33, 150, 243, 0.3)";
    });
    searchInput.addEventListener('blur', function() {
        this.parentElement.style.boxShadow = "none";
    });
}

/* =========================================
   DASHBOARD ACTIONS
   ========================================= */

function respondBooking(btn, action) {
    const row = btn.closest('tr');
    const actionsDiv = row.querySelector('.action-buttons');
    
    if (action === 'accepted') {
        if(confirm("Accept this booking request?")) {
            actionsDiv.innerHTML = '<span class="tag low" style="font-size:12px; padding: 5px 10px;">Accepted</span>';
            row.style.backgroundColor = '#f0fdf4';
            showToast("Booking accepted successfully!");
        }
    } else if (action === 'declined') {
        if(confirm("Decline this booking request?")) {
            actionsDiv.innerHTML = '<span class="tag high" style="font-size:12px; padding: 5px 10px;">Declined</span>';
            row.style.backgroundColor = '#fef2f2'; 
            row.style.opacity = '0.6';
            showToast("Booking declined.");
        }
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/* =========================================
   ADD SERVICE MODAL LOGIC
   ========================================= */
function openServiceModal() {
    document.getElementById("serviceModal").style.display = "flex";
}

function closeServiceModal() {
    document.getElementById("serviceModal").style.display = "none";
}

function handleServiceSubmit(event) {
    event.preventDefault(); // Prevent page reload

    // Collect Data
    const name = document.getElementById("serviceName").value;
    const price = document.getElementById("servicePrice").value;
    const category = document.getElementById("serviceCategory").value;
    const files = document.getElementById("serviceImages").files;

    // Simulate Saving process
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    setTimeout(() => {
        // Reset form and UI
        btn.innerText = originalText;
        btn.disabled = false;
        document.getElementById("addServiceForm").reset();
        closeServiceModal();
        
        // Show success feedback
        showToast(`Service "${name}" added to ${category} category!`);
    }, 1500);
}

/* =========================================
   CALENDAR MODAL LOGIC
   ========================================= */
function openCalendarModal() {
    renderCalendar();
    document.getElementById("calendarModal").style.display = "flex";
}

function closeCalendarModal() {
    document.getElementById("calendarModal").style.display = "none";
}

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = ""; // Clear existing

    const date = new Date();
    const currentMonth = date.getMonth(); // 0-11
    const currentYear = date.getFullYear();

    // First day of the month (0=Sun, 1=Mon...)
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // Total days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Dummy Events Data
    const events = {
        14: { title: "Corporate Gala", type: "corporate" },
        20: { title: "Rahul's Wedding", type: "wedding" },
        25: { title: "B'day Bash", type: "private" }
    };

    // Fill Empty Slots before 1st of month
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.classList.add("day", "empty");
        grid.appendChild(emptyDiv);
    }

    // Fill Actual Days
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.innerText = i;

        // Highlight Today
        if (i === date.getDate()) {
            dayDiv.classList.add("today");
        }

        // Add Event Marker if exists
        if (events[i]) {
            const marker = document.createElement("span");
            marker.classList.add("event-marker");
            if(events[i].type === 'wedding') marker.classList.add("wedding");
            marker.innerText = events[i].title;
            dayDiv.appendChild(marker);
        }

        grid.appendChild(dayDiv);
    }
}

// Close modals if clicked outside content box
// Close modals if clicked outside content box
window.onclick = function(event) {
    const sModal = document.getElementById("serviceModal");
    const cModal = document.getElementById("calendarModal");
    if (event.target === sModal) closeServiceModal();
    if (event.target === cModal) closeCalendarModal();
}

// DYNAMIC NOTIFICATIONS FOR VENDOR
function showNotification(msg, type='info') {
  const n = document.createElement('div');
  n.textContent = msg;
  let bg = '#2196f3'; // info (blue)
  if (type === 'error') bg = '#f44336'; // error (red)
  else if (type === 'success') bg = '#4caf50'; // success (green)
  n.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 20px;background:${bg};color:white;border-radius:6px;font-size:14px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:350px;line-height:1.4;`;
  document.body.appendChild(n);
  setTimeout(() => { 
    n.style.transition = 'opacity 0.3s ease';
    n.style.opacity = '0'; 
    setTimeout(() => { n.remove(); }, 300); 
  }, 4000);
}

// Toggle notification dropdown visibility for vendor
function toggleNotificationDropdown(e) {
  if (e) e.stopPropagation();
  closeAll();
  const dropdown = document.getElementById("notificationDropdown");
  if (dropdown) {
    const isHidden = dropdown.style.display === "none" || !dropdown.style.display;
    dropdown.style.display = isHidden ? "flex" : "none";
  }
}

function closeAll() {
  const dropdown = document.getElementById("notificationDropdown");
  if (dropdown) dropdown.style.display = "none";
}

window.addEventListener('click', function(e) {
  if (!e.target.closest('.icon-btn') && !e.target.closest('#notificationDropdown')) {
    closeAll();
  }
});

async function loadVendorNotifications() {
  try {
    const res = await fetch('/api/vendor/notifications');
    const data = await res.json();
    const notifications = data.notifications || [];
    
    // 1. Update the notification badge in navbar
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

    // 2. Populate the navbar notification dropdown list
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
          let dotColor = '#3b82f6'; // info (blue)
          if (n.message.toLowerCase().includes('confirm') || n.message.toLowerCase().includes('approve')) dotColor = '#22c55e'; // green
          if (n.message.toLowerCase().includes('cancel') || n.message.toLowerCase().includes('reject')) dotColor = '#ef4444'; // red
          
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

    // 3. Populate the dashboard page card list (if present)
    const list = document.getElementById('vendorNotificationList');
    if (list) {
      if (!notifications.length) {
        list.innerHTML = `
          <li style="padding: 15px; text-align: center; color: #64748b; font-size: 13px;">
            No recent alerts.
          </li>
        `;
      } else {
        list.innerHTML = notifications.map(n => {
          const bgStyle = n.is_read === 0 ? 'background-color: #f0f9ff; border-left: 4px solid #ef4444;' : '';
          const timeStr = new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          return `
            <li style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 8px; ${bgStyle}">
              <div style="flex-grow: 1;">
                <p style="margin: 0; line-height: 1.4; color: #334155; font-size: 13px;">${n.message}</p>
                <small style="font-size: 11px; color: #94a3b8; display: block; margin-top: 4px;">${timeStr}</small>
              </div>
            </li>
          `;
        }).join('');
      }
    }
    
    // 4. Trigger sequential toast alerts for unread notifications (once per session)
    if (!window.toastedVendorNotifications) {
      window.toastedVendorNotifications = new Set();
    }
    unread.forEach((n, idx) => {
      if (!window.toastedVendorNotifications.has(n.notification_id)) {
        window.toastedVendorNotifications.add(n.notification_id);
        setTimeout(() => {
          showNotification(n.message, 'info');
        }, idx * 1000);
      }
    });
  } catch (e) {
    console.error("Error loading vendor notifications:", e);
  }
}

async function markVendorNotificationsAsRead(e) {
  if (e) e.stopPropagation();
  try {
    const res = await fetch('/api/vendor/notifications/read', { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      showNotification("All alerts marked as read.", "success");
      const badge = document.getElementById('notification-badge');
      if (badge) badge.style.display = 'none';
      await loadVendorNotifications();
    }
  } catch (err) {
    console.error("Error marking vendor notifications as read:", err);
  }
}

// Auto-run when vendor pages load
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('vendorNotificationList') || document.getElementById('notificationDropdownList')) {
    loadVendorNotifications();
  }
});