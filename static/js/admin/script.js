/* =========================================
   ADMIN DASHBOARD LOGIC
   ========================================= */

/* =========================================
   2. DASHBOARD COUNTER ANIMATION
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll(".counter");
    
    counters.forEach(counter => {
        const target = +counter.getAttribute("data-target");
        const duration = 2000; // Animation duration in ms
        const increment = target / (duration / 16); // 60fps approx

        const updateCounter = () => {
            const current = +counter.innerText.replace(/,/g, ''); // Remove existing commas
            if (current < target) {
                counter.innerText = Math.ceil(current + increment).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target.toLocaleString(); // Final format with commas
            }
        };
        updateCounter();
    });
});

/* =========================================
   3. SEARCH BAR HIGHLIGHT EFFECTS
   ========================================= */
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
    searchInput.addEventListener('focus', function() {
        this.parentElement.style.boxShadow = "0 0 8px rgba(33, 150, 243, 0.4)";
        this.parentElement.style.borderColor = "#2196f3";
    });
    searchInput.addEventListener('blur', function() {
        this.parentElement.style.boxShadow = "none";
        this.parentElement.style.borderColor = "#ccc";
    });
}

/* =========================================
   4. ADD VENDOR MODAL LOGIC
   ========================================= */

const vendorModal = document.getElementById('vendor-modal');

// Function to Open Modal
function openVendorModal() {
    if(vendorModal) {
        vendorModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock scroll
    }
}

// Function to Close Modal
function closeVendorModal() {
    if(vendorModal) {
        vendorModal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Unlock scroll
    }
}

// Attach Event Listener to "Add Vendor" Button in Hero Section
// We look for the button specifically inside .hero-actions that isn't the Export button
const addVendorBtn = document.querySelector('.hero-actions .primary');
if(addVendorBtn) {
    addVendorBtn.addEventListener('click', openVendorModal);
}

// Close modal when clicking outside the card (on the overlay)
window.addEventListener('click', (e) => {
    if (e.target === vendorModal) {
        closeVendorModal();
    }
});

/* =========================================
   5. IMAGE PREVIEW LOGIC (File Upload)
   ========================================= */

function previewImages() {
    const previewContainer = document.getElementById('image-preview-container');
    const fileInput = document.getElementById('vendor-img');
    const files = fileInput.files;

    previewContainer.innerHTML = ""; // Clear existing previews

    if (files) {
        [].forEach.call(files, function(file) {
            // Ensure it's an image
            if (!file.type.startsWith('image/')){ return; }

            const reader = new FileReader();

            reader.onload = function(event) {
                const img = document.createElement("img");
                img.src = event.target.result;
                img.classList.add("preview-img");
                previewContainer.appendChild(img);
            };

            reader.readAsDataURL(file);
        });
    }
}

/* =========================================
   6. FORM SUBMISSION HANDLING (Demo)
   ========================================= */

const vendorForm = document.getElementById('add-vendor-form');
if(vendorForm) {
    vendorForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent actual page reload
        
        // Simulating a successful save
        const btn = this.querySelector('.btn-save');
        const originalText = btn.innerText;
        
        btn.innerText = "Saving...";
        btn.style.opacity = "0.7";

        setTimeout(() => {
            alert("Vendor Added Successfully!");
            
            // Reset UI
            closeVendorModal();
            this.reset();
            document.getElementById('image-preview-container').innerHTML = '';
            
            btn.innerText = originalText;
            btn.style.opacity = "1";
        }, 1000); // Fake delay
    });
}