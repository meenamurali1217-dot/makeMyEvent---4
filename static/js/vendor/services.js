/* =========================================
   SERVICE MANAGEMENT LOGIC
   ========================================= */

// 1. Expanded Mock Data with Reliable Images
let services = [
    {
        id: 1,
        name: "Grand Wedding Stage",
        category: "Decoration",
        price: "₹ 1.5L",
        desc: "Luxurious floral stage setup with chandelier and premium lighting effects.",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
        status: "Active"
    },
    {
        id: 2,
        name: "Premium Catering Buffet",
        category: "Catering",
        price: "₹ 800/plate",
        desc: "Full course meal including starters, main course, and deserts for 500+ guests.",
        image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop",
        status: "Active"
    },
    {
        id: 3,
        name: "Professional Event DJ",
        category: "Entertainment",
        price: "₹ 25,000",
        desc: "High energy DJ with professional sound system and lighting rig.",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
        status: "Active"
    },
    {
        id: 4,
        name: "Candid Photography",
        category: "Photography",
        price: "₹ 45,000",
        desc: "Full day coverage with 2 candid photographers and a cinematic teaser.",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop",
        status: "Inactive"
    },
    {
        id: 5,
        name: "Bridal Makeup Artist",
        category: "Makeup Artist",
        price: "₹ 15,000",
        desc: "HD Bridal makeup including hair styling and saree draping.",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600&auto=format&fit=crop",
        status: "Active"
    },
    {
        id: 6,
        name: "Floral Entrance Arch",
        category: "Decoration",
        price: "₹ 20,000",
        desc: "Welcoming entrance decoration with exotic flowers and drapes.",
        image: "https://cdn0.weddingwire.in/vendor/8585/3_2/1280/jpg/dsc09984-r_15_408585-165304067633912.jpeg",
        status: "Active"
    }
];

// 2. Function to Render Services
function renderServices(filterCat = "all") {
    const container = document.getElementById('servicesContainer');
    const totalCount = document.getElementById('totalCount');
    container.innerHTML = ""; // Clear existing

    // Filter Logic
    const filteredServices = filterCat === "all" ? services : services.filter(s => s.category === filterCat);
    
    // Update Badge
    totalCount.innerText = filteredServices.length;

    filteredServices.forEach((service, index) => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <div class="s-card-img">
                <img src="${service.image}" alt="${service.name}">
                <span class="status-tag ${service.status.toLowerCase()}">${service.status}</span>
            </div>
            <div class="s-card-body">
                <div class="s-top">
                    <span class="s-cat">${service.category}</span>
                    <span class="s-price">${service.price}</span>
                </div>
                <h3>${service.name}</h3>
                <p class="s-desc">${service.desc}</p>
                <div class="s-actions">
                    <button class="s-btn edit"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="s-btn delete" onclick="deleteService(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. Modal Functions
function openModal() {
    document.getElementById('serviceModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('serviceModal').style.display = 'none';
}

// 4. Add New Service
function addService(event) {
    event.preventDefault();

    const name = document.getElementById('sName').value;
    const category = document.getElementById('sCategory').value;
    const price = document.getElementById('sPrice').value;
    const desc = document.getElementById('sDesc').value;
    const imgUrl = document.getElementById('sImg').value || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600&auto=format&fit=crop";

    const newService = {
        id: services.length + 1,
        name: name,
        category: category,
        price: "₹ " + price,
        desc: desc,
        image: imgUrl,
        status: "Active"
    };

    services.unshift(newService);
    renderServices();
    closeModal();
    event.target.reset();
}

// 5. Delete Service
function deleteService(index) {
    if(confirm("Permanently delete this service?")) {
        services.splice(index, 1);
        renderServices();
    }
}

// 6. Filter Function Trigger
function filterServices(category) {
    renderServices(category);
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => renderServices());