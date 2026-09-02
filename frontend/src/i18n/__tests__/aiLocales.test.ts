import en from '../en.json';
import urRoman from '../ur-roman.json';
import ur from '../ur.json';

test('keeps ai.chat and ai.history keys in parity across locales', () => {
  expect(Object.keys(ur.ai.chat).sort()).toEqual(Object.keys(en.ai.chat).sort());
  expect(Object.keys(urRoman.ai.chat).sort()).toEqual(Object.keys(en.ai.chat).sort());
  expect(Object.keys(ur.ai.history).sort()).toEqual(Object.keys(en.ai.history).sort());
  expect(Object.keys(urRoman.ai.history).sort()).toEqual(Object.keys(en.ai.history).sort());
});

test('keeps home.actions.aiAssistant keys in parity across locales', () => {
  expect(Object.keys(ur.home.actions.aiAssistant).sort()).toEqual(Object.keys(en.home.actions.aiAssistant).sort());
  expect(Object.keys(urRoman.home.actions.aiAssistant).sort()).toEqual(Object.keys(en.home.actions.aiAssistant).sort());
});

test('provides distinct localized copy for Urdu', () => {
  expect(ur.ai.chat.emergencyWarning).not.toBe(en.ai.chat.emergencyWarning);
  expect(ur.ai.history.emptyMessage).not.toBe(en.ai.history.emptyMessage);
});
