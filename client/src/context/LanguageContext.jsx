// src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { LANGUAGES, TRANSLATIONS } from "../utils/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("nagarseva_lang") || "en";
  });

  const setLanguage = (langCode) => {
    setLanguageState(langCode);
    localStorage.setItem("nagarseva_lang", langCode);
  };

  const t = (key, fallback = "") => {
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    return TRANSLATIONS.en[key] || fallback || key;
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: LANGUAGES,
        speechLocale: currentLangObj.speechLocale,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
