/* =========================================
   SIDEBAR NAVIGATION LOGIC
   ========================================= */
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

/* =========================================
   SEARCH BAR HIGHLIGHT
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
   ADMIN DASHBOARD COUNTER ANIMATION
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll(".counter");
    
    counters.forEach(counter => {
        const target = +counter.getAttribute("data-target");
        const duration = 1500; // ms
        const increment = target / (duration / 16); 

        const updateCounter = () => {
            const current = +counter.innerText;
            if (current < target) {
                counter.innerText = Math.ceil(current + increment);
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        updateCounter();
    });
});

/* =========================================
   ADMIN TABLE LOGIC (Search & Status)
   ========================================= */

// Generic Table Search
function searchTable() {
    let input = document.getElementById("vendorSearch"); // Or userSearch
    if(!input) return;
    let filter = input.value.toUpperCase();
    let table = document.querySelector("table");
    let tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) {
        let tdName = tr[i].getElementsByTagName("td")[0];
        if (tdName) {
            let txtValue = tdName.textContent || tdName.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

// User Search Logic
function searchUserTable() {
    let input = document.getElementById("userSearch");
    if(!input) return;
    let filter = input.value.toUpperCase();
    let table = document.getElementById("userTable");
    let tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) {
        let tdProfile = tr[i].getElementsByTagName("td")[0];
        let tdContact = tr[i].getElementsByTagName("td")[1];
        
        if (tdProfile || tdContact) {
            let txtProfile = tdProfile.textContent || tdProfile.innerText;
            let txtContact = tdContact.textContent || tdContact.innerText;
            if (txtProfile.toUpperCase().indexOf(filter) > -1 || txtContact.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

// Toggle Vendor Status
function toggleVendorStatus(btn) {
    let row = btn.closest('tr');
    let statusSpan = row.querySelector('.status');
    if (statusSpan.classList.contains('completed')) {
        if(confirm("Suspend this vendor?")) {
            statusSpan.className = "status canceled"; statusSpan.innerText = "Suspended";
            btn.innerHTML = '<i class="fa-solid fa-unlock"></i>'; btn.className = "icon-btn approve";
        }
    } else if (statusSpan.classList.contains('canceled')) {
        if(confirm("Re-activate this vendor?")) {
            statusSpan.className = "status completed"; statusSpan.innerText = "Active";
            btn.innerHTML = '<i class="fa-solid fa-ban"></i>'; btn.className = "icon-btn delete";
        }
    }
}

// Toggle User Status
function toggleUserStatus(btn) {
    let row = btn.closest('tr');
    let statusSpan = row.querySelector('.status');
    if (statusSpan.classList.contains('completed')) {
        if(confirm("Block this user?")) {
            statusSpan.className = "status canceled"; statusSpan.innerText = "Blocked";
            btn.innerHTML = '<i class="fa-solid fa-unlock"></i>'; btn.className = "icon-btn approve";
        }
    } else if (statusSpan.classList.contains('canceled')) {
        if(confirm("Unblock this user?")) {
            statusSpan.className = "status completed"; statusSpan.innerText = "Active";
            btn.innerHTML = '<i class="fa-solid fa-ban"></i>'; btn.className = "icon-btn delete";
        }
    }
}

// Approve Vendor Logic
function approveVendorRow(btn) {
    let row = btn.closest('tr');
    let statusSpan = row.querySelector('.status');
    if(confirm("Approve this new vendor?")) {
        statusSpan.className = "status completed"; statusSpan.innerText = "Active";
        let actionDiv = row.querySelector('.action-buttons');
        actionDiv.innerHTML = `<button class="icon-btn edit" title="Edit"><i class="fa-solid fa-pen"></i></button><button class="icon-btn delete" title="Suspend" onclick="toggleVendorStatus(this)"><i class="fa-solid fa-ban"></i></button>`;
    }
}

/* =========================================
   REPORTS DOWNLOAD LOGIC
   ========================================= */
function downloadReport(btn) {
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.style.background = '#10b981';
        btn.style.color = 'white';
        btn.style.borderColor = '#10b981';
        
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.background = 'white';
            btn.style.color = '#475569';
            btn.style.borderColor = '#e2e8f0';
            btn.style.pointerEvents = 'auto';
        }, 2000);
    }, 1500);
}