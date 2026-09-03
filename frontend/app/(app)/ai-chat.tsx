import { useLocalSearchParams } from 'expo-router';
import { AiChatView } from '../../src/features/ai/views/AiChatView';

export default function AiChatRoute() {
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  return <AiChatView conversationId={typeof conversationId === 'string' ? conversationId : undefined} />;
}
