import re

in_file = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\static\js\user\about_logic.js'

with open(in_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace loadWebsiteReviews to use #dynamic-reviews and .testimonial-card format
old_js = r'''async function loadWebsiteReviews() {
  try {
    const res = await fetch('/api/public/website-reviews');
    const data = await res.json();
    const reviews = data.reviews || [];
    if (reviews.length > 0) {
      const grid = document.querySelector('.reviews-grid');
      if (grid) {
        grid.innerHTML = reviews.map(r => {
          const stars = '★'.repeat(Math.round(r.rating)) + '☆'.repeat(5 - Math.round(r.rating));
          const img = r.profile_image || '/static/images/default_avatar.svg';
          return `
            <div class="review-card">
              <p class="review-text" style="color: #0f172a !important; font-weight: 500;">"${r.feedback}"</p>
              <div class="review-rating" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <img src="${img}" alt="${r.username}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;" />
                  <span style="font-weight:600; font-size:13px; color:#0f172a !important;">${r.username}</span>
                </div>
                <div>
                  <span class="stars" style="color:#fbbf24; font-size:14px;">${stars}</span>
                  <span class="rating-value" style="margin-left:5px; background:linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color:#0f172a !important; padding:2px 8px; border-radius:10px; font-size:11px;">${r.rating}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch(e) {
    console.error("Error loading website reviews:", e);
  }
}'''

new_js = r'''async function loadWebsiteReviews() {
  try {
    const res = await fetch('/api/public/website-reviews');
    const data = await res.json();
    const reviews = data.reviews || [];
    if (reviews.length > 0) {
      const grid = document.getElementById('dynamic-reviews') || document.querySelector('.reviews-grid');
      if (grid) {
        grid.innerHTML = reviews.map(r => {
          const img = r.profile_image || '/static/images/default_avatar.svg';
          let starHtml = '';
          const rating = Math.round(r.rating);
          for(let i=1; i<=5; i++) {
              if (i <= rating) {
                  starHtml += '<i class="fa-solid fa-star"></i>';
              } else {
                  starHtml += '<i class="fa-regular fa-star"></i>';
              }
          }
          return `
            <div class="testimonial-card">
              <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
              <div class="rating-stars">${starHtml}</div>
              <p class="testimonial-text">"${r.feedback}"</p>
              <div class="client-info">
                <img src="${img}" alt="${r.username}">
                <div>
                  <h4>${r.username}</h4>
                  <p>Customer</p>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch(e) {
    console.error("Error loading website reviews:", e);
  }
}'''

content = content.replace(old_js, new_js)

with open(in_file, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated about_logic.js successfully.")
