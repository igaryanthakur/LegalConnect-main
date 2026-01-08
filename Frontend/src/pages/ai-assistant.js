import { aiService } from "../services/api.js";

export function renderAIAssistantPage() {
  const mainContent = document.getElementById("main-content");

  mainContent.innerHTML = `
    <section class="ai-assistant-page">
      <h1 class="page-title">AI Legal Assistant</h1>
      <p class="page-description">Get instant answers to common legal questions. Our AI assistant can help with basic legal information and guide you in the right direction.</p>
      
      <div class="chat-container card">
        <div class="chat-messages" id="chat-messages">
          <div class="message assistant">
            <div class="message-content">
              <p>Hello! I'm LawSphere's AI Legal Assistant. How can I help you today?</p>
              <p>I can answer questions about:</p>
              <ul>
                <li>Basic legal rights and procedures</li>
                <li>Where to find legal resources</li>
                <li>Common legal terminology</li>
                <li>General guidance on legal processes</li>
              </ul>
              <p><em>Please note: I provide general information only, not legal advice. For specific legal advice, please consult with a qualified lawyer.</em></p>
            </div>
          </div>
        </div>
        
        <form id="chat-form" class="chat-input-form">
          <input type="text" id="user-input" placeholder="Type your legal question here..." required>
          <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i></button>
        </form>
      </div>
      
      <div class="quick-questions card">
        <h3>Common Questions</h3>
        <div class="question-buttons" id="faq-container">
          <div class="loading-spinner">Loading common questions...</div>
        </div>
      </div>
    </section>
  `;

  setupChatFunctionality();
  loadFAQs();
}

async function loadFAQs() {
  try {
    const faqContainer = document.getElementById("faq-container");

    // Fetch FAQs from the backend API
    const response = await aiService.getFAQs();
    const faqs = response.data.data;

    // Clear loading spinner
    faqContainer.innerHTML = "";

    // Add FAQ buttons
    faqs.forEach((faq) => {
      const button = document.createElement("button");
      button.className = "quick-question-btn";
      button.textContent = faq.question;
      button.dataset.category = faq.category;

      button.addEventListener("click", () => {
        const question = button.textContent;
        addMessageToChat("user", question);

        // Show loading indicator
        const loadingMsg = addMessageToChat("assistant", "Thinking...");

        // Get response from API
        aiService
          .askQuestion(question)
          .then((response) => {
            // Remove loading message
            loadingMsg.remove();

            // Add AI response
            addMessageToChat("assistant", response.data.data.response);
          })
          .catch((error) => {
            // Remove loading message
            loadingMsg.remove();

            // Add error message
            addMessageToChat(
              "assistant",
              "Sorry, I encountered an error processing your question. Please try again later."
            );
            console.error("AI Service Error:", error);
          });
      });

      faqContainer.appendChild(button);
    });
  } catch (error) {
    console.error("Error loading FAQs:", error);
    document.getElementById("faq-container").innerHTML =
      '<p class="error-message">Could not load common questions. Please try refreshing the page.</p>';
  }
}

function setupChatFunctionality() {
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");

  // Handle form submission
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Add user message to chat
    addMessageToChat("user", userMessage);

    // Clear input
    userInput.value = "";

    // Show loading indicator
    const loadingMsg = addMessageToChat("assistant", "Thinking...");

    try {
      // Get AI response from backend
      const response = await aiService.askQuestion(userMessage);

      // Remove loading message
      loadingMsg.remove();

      // Add AI response to chat
      addMessageToChat("assistant", response.data.data.response);
    } catch (error) {
      // Remove loading message
      loadingMsg.remove();

      // Add error message
      addMessageToChat(
        "assistant",
        "Sorry, I encountered an error processing your question. Please try again later."
      );
      console.error("AI Service Error:", error);
    }
  });
}

function addMessageToChat(sender, content) {
  const chatMessages = document.getElementById("chat-messages");

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");

  // If it's a loading message, add spinner
  if (content === "Thinking...") {
    messageContent.innerHTML = `
      <div class="loading-message">
        <div class="loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    `;
  } else {
    // Format content: convert **text** to <strong>text</strong> for bold formatting
    const formattedContent = content.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

    // For bullet points and paragraphs, we'll keep the simple approach
    // but wrap content in paragraphs
    messageContent.innerHTML = `<p>${formattedContent}</p>`;
  }

  messageDiv.appendChild(messageContent);
  chatMessages.appendChild(messageDiv);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageDiv;
}
