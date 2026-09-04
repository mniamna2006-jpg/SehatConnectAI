import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ChatMessage } from '../../viewmodels/useAiChatViewModel';
import { useAiChatViewModel } from '../../viewmodels/useAiChatViewModel';
import { AiChatView } from '../AiChatView';

let mockIsRTL = false;

jest.mock('../../viewmodels/useAiChatViewModel');
jest.mock('../../../../providers/LocaleProvider', () => {
  const { translate } = require('../../../../i18n');
  return {
    useOptionalLocale: () => ({ isRTL: mockIsRTL }),
    useTranslations: () => (key: string) => translate(mockIsRTL ? 'URDU' : 'ENGLISH', key),
  };
});
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text: MockText } = require('react-native');
  return ({ name }: { name: string }) => <MockText testID={`icon-${name}`} />;
});
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const baseVm = {
  messages: [] as ChatMessage[],
  input: '',
  setInput: jest.fn(),
  onSend: jest.fn(),
  isSending: false,
  sendError: null as string | null,
  isHistoryLoading: false,
  isHistoryError: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsRTL = false;
});

test('shows an empty state when the conversation has no messages', async () => {
  (useAiChatViewModel as jest.Mock).mockReturnValue({ ...baseVm });
  await render(<AiChatView />);

  expect(screen.getByText("Tell us what's going on")).toBeOnTheScreen();
});

test('renders user and AI messages', async () => {
  (useAiChatViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    messages: [
      { id: '1', sender: 'USER', text: 'I have a fever', is_emergency: false, recommendation: null },
      { id: '2', sender: 'AI', text: 'You should see a General Physician.', is_emergency: false, recommendation: null },
    ],
  });
  await render(<AiChatView />);

  expect(screen.getByText('I have a fever')).toBeOnTheScreen();
  expect(screen.getByText('You should see a General Physician.')).toBeOnTheScreen();
});

test('shows a prominent emergency warning when the backend flags a message as emergency', async () => {
  (useAiChatViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    messages: [{ id: '1', sender: 'AI', text: 'Seek care now.', is_emergency: true, recommendation: null }],
  });
  await render(<AiChatView />);

  expect(screen.getByText(/medical emergency/)).toBeOnTheScreen();
});

test('renders the recommended department and links to its real doctors route', async () => {
  (useAiChatViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    messages: [
      {
        id: '1',
        sender: 'AI',
        text: 'See Cardiology.',
        is_emergency: false,
        recommendation: {
          recommended_department: { department_id: 'd1', name: 'Cardiology', hospital_id: 'h1', hospital_name: 'City Hospital', city: 'Lahore' },
          doctors: [],
        },
      },
    ],
  });
  await render(<AiChatView />);

  expect(screen.getByText('Cardiology')).toBeOnTheScreen();
  fireEvent.press(screen.getByText('View doctors'));
  expect(router.push).toHaveBeenCalledWith('/department/d1/doctors');
});

test('flips the view-doctors disclosure arrow for RTL locales', async () => {
  const recommendationVm = {
    ...baseVm,
    messages: [
      {
        id: '1',
        sender: 'AI',
        text: 'See Cardiology.',
        is_emergency: false,
        recommendation: {
          recommended_department: { department_id: 'd1', name: 'Cardiology', hospital_id: 'h1', hospital_name: 'City Hospital', city: 'Lahore' },
          doctors: [],
        },
      },
    ],
  };
  (useAiChatViewModel as jest.Mock).mockReturnValue(recommendationVm);
  await render(<AiChatView />);
  expect(screen.getByTestId('icon-arrow-forward')).toBeOnTheScreen();

  mockIsRTL = true;
  (useAiChatViewModel as jest.Mock).mockReturnValue(recommendationVm);
  await render(<AiChatView />);
  expect(screen.getAllByTestId('icon-arrow-back').length).toBeGreaterThan(0);
});

test('renders recommended doctors as informational cards without navigation', async () => {
  (useAiChatViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    messages: [
      {
        id: '1',
        sender: 'AI',
        text: 'See Cardiology.',
        is_emergency: false,
        recommendation: {
          recommended_department: null,
          doctors: [{ doctor_id: 'doc1', name: 'Dr. Ali', specialization: 'Cardiologist', qualification: 'MBBS', consultation_fee: 2000, department_id: 'd1', department_name: 'Cardiology', hospital_id: 'h1', hospital_name: 'City Hospital', city: 'Lahore' }],
        },
      },
    ],
  });
  await render(<AiChatView />);

  expect(screen.getByText('Dr. Ali')).toBeOnTheScreen();
});

test('handles nullable doctor recommendation fields without fake fee copy', async () => {
  (useAiChatViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    messages: [
      {
        id: '1',
        sender: 'AI',
        text: 'See Cardiology.',
        is_emergency: false,
        recommendation: {
          recommended_department: null,
          doctors: [{
            doctor_id: 'doc1',
            name: 'Dr. Ali',
            specialization: 'Cardiologist',
            qualification: null,
            consultation_fee: null,
            department_id: 'd1',
            department_name: 'Cardiology',
            hospital_id: 'h1',
            hospital_name: 'City Hospital',
            city: 'Lahore',
          }],
        },
      },
    ],
  });
  await render(<AiChatView />);

  expect(screen.getByText('Dr. Ali')).toBeOnTheScreen();
  expect(screen.queryByText(/Consultation fee/)).not.toBeOnTheScreen();
});

test('sending calls onSend and disables the button while empty', async () => {
  const vm = { ...baseVm, input: 'hello' };
  (useAiChatViewModel as jest.Mock).mockReturnValue(vm);
  await render(<AiChatView />);

  fireEvent.press(screen.getByLabelText('Send'));
  expect(vm.onSend).toHaveBeenCalled();
});

test('shows a send error banner without losing typed input', async () => {
  (useAiChatViewModel as jest.Mock).mockReturnValue({ ...baseVm, input: 'still here', sendError: "We couldn't send that. Please try again." });
  await render(<AiChatView />);

  expect(screen.getByText("We couldn't send that. Please try again.")).toBeOnTheScreen();
  expect(screen.getByDisplayValue('still here')).toBeOnTheScreen();
});

test('opens history from the header action', async () => {
  (useAiChatViewModel as jest.Mock).mockReturnValue({ ...baseVm });
  await render(<AiChatView />);

  fireEvent.press(screen.getByLabelText('History'));
  expect(router.push).toHaveBeenCalledWith('/ai-history');
});
