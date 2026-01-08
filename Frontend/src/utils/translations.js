// Translations utility functions and data

// Available languages with their display names and codes
export const availableLanguages = {
  en: {
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    builtIn: true, // Flag to indicate built-in translation support
  },
  hi: {
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    builtIn: true, // Flag to indicate built-in translation support
  },
};

// Translation strings for each language
const translations = {
  en: {
    // Navigation
    home: "Home",
    findLawyers: "Find Lawyers",
    resources: "Resources",
    community: "Community",
    aiAssistant: "AI Assistant",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
    welcome: "Welcome",

    // Home Page
    heroTitle: "Access to Legal Aid Made Simple",
    heroDescription:
      "Connect with affordable legal services and pro bono lawyers. Get the legal help you need.",
    findLawyer: "Find a Lawyer",
    askAi: "Ask AI Assistant",
    ourServices: "Our Services",
    lawyerDirectory: "Lawyer Directory",
    lawyerDirectoryDesc:
      "Find and connect with pro bono lawyers and affordable legal services in your area.",
    aiAssistantService: "AI Legal Assistant",
    aiAssistantDesc:
      "Get instant answers to common legal questions through our AI-powered assistant.",
    resourceLibrary: "Resource Library",
    resourceLibraryDesc:
      "Access guides, documents, and educational materials on various legal topics.",
    communityForums: "Community Forums",
    communityForumsDesc:
      "Join discussions, share experiences, and learn from others facing similar legal issues.",

    // Footer
    aboutLawSphere: "About LawSphere",
    aboutLawSphereDesc:
      "LawSphere connects those in need with pro bono lawyers and affordable legal services.",
    quickLinks: "Quick Links",
    contactUs: "Contact Us",
    allRightsReserved: "All rights reserved",
  },
  hi: {
    // Navigation
    home: "होम",
    findLawyers: "वकील खोजें",
    resources: "संसाधन",
    community: "समुदाय",
    aiAssistant: "एआई सहायक",
    login: "लॉगिन",
    signup: "साइन अप",
    logout: "लॉग आउट",
    welcome: "स्वागत है",

    // Home Page
    heroTitle: "कानूनी सहायता तक पहुंच आसान बनाई",
    heroDescription:
      "किफायती कानूनी सेवाओं और प्रो बोनो वकीलों से जुड़ें। आपको जरूरी कानूनी मदद पाएं।",
    findLawyer: "वकील खोजें",
    askAi: "एआई से पूछें",
    ourServices: "हमारी सेवाएं",
    lawyerDirectory: "वकील निर्देशिका",
    lawyerDirectoryDesc:
      "अपने क्षेत्र में प्रो बोनो वकीलों और किफायती कानूनी सेवाओं को खोजें और उनसे जुड़ें।",
    aiAssistantService: "एआई कानूनी सहायक",
    aiAssistantDesc:
      "हमारे एआई-संचालित सहायक के माध्यम से सामान्य कानूनी प्रश्नों के तुरंत उत्तर प्राप्त करें।",
    resourceLibrary: "संसाधन पुस्तकालय",
    resourceLibraryDesc:
      "विभिन्न कानूनी विषयों पर गाइड, दस्तावेज और शैक्षिक सामग्री तक पहुंच प्राप्त करें।",
    communityForums: "समुदाय मंच",
    communityForumsDesc:
      "चर्चाओं में शामिल हों, अनुभव साझा करें और समान कानूनी मुद्दों का सामना करने वाले अन्य लोगों से सीखें।",

    // Footer
    aboutLawSphere: "लॉस्फियर के बारे में",
    aboutLawSphereDesc:
      "लॉस्फियर जरूरतमंद लोगों को प्रो बोनो वकीलों और किफायती कानूनी सेवाओं से जोड़ता है।",
    quickLinks: "त्वरित लिंक्स",
    contactUs: "संपर्क करें",
    allRightsReserved: "सर्वाधिकार सुरक्षित",
  },
};

// Get current language from localStorage or use browser language or default to English
export function getCurrentLanguage() {
  const savedLang = localStorage.getItem("language");
  if (savedLang && availableLanguages[savedLang]) {
    return savedLang;
  }

  // Try to get browser language (just the first 2 chars for language code)
  const browserLang = navigator.language.split("-")[0];
  if (availableLanguages[browserLang]) {
    return browserLang;
  }

  // Default to English
  return "en";
}

// Set language and save to localStorage
export function setLanguage(langCode) {
  if (availableLanguages[langCode]) {
    localStorage.setItem("language", langCode);
    document.documentElement.setAttribute("lang", langCode);
    return true;
  }
  return false;
}

// Get a translated string
export function translate(key, langCode = null) {
  const currentLang = langCode || getCurrentLanguage();

  // Try to get the translation for the current language
  if (translations[currentLang] && translations[currentLang][key]) {
    return translations[currentLang][key];
  }

  // Fallback to English if translation not found
  if (translations.en && translations.en[key]) {
    return translations.en[key];
  }

  // Return the key itself if no translation found
  return key;
}

// Apply translations to the current page
export function applyTranslations() {
  const currentLang = getCurrentLanguage();
  console.log(`Applying translations for: ${currentLang}`);

  // Update document language
  document.documentElement.setAttribute("lang", currentLang);

  // Apply translations using our dictionary (all languages are built-in now)
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (key) {
      element.textContent = translate(key, currentLang);
    }
  });
  return true;
}

// Apply translations asynchronously
export function applyTranslationsAsync() {
  // Since we only have built-in languages now, we can just call applyTranslations directly
  setTimeout(() => {
    applyTranslations();
  }, 300);
}
