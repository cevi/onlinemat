import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';

// German translations
import commonDe from 'locales/de/common.json';
import navigationDe from 'locales/de/navigation.json';
import materialDe from 'locales/de/material.json';
import orderDe from 'locales/de/order.json';
import abteilungDe from 'locales/de/abteilung.json';
import memberDe from 'locales/de/member.json';
import groupDe from 'locales/de/group.json';
import categoryDe from 'locales/de/category.json';
import standortDe from 'locales/de/standort.json';
import profileDe from 'locales/de/profile.json';
import searchDe from 'locales/de/search.json';
import validationDe from 'locales/de/validation.json';
import excelDe from 'locales/de/excel.json';
import releaseNoteDe from 'locales/de/releaseNote.json';

// English translations
import commonEn from 'locales/en/common.json';
import navigationEn from 'locales/en/navigation.json';
import materialEn from 'locales/en/material.json';
import orderEn from 'locales/en/order.json';
import abteilungEn from 'locales/en/abteilung.json';
import memberEn from 'locales/en/member.json';
import groupEn from 'locales/en/group.json';
import categoryEn from 'locales/en/category.json';
import standortEn from 'locales/en/standort.json';
import profileEn from 'locales/en/profile.json';
import searchEn from 'locales/en/search.json';
import validationEn from 'locales/en/validation.json';
import excelEn from 'locales/en/excel.json';
import releaseNoteEn from 'locales/en/releaseNote.json';

const LANGUAGE_KEY = 'onlinemat-language';

export const getSavedLanguage = (): string => {
  return localStorage.getItem(LANGUAGE_KEY) || 'de';
};

export const saveLanguage = (lang: string): void => {
  localStorage.setItem(LANGUAGE_KEY, lang);
};

const dayjsLocaleMap: Record<string, string> = {
  de: 'de-ch',
  en: 'en',
};

export const syncDayjsLocale = (lang: string): void => {
  dayjs.locale(dayjsLocaleMap[lang] || 'de-ch');
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: {
        common: commonDe,
        navigation: navigationDe,
        material: materialDe,
        order: orderDe,
        abteilung: abteilungDe,
        member: memberDe,
        group: groupDe,
        category: categoryDe,
        standort: standortDe,
        profile: profileDe,
        search: searchDe,
        validation: validationDe,
        excel: excelDe,
        releaseNote: releaseNoteDe,
      },
      en: {
        common: commonEn,
        navigation: navigationEn,
        material: materialEn,
        order: orderEn,
        abteilung: abteilungEn,
        member: memberEn,
        group: groupEn,
        category: categoryEn,
        standort: standortEn,
        profile: profileEn,
        search: searchEn,
        validation: validationEn,
        excel: excelEn,
        releaseNote: releaseNoteEn,
      },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'de',
    defaultNS: 'common',
    ns: [
      'common', 'navigation', 'material', 'order', 'abteilung',
      'member', 'group', 'category', 'standort', 'profile',
      'search', 'validation', 'excel', 'releaseNote',
    ],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

syncDayjsLocale(getSavedLanguage());

export default i18n;
