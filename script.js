/* =========================
   GLOBAL VARIABLES
========================= */
let travelPackages = [];
let selectedTrip = null;

const dealsContainer = document.getElementById("deals");
// Search Elements
const destinationInput = document.getElementById("searchDestination");
const suggestList = document.getElementById("suggestions");
const searchBtn = document.querySelector(".btn-search");
// Filter Elements
const budgetFilter = document.getElementById("budgetFilter");
const filterPills = document.querySelectorAll(".filter-pill");

/* =========================
   LOAD DATA (With Error Handling)
========================= */
async function loadData() {
  try {
    const res = await fetch("data/packages.json");
    if (!res.ok) throw new Error("File not found");
    
    travelPackages = await res.json();
    renderPackages(travelPackages);

    // Populate Booking Dropdown
    const dropdown = document.getElementById("bookingDestination");
    if (dropdown) {
       const options = travelPackages.map(pkg => `<option value="${pkg.id}">${pkg.title}</option>`).join("");
       dropdown.innerHTML = `<option value="custom">Custom Trip / Not Listed</option>` + options;
       
       dropdown.addEventListener("change", (e) => {
         const selectedId = Number(e.target.value);
         selectedTrip = travelPackages.find(pkg => pkg.id === selectedId) || null;
       });
    }

  } catch (err) {
    console.warn("JSON failed to load (likely CORS/Offline). Site is in fallback mode.");
    if(dealsContainer) dealsContainer.innerHTML = "<p style='color:white; text-align:center;'>Deals could not be loaded. Please use the Custom Trip form.</p>";
  }
}
loadData();

/* =========================
   RESTORED: FILTERS (Region + Budget)
========================= */

// 1. Region Filter Pills (Asia, Europe, etc.)
if (filterPills) {
    filterPills.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove 'active' class from all buttons
            filterPills.forEach(b => b.classList.remove("active"));
            // Add 'active' to clicked button
            btn.classList.add("active");
            
            // Run the filter logic
            applyFilters();
        });
    });
}

// 2. Budget Dropdown
if (budgetFilter) {
    budgetFilter.addEventListener("change", () => {
        applyFilters();
    });
}

// 3. Main Filter Logic Function
function applyFilters() {
    // Get selected Region
    const activePill = document.querySelector(".filter-pill.active");
    const region = activePill ? activePill.dataset.filterRegion : "all";

    // Get selected Budget
    const budget = budgetFilter.value;

    // Get current Search Text (optional, keeps search valid while filtering)
    const query = destinationInput ? destinationInput.value.toLowerCase().trim() : "";

    // Filter the list
    const filtered = travelPackages.filter(pkg => {
        // Check Region
        const regionMatch = (region === "all") || (pkg.region === region);
        
        // Check Budget (Matches the 'budget' string in your JSON)
        const budgetMatch = (budget === "all") || (pkg.budget === budget);

        // Check Search Query
        const searchMatch = !query || pkg.title.toLowerCase().includes(query) || pkg.region.toLowerCase().includes(query);

        return regionMatch && budgetMatch && searchMatch;
    });

    // Show results
    renderPackages(filtered);
}

/* =========================
   SEARCH FUNCTIONALITY
========================= */
if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        // Use the filter function so it respects selected regions/budgets too
        applyFilters();
        
        // Scroll to results
        const destinationsSection = document.getElementById("destinations");
        if (destinationsSection) {
            destinationsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });
}

// Auto-Suggest Dropdown
if (destinationInput && suggestList) {
    destinationInput.addEventListener("input", () => {
        const query = destinationInput.value.toLowerCase().trim();
        
        if (!query) {
            suggestList.style.display = "none";
            return;
        }

        const suggestions = travelPackages.filter(pkg => 
            pkg.title.toLowerCase().includes(query) || 
            pkg.region.toLowerCase().includes(query)
        ).slice(0, 5);

        if (suggestions.length > 0) {
            suggestList.innerHTML = suggestions
                .map(pkg => `<li data-title="${pkg.title}">📍 ${pkg.title}</li>`)
                .join("");
            suggestList.style.display = "block";
        } else {
            suggestList.style.display = "none";
        }
    });

    suggestList.addEventListener("click", (e) => {
        if (e.target.tagName === "LI") {
            destinationInput.value = e.target.getAttribute("data-title");
            suggestList.style.display = "none";
            applyFilters(); // Update grid immediately
        }
    });

    document.addEventListener("click", (e) => {
        if (!suggestList.contains(e.target) && e.target !== destinationInput) {
            suggestList.style.display = "none";
        }
    });
}

/* =========================
   RENDER PACKAGES
========================= */
function renderPackages(list) {
  if (!dealsContainer) return;
  dealsContainer.innerHTML = "";

  if (!list.length) {
    dealsContainer.innerHTML = `<p style="color:#fff;">No packages found 👀</p>`;
    return;
  }

  dealsContainer.innerHTML = list.map(pkg => `
    <article class="package-card" data-id="${pkg.id}">
      <div class="package-image-wrapper">
        <img class="package-image" src="${pkg.image}" onerror="this.src='https://via.placeholder.com/400x250?text=Image+Missing'"/>
        <span class="package-badge">${pkg.days}</span>
        <span class="package-price-tag">$${pkg.price}</span>
      </div>
      <div class="package-body">
        <h3 class="package-title">${pkg.title}</h3>
      </div>
    </article>
  `).join("");
  
  document.querySelectorAll(".package-card").forEach(card => {
      card.addEventListener("click", showDetails);
  });
}

/* =========================
   BOOKING FORM - SUCCESS + REFRESH
========================= */
const bookingForm = document.getElementById("bookingForm");
const successMessage = document.getElementById("successMessage");

if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
        e.preventDefault(); 

        const nameInput = document.getElementById("bookingName");
        const emailInput = document.getElementById("bookingEmail");

        if (!nameInput.value.trim() || !emailInput.value.trim()) {
            alert("Please fill in your Name and Email.");
            return;
        }

        if (successMessage) {
            successMessage.innerHTML = `
                <strong>✔ Request Sent!</strong><br>
                Thank you, ${nameInput.value}. We will contact you shortly! ✈️<br>
                <small>Refreshing page in 5 seconds...</small>
            `;
            
            successMessage.style.display = "block";
            successMessage.style.backgroundColor = "#d4edda";
            successMessage.style.color = "#155724";
            successMessage.style.padding = "15px";
            successMessage.style.marginTop = "15px";
            successMessage.style.border = "1px solid green";
            successMessage.style.textAlign = "center";
            successMessage.style.borderRadius = "8px";

            successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
            
            bookingForm.reset();
            setTimeout(() => { window.location.reload(); }, 5000);
        }
    });
}

/* =========================
   MODAL LOGIC
========================= */
const modal = document.getElementById("detailsModal");
const modalClose = document.getElementById("modalClose");

function showDetails(e) {
  const id = Number(e.currentTarget.dataset.id);
  const pkg = travelPackages.find(p => p.id === id);
  if(!pkg || !modal) return;

  selectedTrip = pkg;

  document.getElementById("modalImage").src = pkg.image;
  document.getElementById("modalTitle").textContent = pkg.title;
  document.getElementById("modalPrice").textContent = pkg.price;
  document.getElementById("modalDays").textContent = pkg.days;
  document.getElementById("modalRegion").textContent = pkg.region;
  document.getElementById("modalTags").innerHTML = (pkg.tags || []).map(t => `<span>${t}</span>`).join("");
  document.getElementById("modalDesc").textContent = "Enjoy a wonderful trip to " + pkg.title;

  modal.style.display = "flex";

  document.getElementById("bookBtn").onclick = () => {
    modal.style.display = "none";
    scrollToBooking();
  };
}

if(modalClose) modalClose.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

/* =========================
   HELPER FUNCTIONS
========================= */
function scrollToBooking() {
  const section = document.getElementById("booking");
  if(section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

const navToggle = document.getElementById("navToggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();
