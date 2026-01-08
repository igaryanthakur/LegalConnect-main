import { renderHomePage } from "../pages/home.js";
import { renderLawyersPage } from "../pages/lawyers.js";
import { renderResourcesPage } from "../pages/resources.js";
import { renderCommunityPage } from "../pages/community.js";
import { renderAIAssistantPage } from "../pages/ai-assistant.js";
import { renderLawyerRegisterPage } from "../pages/lawyer-register.js";
import { renderLawyerProfilePage } from "../pages/lawyer-profile.js";
import { renderUserProfilePage } from "../pages/user-profile.js"; // Add this import

// Add a variable to track current page
let currentPage = "home";

// Add a new function for programmatic navigation
export function navigateTo(page, params) {
  console.log(`Navigating programmatically to: ${page}`, params);

  // Skip if already on this page
  if (page === currentPage && page === "user-profile") {
    console.log("Already on user profile page, skipping render");
    return;
  }

  // Update current page
  currentPage = page;

  // Clear active class from all links
  const navLinks = document.querySelectorAll("#main-nav a");
  navLinks.forEach((l) => l.classList.remove("active"));

  // Find the corresponding link and mark it as active if it exists
  const link = Array.from(navLinks).find(
    (l) => l.getAttribute("data-page") === page
  );
  if (link) {
    link.classList.add("active");
  }

  // Render the appropriate page
  switch (page) {
    case "home":
      renderHomePage();
      break;
    case "lawyers":
      renderLawyersPage();
      break;
    case "resources":
      renderResourcesPage();
      break;
    case "community":
      renderCommunityPage();
      break;
    case "ai-assistant":
      renderAIAssistantPage();
      break;
    case "lawyer-register":
      renderLawyerRegisterPage();
      break;
    case "lawyer-profile":
      renderLawyerProfilePage(params.id);
      break;
    case "user-profile":
      renderUserProfilePage();
      break;
    default:
      renderHomePage();
  }
}

function renderUserMenu(user) {
  return `
    <div class="user-menu">
      <div class="user-profile-icon" id="profile-icon">
        <img src="${user.profileImage || "/lawyer.png"}" alt="${
    user.name
  }" onerror="this.src='/lawyer.png'">
      </div>
      <span>${user.name}</span>
      <!-- Rest of your user menu -->
    </div>
  `;
}

export function setupNavigation() {
  const navLinks = document.querySelectorAll("#main-nav a");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Remove active class from all links
      navLinks.forEach((l) => l.classList.remove("active"));

      // Add active class to clicked link
      link.classList.add("active");

      // Get the page to render
      const page = link.getAttribute("data-page");

      // Use the same navigation logic
      navigateTo(page);
    });
  });

  // Add event listener for user profile icon click
  document.addEventListener("click", function (e) {
    const profileIcon = e.target.closest("#profile-icon");

    if (profileIcon) {
      e.preventDefault();
      navigateTo("user-profile");
    }
  });
}
