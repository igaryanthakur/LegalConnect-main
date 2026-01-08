import { translate } from "../utils/translations.js";

export function renderHomePage() {
  const mainContent = document.getElementById("main-content");

  mainContent.innerHTML = `
    <section class="hero">
      <h2 data-i18n="heroTitle">${translate("heroTitle")}</h2>
      <p data-i18n="heroDescription">${translate("heroDescription")}</p>
      <div class="hero-buttons">
        <button class="btn btn-light" id="find-lawyer-btn" data-i18n="findLawyer">${translate(
          "findLawyer"
        )}</button>
        <button class="btn btn-outline-light" id="ask-ai-btn" data-i18n="askAi">${translate(
          "askAi"
        )}</button>
      </div>
    </section>
    <section>
      <h2 class="section-title" data-i18n="ourServices">${translate(
        "ourServices"
      )}</h2>
      <div class="features-grid">
        <a class="card1" href="#" id="lawyer-directory-card">
          <i class="fas fa-user-tie"></i>
          <h3 data-i18n="lawyerDirectory">${translate("lawyerDirectory")}</h3>
          <p class="small" data-i18n="lawyerDirectoryDesc">${translate(
            "lawyerDirectoryDesc"
          )}</p>
          <div class="go-corner">
            <div class="go-arrow">→</div>
          </div>
        </a>
        
        <a class="card1" href="#" id="ai-assistant-card">
          <i class="fas fa-robot"></i>
          <h3 data-i18n="aiAssistantService">${translate(
            "aiAssistantService"
          )}</h3>
          <p class="small" data-i18n="aiAssistantDesc">${translate(
            "aiAssistantDesc"
          )}</p>
          <div class="go-corner">
            <div class="go-arrow">→</div>
          </div>
        </a>
        
        <a class="card1" href="#" id="resource-library-card">
          <i class="fas fa-book-open"></i>
          <h3 data-i18n="resourceLibrary">${translate("resourceLibrary")}</h3>
          <p class="small" data-i18n="resourceLibraryDesc">${translate(
            "resourceLibraryDesc"
          )}</p>
          <div class="go-corner">
            <div class="go-arrow">→</div>
          </div>
        </a>
        
        <a class="card1" href="#" id="community-forums-card">
          <i class="fas fa-comments"></i>
          <h3 data-i18n="communityForums">${translate("communityForums")}</h3>
          <p class="small" data-i18n="communityForumsDesc">${translate(
            "communityForumsDesc"
          )}</p>
          <div class="go-corner">
            <div class="go-arrow">→</div>
          </div>
        </a>
      </div>
    </section>
    
    <section>
      <h2 class="section-title">How It Works</h2>
      <div class="steps-container">
        <div class="step card">
          <div class="step-number">1</div>
          <h3>Create an Account</h3>
          <p>Sign up to access all our features and personalized recommendations.</p>
        </div>
        <div class="step card">
          <div class="step-number">2</div>
          <h3>Describe Your Legal Need</h3>
          <p>Tell us about your situation or ask questions to our AI assistant.</p>
        </div>
        <div class="step card">
          <div class="step-number">3</div>
          <h3>Get Connected</h3>
          <p>Connect with lawyers, resources, or community members who can help.</p>
        </div>
      </div>
    </section>
    
    <section class="testimonials">
      <h2 class="section-title">Success Stories</h2>
      <div class="testimonial-slider">
        <div class="testimonial card">
          <div class="quote"><i class="fas fa-quote-left"></i></div>
          <p>LawSphere connected me with a pro bono lawyer who helped me understand my rights as a tenant. I couldn't have navigated the legal system without this support.</p>
          <div class="testimonial-author">
            <strong>Maria G.</strong>, Housing Rights Case
          </div>
        </div>
      </div>
    </section>
  `;

  // Add event listeners
  document.getElementById("find-lawyer-btn").addEventListener("click", () => {
    document.querySelector('a[data-page="lawyers"]').click();
  });

  document.getElementById("ask-ai-btn").addEventListener("click", () => {
    document.querySelector('a[data-page="ai-assistant"]').click();
  });

  // Add click handlers for service cards
  document
    .getElementById("lawyer-directory-card")
    .addEventListener("click", () => {
      document.querySelector('a[data-page="lawyers"]').click();
    });

  document.getElementById("ai-assistant-card").addEventListener("click", () => {
    document.querySelector('a[data-page="ai-assistant"]').click();
  });

  document
    .getElementById("resource-library-card")
    .addEventListener("click", () => {
      document.querySelector('a[data-page="resources"]').click();
    });

  document
    .getElementById("community-forums-card")
    .addEventListener("click", () => {
      document.querySelector('a[data-page="community"]').click();
    });

  // After the main content is rendered, set up the footer links
  setTimeout(() => {
    // Add event listeners to social media links to prevent default navigation behavior
    document.querySelectorAll(".social-links .social-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        // Stop the event from being handled by the app's navigation system
        e.stopPropagation();

        // Open the link in a new tab
        window.open(this.href, "_blank");
      });
    });
  }, 100);
}

// Export the renderFooter function so it can be used in main.js
export function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section about">
            <h2 data-i18n="aboutLawSphere">${translate("aboutLawSphere")}</h2>
            <p data-i18n="aboutLawSphereDesc">${translate(
              "aboutLawSphereDesc"
            )}</p>
            <div class="social-links">
              <a href="https://x.com/LawSphere123" target="_blank" class="social-link twitter-x">
                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61574577748529" target="_blank" class="social-link"><i class="fab fa-facebook"></i></a>
              <a href="https://www.instagram.com/lawspherejustice/?next=%2F" target="_blank" class="social-link"><i class="fab fa-instagram"></i></a>
            </div>
          </div>
          <div class="footer-section links">
            <h2 data-i18n="quickLinks">${translate("quickLinks")}</h2>
            <ul>
              <li><a href="#" data-page="home" data-i18n="home">${translate(
                "home"
              )}</a></li>
              <li><a href="#" data-page="lawyers" data-i18n="findLawyer">${translate(
                "findLawyer"
              )}</a></li>
              <li><a href="#" data-page="resources" data-i18n="resources">${translate(
                "resources"
              )}</a></li>
              <li><a href="#" data-page="community" data-i18n="community">${translate(
                "community"
              )}</a></li>
              <li><a href="#" data-page="ai-assistant" data-i18n="aiAssistant">${translate(
                "aiAssistant"
              )}</a></li>
            </ul>
          </div>
          
          <div class="footer-section contact">
            <h2 data-i18n="contactUs">${translate("contactUs")}</h2>
            <p><a href="tel:+919876543210" class="contact-link"><i class="fas fa-phone"></i> &nbsp; +91 9876543210</a></p>
            <p><a href="mailto:contact@lawsphere.org" class="contact-link"><i class="fas fa-envelope"></i> &nbsp; contact@lawsphere.org</a></p>
            <p><a href="https://maps.google.com/?q=123 Legal Street, Mumbai, India" target="_blank" class="contact-link location-link"><i class="fas fa-map-marker-alt"></i> &nbsp; 123 Legal Street, Mumbai, India</a></p>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} LawSphere | <span data-i18n="allRightsReserved">${translate(
    "allRightsReserved"
  )}</span>
        </div>
      </div>
    </footer>
  `;
}
