import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translation from "../../../public/locales/en/translation.json";
import spectrumCards from "../../../public/locales/en/spectrum-cards.json";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  initImmediate: false,
  resources: {
    en: {
      translation,
      "spectrum-cards": spectrumCards as any,
    },
  },
  ns: ["translation", "spectrum-cards"],
  defaultNS: "translation",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
