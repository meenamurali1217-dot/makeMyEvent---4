/* =========================================
   REVIEWS PAGE LOGIC
   ========================================= */

// Filter Chips Interaction
function filterReviews(category) {
    // 1. Visual update for buttons
    const btns = document.querySelectorAll('.filter-chip');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 2. Logic (Simulation)
    const cards = document.querySelectorAll('.review-card');
    cards.forEach(card => {
        // Reset
        card.style.display = 'block';
        
        // Simple logic for demonstration
        if (category === 'new' && !card.classList.contains('new-review')) {
            card.style.display = 'none';
        } 
        // Note: Real filtering would check data attributes for ratings/photos
    });
}

// Toggle Reply Box
function toggleReply(btn) {
    const card = btn.closest('.review-card');
    const replyBox = card.querySelector('.reply-box');
    
    if (replyBox.classList.contains('hidden')) {
        replyBox.classList.remove('hidden');
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancel';
    } else {
        replyBox.classList.add('hidden');
        btn.innerHTML = '<i class="fa-solid fa-reply"></i> Reply';
    }
}

// Image Lightbox (Simulation)
function openImage(img) {
    // In a real app, this would open a modal
    // For now, we create a simple overlay effect
    const src = img.src;
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
    overlay.style.zIndex = '2000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.innerHTML = `<img src="${src}" style="max-width:90%; max-height:90%; border-radius:8px;">`;
    
    overlay.onclick = () => document.body.removeChild(overlay);
    document.body.appendChild(overlay);
}