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
   WITHDRAWAL REQUEST LOGIC
   ========================================= */
function requestWithdrawal() {
    const balance = 45200; // Mock balance
    
    if (confirm(`Do you want to withdraw your available balance of ₹${balance.toLocaleString()}?`)) {
        const btn = document.querySelector('.glass-btn.primary');
        const originalContent = btn.innerHTML;
        
        // 1. Loading State
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        btn.style.opacity = '0.8';
        btn.style.pointerEvents = 'none';
        
        // 2. Simulate API Call delay
        setTimeout(() => {
            alert("Withdrawal request submitted successfully! Funds will be credited within 24-48 hours.");
            
            // Reset Button
            btn.innerHTML = originalContent;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }, 1500);
    }
}