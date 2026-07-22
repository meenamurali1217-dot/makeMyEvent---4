import os
import re

html_file = r'c:\Users\meena\OneDrive\Desktop\makeMyEvent - 4\templates\user\messages.html'

with open(html_file, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace Hero section
hero_orig = r'''   <main class="admin-container">
       <div class="admin-hero-enhanced">
           <div class="hero-text">
               <h1>Messages</h1>
               <p>Connect and chat directly with your booked event vendors.</p>
           </div>
       </div>'''

hero_new = r'''   <main class="messages-container">
       <div class="messages-hero">
           <div class="hero-bg-elements"></div>
           <div class="hero-left">
               <div class="hero-icon"><i class="fa-regular fa-comment-dots"></i></div>
               <div class="hero-text">
                   <h1>Messages</h1>
                   <p>Connect and chat directly with your booked event vendors.</p>
               </div>
           </div>
           <div class="hero-right">
               <img src="https://cdn3d.iconscout.com/3d/premium/thumb/chat-bubbles-4993175-4161746.png" alt="Chat Bubbles" class="hero-illustration">
           </div>
       </div>'''
html = html.replace(hero_orig, hero_new)

# 2. Replace Search Bar and add Need Help card
search_orig = r'''               <div class="chat-search">
                   <i class="fa-solid fa-magnifying-glass"></i>
                   <input type="text" id="contactSearch" placeholder="Search chats...">
               </div>
               
               <div class="contacts-scroll" id="contactsList">
                   <!-- Populated dynamically -->
               </div>
           </div>'''

search_new = r'''               <div class="chat-search">
                   <div class="search-input-wrapper">
                       <i class="fa-solid fa-magnifying-glass"></i>
                       <input type="text" id="contactSearch" placeholder="Search chats...">
                   </div>
                   <button class="filter-btn"><i class="fa-solid fa-filter"></i></button>
               </div>
               
               <div class="contacts-scroll" id="contactsList">
                   <!-- Populated dynamically -->
               </div>
               
               <div class="need-help-card">
                   <div class="help-icon-wrapper"><i class="fa-solid fa-headset"></i></div>
                   <div class="help-text">
                       <h4>Need Help?</h4>
                       <p>Chat with our support team for quick assistance.</p>
                   </div>
                   <i class="fa-solid fa-chevron-right help-arrow"></i>
               </div>
           </div>'''
html = html.replace(search_orig, search_new)

# 3. Replace Empty State
empty_orig = r'''           <div class="chat-window-pane" id="noChatSelected" style="display: flex; align-items: center; justify-content: center; flex: 1; background: #fafafa; color: #888;">
               <div style="text-align: center; padding: 40px;">
                   <i class="fa-regular fa-comments" style="font-size: 48px; margin-bottom: 15px; color: #ccc;"></i>
                   <h3>No Chat Selected</h3>
                   <p>Choose a vendor from the contact list to start messaging.</p>
               </div>
           </div>'''

empty_new = r'''           <div class="chat-window-pane" id="noChatSelected" style="display: flex; align-items: center; justify-content: center; flex: 1; background: #ffffff;">
               <div class="empty-state-content">
                   <div class="empty-state-illustration">
                       <img src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png" alt="No Chat" class="main-empty-img">
                       <i class="fa-solid fa-paper-plane flying-plane"></i>
                   </div>
                   <h3>No Chat Selected</h3>
                   <p>Choose a vendor from the contact list<br>to start messaging.</p>
               </div>
           </div>'''
html = html.replace(empty_orig, empty_new)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated messages.html successfully.")
