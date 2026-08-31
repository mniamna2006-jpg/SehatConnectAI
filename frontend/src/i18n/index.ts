import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import type { PreferredLanguage } from '../shared/types/api';
import en from './en.json';
import ur from './ur.json';
import urRoman from './ur-roman.json';

const i18n = new I18n({ ENGLISH: en, URDU: ur, ROMAN_URDU: urRoman });
i18n.defaultLocale = 'ENGLISH';
i18n.enableFallback = true;

export function resolveDeviceDefault(): PreferredLanguage {
  return Localization.getLocales()[0]?.languageCode === 'ur' ? 'URDU' : 'ENGLISH';
}

export function translate(locale: PreferredLanguage, key: string): string {
  i18n.locale = locale;
  return i18n.t(key, { defaultValue: key });
}
