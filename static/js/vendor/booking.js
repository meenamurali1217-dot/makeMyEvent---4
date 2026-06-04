/* =========================================
   SIDEBAR & GENERAL LOGIC
   ========================================= */
function openSidebar() {
    document.getElementById("sidebar").style.left = "0";
    document.getElementById("overlay").style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    document.getElementById("sidebar").style.left = "-300px";
    document.getElementById("overlay").style.display = "none";
    document.body.style.overflow = "auto";
}

/* =========================================
   CALENDAR & DATA LOGIC
   ========================================= */

// Check if vendorBookings is injected from Python/Flask
const bookings = window.vendorBookings || [
    {
        id: '1',
        title: 'Wedding Stage - Priya Singh',
        start: '2026-02-14T10:00:00', // YYYY-MM-DD
        end: '2026-02-14T18:00:00',
        color: '#22c55e', // Green for confirmed
        extendedProps: {
            customer: 'Priya Singh',
            service: 'Wedding Decoration',
            location: 'Royal Gardens, Mumbai',
            price: '₹ 1.5L',
            status: 'Confirmed'
        }
    },
    {
        id: '2',
        title: 'Corporate Gala - TechCorp',
        start: '2026-02-18T18:00:00',
        color: '#3b82f6', // Blue
        extendedProps: {
            customer: 'TechCorp Inc.',
            service: 'Event Catering',
            location: 'Grand Hyatt',
            price: '₹ 80,000',
            status: 'Confirmed'
        }
    },
    {
        id: '3',
        title: 'Birthday Bash - Rahul',
        start: '2026-02-22T14:00:00',
        color: '#f97316', // Orange for Pending
        extendedProps: {
            customer: 'Rahul Kumar',
            service: 'DJ & Sound',
            location: 'Club X',
            price: '₹ 25,000',
            status: 'Pending Payment'
        }
    }
];

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Initialize FullCalendar
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        height: 600,
        events: bookings, // Load data
        eventClick: function(info) {
            openEventModal(info.event);
        }
    });
    calendar.render();

    // 2. Populate Upcoming List (Sidebar)
    const upcomingList = document.getElementById('upcomingList');
    bookings.forEach(booking => {
        // Simple date formatting
        const dateObj = new Date(booking.start);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="u-time">${dateStr}<br>${timeStr}</div>
            <div class="u-details">
                <h5>${booking.extendedProps.service}</h5>
                <p>${booking.extendedProps.customer}</p>
            </div>
        `;
        upcomingList.appendChild(li);
    });
});

/* =========================================
   MODAL LOGIC
   ========================================= */

function openEventModal(event) {
    const modal = document.getElementById('eventModal');
    const props = event.extendedProps;

    // Populate Data
    document.getElementById('mCustomer').innerText = props.customer;
    document.getElementById('mService').innerText = props.service;
    document.getElementById('mDate').innerText = event.start.toLocaleString();
    document.getElementById('mLocation').innerText = props.location;
    document.getElementById('mPrice').innerText = props.price;
    
    // Status Style
    const statusDiv = document.getElementById('modalStatus');
    statusDiv.innerText = props.status;
    if(props.status.toLowerCase().includes('pending')) {
        statusDiv.className = 'modal-status-bar pending';
    } else if (props.status.toLowerCase().includes('cancel')) {
        statusDiv.className = 'modal-status-bar rejected';
    } else {
        statusDiv.className = 'modal-status-bar';
    }

    // Cancellation Reason Row Visibility
    const cancelReasonRow = document.getElementById('mCancelReasonRow');
    if (cancelReasonRow) {
        if (props.status.toLowerCase().includes('cancel') && props.cancellationReason) {
            document.getElementById('mCancelReason').innerText = props.cancellationReason;
            cancelReasonRow.style.display = 'flex';
        } else {
            cancelReasonRow.style.display = 'none';
        }
    }

    // Setup chat redirection
    const chatBtn = modal.querySelector('.s-btn.chat');
    if (chatBtn) {
        chatBtn.onclick = function() {
            if (props.customerId) {
                location.href = `/vendor/messages?user_id=${props.customerId}`;
            } else {
                alert('No customer ID associated with this booking.');
            }
        };
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}