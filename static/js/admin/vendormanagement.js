/* =========================================
   SIDEBAR & EXISTING LOGIC
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
   SEARCH & TABLE LOGIC
   ========================================= */
function searchTable() {
    let input = document.getElementById("vendorSearch");
    let filter = input.value.toUpperCase();
    let table = document.getElementById("vendorTable");
    let tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) {
        let tdName = tr[i].getElementsByTagName("td")[0];
        let tdLoc = tr[i].getElementsByTagName("td")[2];
        
        if (tdName || tdLoc) {
            let txtValueName = tdName.textContent || tdName.innerText;
            let txtValueLoc = tdLoc.textContent || tdLoc.innerText;
            
            if (txtValueName.toUpperCase().indexOf(filter) > -1 || txtValueLoc.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function toggleVendorStatus(btn, vendorId) {
    let row = btn.closest('tr');
    let statusSpan = row.querySelector('.status');
    let isApproved = statusSpan.classList.contains('completed') || statusSpan.innerText.trim().toLowerCase() === 'approved' || statusSpan.innerText.trim().toLowerCase() === 'active';
    let confirmMsg = isApproved ? "Suspend this vendor?" : "Re-activate this vendor?";
    
    if (confirm(confirmMsg)) {
        if (!vendorId) {
            // Local fallback for client-side only added rows
            if (isApproved) {
                statusSpan.className = "status canceled";
                statusSpan.innerText = "Suspended";
                btn.innerHTML = '<i class="fa-solid fa-unlock"></i>';
                btn.className = "icon-btn approve";
                btn.title = "Activate";
            } else {
                statusSpan.className = "status completed";
                statusSpan.innerText = "Active";
                btn.innerHTML = '<i class="fa-solid fa-ban"></i>';
                btn.className = "icon-btn delete";
                btn.title = "Suspend";
            }
            return;
        }

        fetch(`/admin/vendor/${vendorId}/toggle-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.new_status === 'suspended') {
                    statusSpan.className = "status canceled";
                    statusSpan.innerText = "Suspended";
                    btn.innerHTML = '<i class="fa-solid fa-unlock"></i>';
                    btn.className = "icon-btn approve";
                    btn.title = "Activate";
                } else {
                    statusSpan.className = "status completed";
                    statusSpan.innerText = "Approved";
                    btn.innerHTML = '<i class="fa-solid fa-ban"></i>';
                    btn.className = "icon-btn delete";
                    btn.title = "Suspend";
                }
            } else {
                alert("Error: " + (data.message || "Failed to update vendor status"));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred. Please try again.");
        });
    }
}

function approveVendorRow(btn) {
    let row = btn.closest('tr');
    let statusSpan = row.querySelector('.status');
    
    if(confirm("Approve this new vendor?")) {
        statusSpan.className = "status completed";
        statusSpan.innerText = "Active";
        let actionDiv = row.querySelector('.action-buttons');
        actionDiv.innerHTML = `
            <button class="icon-btn edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn delete" title="Suspend" onclick="toggleVendorStatus(this)"><i class="fa-solid fa-ban"></i></button>
        `;
    }
}

/* =========================================
   ADD VENDOR MODAL & FORM LOGIC
   ========================================= */
const vendorModal = document.getElementById('vendor-modal');

function openVendorModal() {
    vendorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVendorModal() {
    vendorModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    // Clear form and preview
    document.getElementById('add-vendor-form').reset();
    document.getElementById('image-preview-container').innerHTML = '';
}

// Close on outside click
window.addEventListener('click', (e) => {
    if (e.target === vendorModal) {
        closeVendorModal();
    }
    if (e.target === approveModal) {
        closeApproveModal();
    }
    if (e.target === editModal) {
        closeEditVendorModal();
    }
});

// Image Preview
function previewSingleImage() {
    const container = document.getElementById('image-preview-container');
    const fileInput = document.getElementById('vendor-img-input');
    const file = fileInput.files[0];

    container.innerHTML = ""; 

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("preview-img");
            container.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

// Handle Form Submission (Add to Table)
document.getElementById('add-vendor-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // 1. Gather Data
    const name = document.getElementById('v-name').value;
    const category = document.getElementById('v-category').value;
    const location = document.getElementById('v-location').value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Get Image (or use default if none)
    const fileInput = document.getElementById('vendor-img-input');
    let imgSrc = "https://via.placeholder.com/40"; // Default
    if (fileInput.files && fileInput.files[0]) {
        imgSrc = URL.createObjectURL(fileInput.files[0]);
    }

    // 2. Create Table Row
    const tableBody = document.querySelector('#vendorTable tbody');
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td>
            <div class="vendor-cell">
                <img src="${imgSrc}" alt="Vendor">
                <div>
                    <strong>${name}</strong><br>
                    <small>ID: #V-${Math.floor(Math.random() * 9000) + 1000}</small>
                </div>
            </div>
        </td>
        <td>${category}</td>
        <td>${location}</td>
        <td>${date}</td>
        <td>0</td>
        <td><span class="star-rating text-gray">N/A</span></td>
        <td><span class="status completed">Active</span></td>
        <td>
            <div class="action-buttons">
                <button class="icon-btn edit" title="Edit"
                        data-id="${Math.floor(Math.random() * 9000) + 1000}"
                        data-business-name="${name}"
                        data-category="${category}"
                        data-city="${location}"
                        data-location=""
                        data-description=""
                        data-price-from=""
                        data-image-url="${imgSrc}"
                        onclick="openEditVendorModal(this)"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-btn delete" title="Suspend" onclick="toggleVendorStatus(this)"><i class="fa-solid fa-ban"></i></button>
            </div>
        </td>
    `;

    // 3. Add to Table & Close Modal
    tableBody.insertBefore(newRow, tableBody.firstChild); // Add to top
    alert("New Vendor Added Successfully!");
    closeVendorModal();
});


/* =========================================
   APPROVE VENDOR MODAL LOGIC
   ========================================= */
const approveModal = document.getElementById('approve-vendor-modal');

function openApproveModal(requestId, fullName, email, phone, businessName) {
    if (!approveModal) return;
    
    // Set form action dynamically
    const form = document.getElementById('approve-vendor-form');
    form.action = `/admin/vendor-request/${requestId}/approve`;
    
    // Populate readonly fields & defaults
    document.getElementById('approve-business-name').value = businessName;
    document.getElementById('approve-username').value = fullName;
    document.getElementById('approve-email').value = email;
    document.getElementById('approve-contact').value = phone;
    
    // Generate a secure temporary password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    let tempPass = "Vnd@";
    for (let i = 0; i < 6; i++) {
        tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('approve-password').value = tempPass;
    
    // Open modal
    approveModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeApproveModal() {
    if (!approveModal) return;
    approveModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('approve-vendor-form').reset();
}

/* =========================================
   EDIT VENDOR MODAL LOGIC
   ========================================= */
const editModal = document.getElementById('edit-vendor-modal');

function openEditVendorModal(btn) {
    if (!editModal) return;
    
    // Get values from button dataset
    const vendorId = btn.dataset.id;
    const businessName = btn.dataset.businessName || '';
    const email = btn.dataset.email || '';
    const contact = btn.dataset.contact || '';
    const category = btn.dataset.category || '';
    const city = btn.dataset.city || '';
    const location = btn.dataset.location || '';
    const description = btn.dataset.description || '';
    const priceFrom = btn.dataset.priceFrom || '';
    const imageUrl = btn.dataset.imageUrl || '';

    // Set form action dynamically
    const form = document.getElementById('edit-vendor-form');
    form.action = `/admin/vendor/${vendorId}/edit`;
    
    // Populate form inputs
    document.getElementById('edit-business-name').value = businessName;
    document.getElementById('edit-email').value = email;
    document.getElementById('edit-contact').value = contact;
    document.getElementById('edit-service-category').value = category;
    document.getElementById('edit-city').value = city;
    document.getElementById('edit-location').value = location;
    document.getElementById('edit-price-from').value = priceFrom;
    document.getElementById('edit-description').value = description;
    
    // Set up initial image preview
    const previewContainer = document.getElementById('edit-image-preview-container');
    previewContainer.innerHTML = '';
    if (imageUrl && imageUrl.trim() !== '') {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.classList.add("preview-img");
        previewContainer.appendChild(img);
    }
    
    // Open modal
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditVendorModal() {
    if (!editModal) return;
    editModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('edit-vendor-form').reset();
    document.getElementById('edit-image-preview-container').innerHTML = '';
}

function previewEditImage() {
    const container = document.getElementById('edit-image-preview-container');
    const fileInput = document.getElementById('edit-vendor-img-input');
    const file = fileInput.files[0];

    container.innerHTML = ""; 

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("preview-img");
            container.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}