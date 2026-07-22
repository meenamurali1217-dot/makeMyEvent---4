import os

# --- UPDATE JS ---
js_file = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\static\js\user\messages.js'

with open(js_file, 'r', encoding='utf-8') as f:
    js_content = f.read()

old_js = r'''                <div class="contact-info">
                    <div class="c-top">
                        <h4>${c.name}</h4>
                        <small>${c.last_timestamp ? formatChatTime(c.last_timestamp) : ''}</small>
                    </div>
                    <p class="${msgClass}">${c.last_message}</p>
                    ${unreadBadge}
                </div>'''

new_js = r'''                <div class="contact-info">
                    <div class="c-top">
                        <h4>${c.name}</h4>
                        <div class="c-meta">
                            <small>${c.last_timestamp ? formatChatTime(c.last_timestamp) : ''}</small>
                            ${unreadBadge}
                        </div>
                    </div>
                    <p class="${msgClass}">${c.last_message ? c.last_message : 'No messages yet'}</p>
                </div>'''

js_content = js_content.replace(old_js, new_js)

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(js_content)


# --- UPDATE CSS ---
css_file = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\static\css\user\messages_style.css'

with open(css_file, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Add the new CSS at the end
new_css = r'''
/* =========================================
   NEW REDESIGN OVERRIDES
   ========================================= */

/* Hero Banner */
.messages-container {
    padding: 30px 5%; min-height: 80vh; flex: 1;
}

.messages-hero {
    background: #0a192f;
    border-radius: 20px;
    padding: 40px 50px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    box-shadow: 0 10px 30px rgba(10, 25, 47, 0.2);
    position: relative;
    overflow: hidden;
}

.hero-bg-elements {
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    background-image: radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.1) 2px, transparent 2px), 
                      radial-gradient(circle at 80% 70%, rgba(255, 215, 0, 0.15) 3px, transparent 3px),
                      radial-gradient(circle at 60% 80%, rgba(239, 68, 68, 0.15) 2px, transparent 2px);
    background-size: 100px 100px;
    pointer-events: none;
    z-index: 1;
}

.hero-left {
    display: flex;
    align-items: center;
    gap: 20px;
    z-index: 2;
}

.hero-icon {
    width: 60px; height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; color: white;
    box-shadow: inset 0 0 10px rgba(255,255,255,0.05);
}

.hero-text h1 {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 5px 0;
}

.hero-text p {
    font-size: 15px;
    color: #cbd5e1;
    margin: 0;
}

.hero-right {
    z-index: 2;
    position: relative;
    right: 20px;
}

.hero-illustration {
    width: 150px;
    height: auto;
    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
}

/* Chat Wrapper */
.chat-wrapper {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.04);
    border: none;
    height: 650px;
}

/* Contact List specific */
.chat-search {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px;
    border-bottom: 1px solid #f1f5f9;
}

.search-input-wrapper {
    position: relative;
    flex: 1;
}

.search-input-wrapper i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
}

.search-input-wrapper input {
    width: 100%;
    padding: 12px 15px 12px 40px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    outline: none;
    font-size: 14px;
}

.filter-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #64748b;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: 0.2s;
}

.filter-btn:hover {
    background: #f1f5f9;
    color: #3b82f6;
}

.contact-item {
    padding: 18px 20px;
    border-bottom: 1px solid #f8fafc;
}

.contact-info {
    display: flex; flex-direction: column; justify-content: center;
}

.c-top {
    align-items: flex-start;
}

.c-meta {
    display: flex; flex-direction: column; align-items: flex-end; gap: 5px;
}

.c-top h4 {
    font-size: 15px;
}

.c-meta small {
    color: #94a3b8; font-weight: 500; font-size: 12px;
}

.unread-badge {
    background: #3b82f6;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 0;
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0; float: none;
}

.contact-info p {
    font-size: 13px;
    margin-top: 4px;
}

/* Need Help Card */
.need-help-card {
    margin: 20px;
    padding: 15px;
    background: #f0f9ff;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    transition: 0.2s;
}

.need-help-card:hover {
    background: #e0f2fe;
}

.help-icon-wrapper {
    width: 40px; height: 40px;
    background: #e0f2fe;
    color: #3b82f6;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
}

.help-text h4 {
    font-size: 14px; color: #1e293b; margin: 0 0 2px 0; font-weight: 600;
}

.help-text p {
    font-size: 11px; color: #64748b; margin: 0; line-height: 1.3;
}

.help-arrow {
    margin-left: auto; color: #94a3b8; font-size: 12px;
}

/* Empty State */
.empty-state-content {
    text-align: center;
}

.empty-state-illustration {
    position: relative;
    display: inline-block;
    margin-bottom: 20px;
}

.main-empty-img {
    width: 120px; opacity: 0.15;
}

.flying-plane {
    position: absolute;
    bottom: 10px;
    right: -15px;
    font-size: 24px;
    color: #93c5fd;
    transform: rotate(-15deg);
}

.empty-state-content h3 {
    color: #1e293b; font-size: 20px; margin-bottom: 10px; font-weight: 700;
}

.empty-state-content p {
    color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;
}

/* Fix the avatar dots */
.status-dot.online {
    background: #10b981;
    border: 2px solid white;
}
'''
css_content += new_css

with open(css_file, 'w', encoding='utf-8') as f:
    f.write(css_content)

print("Updated JS and CSS successfully.")
