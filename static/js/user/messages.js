// messages.js - Customer-side messaging interface logic

let activePartnerId = null;
let activePartnerName = "";
let activePartnerImg = "";
let contacts = [];
let pollInterval = null;

// Initialise page
document.addEventListener('DOMContentLoaded', async function() {
    await loadContacts();
    
    // Check URL parameters for auto-opening a chat
    const urlParams = new URLSearchParams(window.location.search);
    const vendorUserId = urlParams.get('vendor_user_id');
    
    if (vendorUserId) {
        const partnerId = parseInt(vendorUserId);
        const contact = contacts.find(c => c.id === partnerId);
        if (contact) {
            openChat(contact.id, contact.name, contact.profile_image || '/static/images/default_avatar.svg');
        }
    }
    
    // Setup contact list search filter
    const searchInput = document.getElementById('contactSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterContacts);
    }
    
    // Start background polling to update contacts list and get new messages
    pollInterval = setInterval(pollChatUpdates, 3000);
});

// Fetch contacts list from API
async function loadContacts() {
    try {
        const res = await fetch('/api/chat/contacts');
        const data = await res.json();
        if (data.status === 'success') {
            contacts = data.contacts || [];
            renderContacts();
        }
    } catch (e) {
        console.error("Error loading chat contacts:", e);
    }
}

// Render contacts list inside sidebar
function renderContacts() {
    const listContainer = document.getElementById('contactsList');
    if (!listContainer) return;
    
    if (contacts.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #888; font-size: 13px;">
                <i class="fa-regular fa-user" style="font-size: 24px; margin-bottom: 10px; display: block; color: #ccc;"></i>
                No vendors available to chat. Book a vendor to start a conversation.
            </div>
        `;
        return;
    }
    
    const searchVal = document.getElementById('contactSearch').value.toLowerCase().trim();
    
    listContainer.innerHTML = contacts.map(c => {
        if (searchVal && !c.name.toLowerCase().includes(searchVal)) {
            return '';
        }
        
        const isActive = c.id === activePartnerId ? 'active' : '';
        const unreadBadge = c.unread_count > 0 ? `<span class="unread-badge">${c.unread_count}</span>` : '';
        const msgClass = c.unread_count > 0 ? 'unread-text' : '';
        const avatar = c.profile_image || '/static/images/default_avatar.svg';
        
        return `
            <div class="contact-item ${isActive}" onclick="openChat(${c.id}, '${c.name.replace(/'/g, "\\'")}', '${avatar}')">
                <div class="avatar-wrap">
                    <img src="${avatar}" alt="${c.name}">
                    <span class="status-dot online"></span>
                </div>
                <div class="contact-info">
                    <div class="c-top">
                        <h4>${c.name}</h4>
                        <div class="c-meta">
                            <small>${c.last_timestamp ? formatChatTime(c.last_timestamp) : ''}</small>
                            ${unreadBadge}
                        </div>
                    </div>
                    <p class="${msgClass}">${c.last_message ? c.last_message : 'No messages yet'}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Open active chat and fetch logs
async function openChat(partnerId, partnerName, partnerImg) {
    activePartnerId = partnerId;
    activePartnerName = partnerName;
    activePartnerImg = partnerImg;
    
    // Update active highlight in contacts list
    document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
    
    // Show chat window, hide placeholder
    document.getElementById('noChatSelected').style.display = 'none';
    document.getElementById('chatWindow').style.display = 'flex';
    
    // Update Chat Header Info
    document.getElementById('chatHeaderName').innerText = partnerName;
    document.getElementById('chatHeaderImg').src = partnerImg;
    
    // Clear badge locally
    const contactIdx = contacts.findIndex(c => c.id === partnerId);
    if (contactIdx !== -1) {
        contacts[contactIdx].unread_count = 0;
        renderContacts();
    }
    
    await loadMessages();
}

// Fetch chat logs for active chat
async function loadMessages() {
    if (!activePartnerId) return;
    try {
        const res = await fetch(`/api/chat/messages/${activePartnerId}`);
        const data = await res.json();
        if (data.status === 'success') {
            renderMessages(data.messages || []);
        }
    } catch (e) {
        console.error("Error loading chat messages:", e);
    }
}

// Render message bubbles in chat pane
function renderMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const wasAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 100;
    
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div style="text-align:center; padding: 20px; color:#94a3b8; font-size:12px;">
                -- Conversation started with ${activePartnerName} --
            </div>
        `;
        return;
    }
    
    chatMessages.innerHTML = messages.map(m => {
        const type = m.sender_id === activePartnerId ? 'received' : 'sent';
        const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const checkIcon = type === 'sent' ? (m.is_read ? '<i class="fa-solid fa-check-double" style="color: #4df0ff;"></i>' : '<i class="fa-solid fa-check"></i>') : '';
        
        return `
            <div class="message-bubble ${type}">
                <p>${escapeHtml(m.body)}</p>
                <span class="time">${timeStr} ${checkIcon}</span>
            </div>
        `;
    }).join('');
    
    if (wasAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Send Message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (message === "" || !activePartnerId) return;
    
    // Clear input instantly for snappy UI
    input.value = "";
    
    try {
        const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                receiver_id: activePartnerId,
                body: message
            })
        });
        const data = await res.json();
        if (data.status === 'success') {
            await loadMessages();
            await loadContacts(); // Refresh sidebar order
        }
    } catch (e) {
        console.error("Error sending message:", e);
    }
}

// Enter Key Handler
function handleEnter(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

// Polling background updates (every 3 seconds)
async function pollChatUpdates() {
    try {
        // Fetch contacts to update badge and list
        const res = await fetch('/api/chat/contacts');
        const data = await res.json();
        if (data.status === 'success') {
            contacts = data.contacts || [];
            renderContacts();
        }
        
        // Fetch new messages if active chat is open
        if (activePartnerId) {
            await loadMessages();
        }
    } catch (e) {
        console.error("Error polling chat updates:", e);
    }
}

// Filter contacts locally on search input
function filterContacts() {
    renderContacts();
}

// Helper: format ISO timestamp to chat list time
function formatChatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
