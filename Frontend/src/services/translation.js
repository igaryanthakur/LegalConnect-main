// Alternative options for translation APIs
const LIBRE_TRANSLATE_API = "https://libretranslate.com/translate";
const MYMEMORY_API = "https://api.mymemory.translated.net/get";

/**
 * Translate text using MyMemory's free translation API
 * This API doesn't require authentication for limited usage
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text, targetLang) {
  try {
    // Default source language is English
    const sourceLang = "en";

    // MyMemory API uses different format for some languages
    const langMap = {
      hi: "hi-IN",
      bn: "bn-IN",
      te: "te-IN",
      ta: "ta-IN",
      gu: "gu-IN",
      mr: "mr-IN",
    };

    const mappedLang = langMap[targetLang] || targetLang;
    const langPair = `${sourceLang}|${mappedLang}`;

    const response = await fetch(
      `${MYMEMORY_API}?q=${encodeURIComponent(
        text
      )}&langpair=${langPair}&de=admin@lawsphere.org`
    );

    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return text; // Return original text on error
    }

    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData.translatedText) {
      return data.responseData.translatedText;
    } else {
      console.warn("Translation response issue:", data);
      return text;
    }
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text on error
  }
}

/**
 * Translate multiple key-value pairs for a language
 * @param {Object} translations - Object with keys to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} - Object with translated values
 */
export async function translateBatch(translations, targetLang) {
  const result = {};
  const keys = Object.keys(translations);

  try {
    // Process in smaller batches to avoid API limits
    const batchSize = 10;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);

      // Process this batch in parallel
      const promises = batch.map(async (key) => {
        const translated = await translateText(translations[key], targetLang);
        return { key, translated };
      });

      // Wait for all translations in this batch
      const results = await Promise.all(promises);

      // Add to result object
      results.forEach((item) => {
        result[item.key] = item.translated;
      });

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < keys.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return result;
  } catch (error) {
    console.error("Batch translation error:", error);
    // Return original text on error
    keys.forEach((key) => {
      result[key] = translations[key];
    });
    return result;
  }
}
