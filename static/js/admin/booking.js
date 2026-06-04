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
   ADMIN BOOKING TABLE LOGIC
   ========================================= */

function searchBookingTable() {
    let input = document.getElementById("bookingSearch");
    if(!input) return;
    let filter = input.value.toUpperCase();
    let table = document.getElementById("bookingTable");
    let tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) {
        // ID (0), User (2), Vendor (3)
        let tdId = tr[i].getElementsByTagName("td")[0];
        let tdUser = tr[i].getElementsByTagName("td")[2];
        let tdVendor = tr[i].getElementsByTagName("td")[3];
        
        if (tdId || tdUser || tdVendor) {
            let txtId = tdId.textContent || tdId.innerText;
            let txtUser = tdUser.textContent || tdUser.innerText;
            let txtVendor = tdVendor.textContent || tdVendor.innerText;
            
            if (txtId.toUpperCase().indexOf(filter) > -1 || 
                txtUser.toUpperCase().indexOf(filter) > -1 || 
                txtVendor.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function cancelBooking(btn) {
    let row = btn.closest('tr');
    let statusSpan = row.querySelector('.status');
    
    if (statusSpan.classList.contains('completed')) {
        alert("Cannot cancel a completed booking.");
        return;
    }

    if(confirm("Are you sure you want to cancel this booking?")) {
        statusSpan.className = "status canceled";
        statusSpan.innerText = "Cancelled";
        // Disable cancel button
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    }
}

/* =========================================
   DATE RANGE FILTER & CSV EXPORT LOGIC
   ========================================= */

function openDateFilterModal() {
    const modal = document.getElementById('dateFilterModal');
    if (modal) modal.style.display = 'flex';
}

function closeDateFilterModal() {
    const modal = document.getElementById('dateFilterModal');
    if (modal) modal.style.display = 'none';
}

function applyDateFilter() {
    const startVal = document.getElementById('filterStartDate').value;
    const endVal = document.getElementById('filterEndDate').value;
    
    if (!startVal && !endVal) {
        alert("Please select at least one date boundary.");
        return;
    }
    
    const table = document.getElementById("bookingTable");
    if (!table) return;
    const trs = table.getElementsByTagName("tr");
    
    let startDate = startVal ? new Date(startVal) : null;
    let endDate = endVal ? new Date(endVal) : null;
    
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);
    
    let matchesCount = 0;
    
    for (let i = 1; i < trs.length; i++) {
        let dateTd = trs[i].getElementsByTagName("td")[1];
        if (dateTd) {
            let dateText = dateTd.innerText || dateTd.textContent;
            let datePart = dateText.split("\n")[0].trim();
            
            let rowDate = new Date(datePart);
            if (rowDate && !isNaN(rowDate)) {
                rowDate.setHours(0, 0, 0, 0);
                
                let isMatch = true;
                if (startDate && rowDate < startDate) isMatch = false;
                if (endDate && rowDate > endDate) isMatch = false;
                
                if (isMatch) {
                    trs[i].style.display = "";
                    matchesCount++;
                } else {
                    trs[i].style.display = "none";
                }
            }
        }
    }
    
    closeDateFilterModal();
    const footerP = document.querySelector('.table-footer p');
    if (footerP) {
        footerP.textContent = `Showing 1 to ${matchesCount} of ${matchesCount} filtered entries (Date: ${startVal || 'Any'} to ${endVal || 'Any'})`;
    }
}

function resetDateFilter() {
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    
    const table = document.getElementById("bookingTable");
    if (!table) return;
    const trs = table.getElementsByTagName("tr");
    
    for (let i = 1; i < trs.length; i++) {
        trs[i].style.display = "";
    }
    
    closeDateFilterModal();
    const footerP = document.querySelector('.table-footer p');
    if (footerP) {
        footerP.textContent = `Showing 1 to ${trs.length - 1} of ${trs.length - 1} entries`;
    }
}

function exportBookingTableToCSV() {
    const csv = [];
    const table = document.getElementById("bookingTable");
    if (!table) return;
    const trs = table.getElementsByTagName("tr");
    
    for (let i = 0; i < trs.length; i++) {
        if (trs[i].style.display === "none") continue;
        
        let row = [];
        let tds = trs[i].querySelectorAll("th, td");
        
        for (let j = 0; j < tds.length - 1; j++) {
            let text = tds[j].innerText || tds[j].textContent;
            text = text.replace(/[\n\r]+/g, ' ').trim();
            if (text.includes(",")) {
                text = `"${text}"`;
            }
            row.push(text);
        }
        csv.push(row.join(","));
    }
    
    const csvString = csv.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_report_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Set up Status and Service type dropdown filtering
document.addEventListener('DOMContentLoaded', function() {
    const filters = document.querySelectorAll('.filter-select');
    if (filters.length >= 2) {
        const statusFilter = filters[0];
        const serviceFilter = filters[1];
        
        statusFilter.addEventListener('change', applyFilters);
        serviceFilter.addEventListener('change', applyFilters);
        
        function applyFilters() {
            const selectedStatus = statusFilter.value.toLowerCase().replace('status: ', '').trim();
            const selectedService = serviceFilter.value.toLowerCase().replace('service type', '').trim();
            
            const table = document.getElementById("bookingTable");
            if (!table) return;
            const trs = table.getElementsByTagName("tr");
            
            let visibleCount = 0;
            
            for (let i = 1; i < trs.length; i++) {
                let statusTd = trs[i].getElementsByTagName("td")[6];
                let serviceTd = trs[i].getElementsByTagName("td")[4];
                
                if (statusTd && serviceTd) {
                    let statusText = statusTd.textContent.trim().toLowerCase();
                    let serviceText = serviceTd.textContent.trim().toLowerCase();
                    
                    let statusMatch = (selectedStatus === 'all' || statusText.includes(selectedStatus));
                    let serviceMatch = (!selectedService || serviceText.includes(selectedService));
                    
                    if (statusMatch && serviceMatch) {
                        trs[i].style.display = "";
                        visibleCount++;
                    } else {
                        trs[i].style.display = "none";
                    }
                }
            }
            
            const footerP = document.querySelector('.table-footer p');
            if (footerP) {
                footerP.textContent = `Showing 1 to ${visibleCount} of ${trs.length - 1} entries`;
            }
        }
    }
});