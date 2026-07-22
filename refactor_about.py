import re

in_file = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\templates\public\about.html'
out_file = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\templates\user\about.html'

with open(in_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace header and footer
content = content.replace('header_public.html', 'header_user.html')
content = content.replace('footer_public.html', 'footer_user.html')

# 2. Replace testimonials container with dynamic ID
testi_pattern = re.compile(r'(<div class="testimonial-cards-container">).*?(</div>\s+<div class="carousel-dots">)', re.DOTALL)
content = testi_pattern.sub(r'<div class="testimonial-cards-container" id="dynamic-reviews"></div>\n        \2', content)

# 3. Replace Get In Touch map with Customer Request form
get_in_touch_orig = r'''        <div class="contact-map">
          <!-- Placeholder map image -->
          <img src="{{ url_for('static', filename='images/about_map.png') }}" alt="Map Location" style="width: 100%; height: 100%; object-fit: cover;">
          <div class="map-marker"><i class="fa-solid fa-location-dot"></i></div>
        </div>'''

get_in_touch_new = r'''        <div class="contact-form-container" style="flex: 1; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <h3 style="margin-bottom: 20px; color: #111827; font-size: 24px;"><i class="fa-solid fa-wand-magic-sparkles" style="color: var(--primary-color);"></i> Customer Request</h3>
          <form class="request-form">
            <div class="form-group" style="margin-bottom: 15px;">
              <select class="form-control" id="eventType" required style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-family: inherit;">
                <option value="">Select Event Type</option>
                <option value="wedding">Wedding</option>
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="babyshower">Baby Shower</option>
                <option value="corporate">Corporate Event</option>
                <option value="party">Party</option>
                <option value="cultural">Cultural Event</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
              <input type="email" class="form-control" id="email" placeholder="Your Email Address" value="{{ session.email or '' }}" required style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-family: inherit;">
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
              <input type="tel" class="form-control" id="phone" placeholder="Your Phone Number" required style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-family: inherit;">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <textarea class="form-control" id="requirements" placeholder="Tell us your specific requirements..." rows="4" required style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; resize: vertical; font-family: inherit;"></textarea>
            </div>
            <button type="submit" class="submit-btn" style="width: 100%; background: var(--primary-color); color: white; padding: 14px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s; font-family: inherit; font-size: 16px;">Submit Inquiry</button>
          </form>
        </div>'''
content = content.replace(get_in_touch_orig, get_in_touch_new)

# Also remove the "Contact Us" button since we have the form
content = content.replace('<a href="#" class="btn-primary" style="margin-top: 20px; display: inline-block;">Contact Us <i class="fa-solid fa-arrow-right"></i></a>', '')

# 4. Add Wishlist modal and signup_script.js at the bottom before about_logic.js
wishlist_modal = r'''
  <!-- WISHLIST MODAL -->
  <div class="modal-overlay" id="wishlistOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;">
    <div class="modal-box" style="background:white; border-radius:12px; max-width:600px; width:90%; max-height:80vh; overflow-y:auto; padding:30px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
      <div class="modal-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:15px;">
        <div>
          <div class="modal-pkg-label" style="color:#0f172a; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:1px;">❤️ MY WISHLIST</div>
          <div class="modal-pkg-name" id="wishlistTitle" style="font-size:24px; font-weight:700; color:#0f172a; margin-top:4px;">Saved Vendors</div>
        </div>
        <button class="modal-close" onclick="closeWishlistModal()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#999;">&times;</button>
      </div>
      <div class="modal-body" id="wishlistBody">
        <!-- Wishlist items will be rendered here -->
      </div>
    </div>
  </div>

  <script src="{{ url_for('static', filename='js/user/sigup_script.js') }}"></script>
'''

content = content.replace('<script src="{{ url_for(\'static\', filename=\'js/user/about_logic.js\', v=\'1.5\') }}"></script>', wishlist_modal + '  <script src="{{ url_for(\'static\', filename=\'js/user/about_logic.js\', v=\'1.5\') }}"></script>')

with open(out_file, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated user/about.html successfully.")
