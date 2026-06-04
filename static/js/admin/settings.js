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
   SETTINGS PAGE LOGIC & AVATAR UPLOAD
   ========================================= */

const cameraBtn = document.querySelector('.camera-btn');
const adminAvatar = document.getElementById('adminAvatar');
const adminAvatarInput = document.getElementById('adminAvatarInput');
const settingsForm = document.getElementById('settingsForm');

if (adminAvatarInput) {
    const triggerUpload = () => adminAvatarInput.click();

    if (cameraBtn) {
        cameraBtn.addEventListener('click', triggerUpload);
    }
    if (adminAvatar) {
        adminAvatar.addEventListener('click', triggerUpload);
    }

    adminAvatarInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            // Check file size (max 800KB as specified on screen)
            if (file.size > 800 * 1024) {
                alert("File is too large! Maximum size allowed is 800KB.");
                this.value = ""; // Reset input
                return;
            }

            // Dynamic live preview using FileReader
            const reader = new FileReader();
            reader.onload = function(e) {
                if (adminAvatar) {
                    adminAvatar.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

if (settingsForm) {
    settingsForm.addEventListener('submit', function() {
        const saveBtn = document.querySelector('.glass-btn.primary');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            saveBtn.style.opacity = '0.7';
        }
    });
}

function resetForm() {
    if(confirm("Are you sure you want to discard unsaved changes?")) {
        const form = document.getElementById('settingsForm');
        if (form) {
            form.reset();
            // Restore avatar preview from session/default
            const originalAvatar = form.dataset.originalAvatar || "";
            if (adminAvatar && originalAvatar) {
                adminAvatar.src = originalAvatar;
            }
        }
    }
}