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
   SEARCH DROPDOWN LOGIC
========================= */
if (destinationInput && suggestList) {
    
    // 1. Listen for typing (The "Input" Event)
    destinationInput.addEventListener("input", () => {
        const query = destinationInput.value.toLowerCase().trim();
        
        // If input is empty, hide the dropdown
        if (!query) {
            suggestList.style.display = "none";
            return;
        }

        // Filter packages based on Title or Region
        const suggestions = travelPackages.filter(pkg => 
            pkg.title.toLowerCase().includes(query) || 
            pkg.region.toLowerCase().includes(query)
        );

        // Limit results to 5 to keep it clean
        const topResults = suggestions.slice(0, 5);

        // Render the list
        if (topResults.length > 0) {
            suggestList.innerHTML = topResults
                .map(pkg => `<li data-title="${pkg.title}">📍 ${pkg.title}</li>`)
                .join("");
            
            // Show the dropdown (CSS handles the floating position)
            suggestList.style.display = "block";
        } else {
            // No matches found
            suggestList.innerHTML = `<li style="cursor:default; color:#999;">No trips found...</li>`;
            suggestList.style.display = "block";
        }
    });

    // 2. Click on a suggestion
    suggestList.addEventListener("click", (e) => {
        // Check if the user clicked a list item (LI)
        if (e.target.tagName === "LI" && !e.target.textContent.includes("No trips found")) {
            // Get the title from the data attribute
            const title = e.target.getAttribute("data-title");
            
            // Fill the input box
            destinationInput.value = title;
            
            // Hide the list
            suggestList.style.display = "none";
        }
    });

    // 3. Hide list if clicking anywhere else on the screen
    document.addEventListener("click", (e) => {
        if (!suggestList.contains(e.target) && e.target !== destinationInput) {
            suggestList.style.display = "none";
        }
    });
}
/* =========================
   SEARCH BUTTON LOGIC
========================= */
const searchButton = document.querySelector(".btn-search");
const searchInput = document.getElementById("searchDestination");
const resultsSection = document.getElementById("destinations"); // The section where cards appear

if (searchButton && searchInput) {
  searchButton.addEventListener("click", () => {
    // 1. Get the value the user typed (e.g., "Bali")
    const query = searchInput.value.toLowerCase().trim();

    console.log("Searching for:", query); // Debugging

    // 2. Filter the global 'travelPackages' list
    // It checks if the Title OR the Region contains your text
    const filteredTrips = travelPackages.filter(pkg => 
      pkg.title.toLowerCase().includes(query) || 
      pkg.region.toLowerCase().includes(query)
    );

    // 3. Render the specific results
    renderPackages(filteredTrips);

    // 4. CRITICAL: Scroll down so the user sees the result!
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    
    // 5. (Optional) Update the section title to show what we found
    const title = document.querySelector(".section-title");
    if(title) {
        if(query) title.textContent = `Search Results for "${searchInput.value}"`;
        else title.textContent = "Featured Getaways";
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
  
  // Re-attach click events for Modals
  document.querySelectorAll(".package-card").forEach(card => {
      card.addEventListener("click", showDetails);
  });
}

/* =========================
   BOOKING FORM - REFRESH ON SUCCESS
========================= */
const bookingForm = document.getElementById("bookingForm");
const successMessage = document.getElementById("successMessage");

if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Stop immediate reload

        const nameInput = document.getElementById("bookingName");
        const emailInput = document.getElementById("bookingEmail");

        // Basic Validation
        if (!nameInput.value.trim() || !emailInput.value.trim()) {
            alert("Please fill in your Name and Email.");
            return;
        }

        // 1. SHOW SUCCESS MESSAGE
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
            
            successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
            
            // Clear form immediately
            bookingForm.reset();

            // 2. REFRESH PAGE AFTER 5 SECONDS
            setTimeout(() => {
                window.location.reload(); 
            }, 5000);
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