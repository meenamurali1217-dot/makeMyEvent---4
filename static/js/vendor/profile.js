/* =========================================
   PROFILE EDIT LOGIC
   ========================================= */
let isEditing = false;

function toggleEditMode() {
    isEditing = !isEditing;
    const editableAreas = document.querySelectorAll('.editable-area');
    const btn = document.querySelector('.profile-actions .glass-btn.primary');
    
    if (isEditing) {
        // Enable Editing
        editableAreas.forEach(area => {
            area.contentEditable = "true";
            area.classList.add('editable-active');
        });
        btn.innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';
        btn.style.backgroundColor = '#10b981'; // Green
        btn.style.borderColor = '#10b981';
    } else {
        // Disable Editing (Save)
        editableAreas.forEach(area => {
            area.contentEditable = "false";
            area.classList.remove('editable-active');
        });
        btn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Profile';
        btn.style.backgroundColor = ''; // Reset
        btn.style.borderColor = '';
        
        alert("Profile changes saved successfully!");
    }
}

/* =========================================
   ADD PHOTO FUNCTIONALITY
   ========================================= */
function handleAddPhoto(input) {
    const grid = document.getElementById('gallery-grid');
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            // Create New Item Wrapper
            const newItem = document.createElement('div');
            newItem.className = 'gallery-item';

            // Create Image Element
            const newImg = document.createElement('img');
            newImg.src = e.target.result;
            newImg.alt = "New Upload";

            // Append Image to Item
            newItem.appendChild(newImg);

            // Insert before the "Add New" button
            // The "Add New" button is the last child, so we use insertBefore on it
            const addNewBtn = grid.querySelector('.add-new');
            grid.insertBefore(newItem, addNewBtn);
        };

        reader.readAsDataURL(file);
    }
}