/* =========================================
   SHARED UTILITIES - Common functions across all websites
   ========================================= */

// Sidebar Navigation Functions
function openSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (sidebar && overlay) {
        sidebar.style.left = "0";
        overlay.style.display = "block";
        document.body.style.overflow = "hidden"; // Prevent background scrolling
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

// Close sidebar if overlay is clicked
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById("overlay");
    if(overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
});

// Search box highlight effect
function initSearchBox() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            this.parentElement.style.boxShadow = "0 0 8px rgba(33, 150, 243, 0.3)";
        });
        searchInput.addEventListener('blur', function() {
            this.parentElement.style.boxShadow = "none";
        });
    }
}

// Toast notification system
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
        `;
        document.body.appendChild(toast);
    }

    // Set color based on type
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    };
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.textContent = message;

    // Show toast
    toast.style.opacity = '1';

    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Wishlist modal functionality
function openWishlistModal() {
    // Get wishlist items from localStorage
    let wishlistItems = [];
    try {
        wishlistItems = JSON.parse(localStorage.getItem('evh_wishlist') || '[]');
    } catch (e) {
        wishlistItems = [];
    }

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    modal.onclick = () => modal.remove();

    const box = document.createElement('div');
    box.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        padding: 30px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    modal.appendChild(box);

    let content;
    if (!wishlistItems.length) {
        content = `
            <div style="text-align:center;padding:40px 0;">
                <div style="font-size:60px;margin-bottom:20px;">❤️</div>
                <h3 style="margin-bottom:10px;color:#333;">Your Wishlist is Empty</h3>
                <p style="color:#666;margin-bottom:20px;">Add vendors to your wishlist to save them for later</p>
                <button onclick="location.href='./events_vendors.html'" style="background:#18aef3;color:white;border:none;padding:10px 25px;border-radius:6px;cursor:pointer;font-weight:600;">Browse Vendors</button>
            </div>
        `;
    } else {
        content = `
            <h2 style="margin-bottom:20px;color:#333;"><i class="fa-solid fa-heart" style="color:#18aef3;margin-right:10px;"></i>My Wishlist</h2>
            <p style="color:#666;margin-bottom:20px;">${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} saved</p>
            <div style="border-top:1px solid #eee;padding-top:15px;">
                ${wishlistItems.map(w => `
                    <div style="padding:15px;background:#f9f9f9;margin-bottom:10px;border-radius:6px;border-left:4px solid #18aef3;">
                        <div style="font-weight:600;margin-bottom:8px;color:#333;">${w.type === 'package' ? w.vendorName : w.serviceName}</div>
                        <div style="color:#666;font-size:14px;margin-bottom:8px;">
                            ${w.type === 'package' ? `<i class="fa-solid fa-layer-group" style="margin-right:6px;color:#18aef3;"></i>${w.packageCount} packages` : `<i class="fa-solid fa-tag" style="margin-right:6px;color:#18aef3;"></i>${w.serviceType}`}
                        </div>
                        <button onclick="removeWishlistItem('${w.id}');this.parentElement.parentElement.remove();" style="background:#ff6b6b;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;">Remove</button>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;">
                <button onclick="location.href='./events_vendors.html'" style="width:100%;background:#18aef3;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:15px;">Browse More Vendors</button>
            </div>
        `;
    }

    box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:15px;">
            <h2 style="margin:0;color:#333;">❤️ Wishlist</h2>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999;">&times;</button>
        </div>
        ${content}
    `;

    document.body.appendChild(modal);
}

// Remove wishlist item
function removeWishlistItem(id) {
    let wishlistItems = [];
    try {
        wishlistItems = JSON.parse(localStorage.getItem('evh_wishlist') || '[]');
    } catch (e) {
        wishlistItems = [];
    }
    wishlistItems = wishlistItems.filter(w => w.id !== id);
    try {
        localStorage.setItem('evh_wishlist', JSON.stringify(wishlistItems));
    } catch (e) {}
}

// Close wishlist modal
function closeWishlistModal() {
    const overlay = document.getElementById('wishlistOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Update wishlist count display
function updateWishlistCount() {
    let wishlistItems = [];
    try {
        wishlistItems = JSON.parse(localStorage.getItem('evh_wishlist') || '[]');
    } catch (e) {
        wishlistItems = [];
    }
    const countElements = document.querySelectorAll('#wishlist-count');
    countElements.forEach(el => {
        if (wishlistItems.length > 0) {
            el.textContent = `(${wishlistItems.length})`;
            el.style.display = 'inline';
        } else {
            el.style.display = 'none';
        }
    });
}

// Initialize common UI elements
document.addEventListener('DOMContentLoaded', function() {
    initSearchBox();
    updateWishlistCount();
});



  //  WISHLIST MANAGEMENT FOR HOME PAGE

let wishlistItems=[];
try{wishlistItems=JSON.parse(localStorage.getItem('evh_wishlist')||'[]');}catch(e){wishlistItems=[];}

function updateWishlistBadge(){
  const badge=document.getElementById('wishlist-count');
  if(wishlistItems.length>0){
    badge.style.display='inline';
    badge.textContent=`(${wishlistItems.length})`;
  } else {
    badge.style.display='none';
  }
}

function openWishlistModal(){
  // Create modal
  const modal=document.createElement('div');
  modal.style.cssText=`
    position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;z-index:10000;
  `;
  modal.onclick=()=>modal.remove();
  
  const box=document.createElement('div');
  box.style.cssText=`
    background:white;border-radius:12px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;
    padding:30px;box-shadow:0 10px 40px rgba(0,0,0,0.3);
  `;
  modal.appendChild(box);
  
  let content;
  if(!wishlistItems.length){
    content=`
      <div style="text-align:center;padding:40px 0;">
        <div style="font-size:60px;margin-bottom:20px;">❤️</div>
        <h3 style="margin-bottom:10px;color:#333;">Your Wishlist is Empty</h3>
        <p style="color:#666;margin-bottom:20px;">Add vendors to your wishlist to save them for later</p>
        <button onclick="location.href='./events_vendors.html'" style="background:#18aef3;color:white;border:none;padding:10px 25px;border-radius:6px;cursor:pointer;font-weight:600;">Browse Vendors</button>
      </div>
    `;
  } else {
    content=`
      <h2 style="margin-bottom:20px;color:#333;"><i class="fa-solid fa-heart" style="color:var(--teal);margin-right:10px;"></i>My Wishlist</h2>
      <p style="color:#666;margin-bottom:20px;">${wishlistItems.length} item${wishlistItems.length!==1?'s':''} saved</p>
      <div style="border-top:1px solid #eee;padding-top:15px;">
        ${wishlistItems.map(w=>`
          <div style="padding:15px;background:#f9f9f9;margin-bottom:10px;border-radius:6px;border-left:4px solid #18aef3;">
            <div style="font-weight:600;margin-bottom:8px;color:#333;">${w.type==='package'?w.vendorName:w.serviceName}</div>
            <div style="color:#666;font-size:14px;margin-bottom:8px;">
              ${w.type==='package'?`<i class="fa-solid fa-layer-group" style="margin-right:6px;color:#18aef3;"></i>${w.packageCount} packages`:`<i class="fa-solid fa-tag" style="margin-right:6px;color:#18aef3;"></i>${w.serviceType}`}
            </div>
            <button onclick="removeWishlistItem('${w.id}');this.parentElement.parentElement.remove();" style="background:#ff6b6b;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;">Remove</button>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;">
        <button onclick="location.href='./events_vendors.html'" style="width:100%;background:#18aef3;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:15px;">Browse More Vendors</button>
      </div>
    `;
  }
  
  box.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:15px;">
      <h2 style="margin:0;color:#333;">❤️ Wishlist</h2>
      <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999;">&times;</button>
    </div>
    ${content}
  `;
  
  document.body.appendChild(modal);
}

function removeWishlistItem(id){
  wishlistItems=wishlistItems.filter(w=>w.id!==id);
  try{localStorage.setItem('evh_wishlist',JSON.stringify(wishlistItems));}catch(e){}
  updateWishlistBadge();
}

// Initialize wishlist on page load
document.addEventListener('DOMContentLoaded',function(){
  updateWishlistBadge();
});