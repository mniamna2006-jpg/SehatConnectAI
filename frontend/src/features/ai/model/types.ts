import type { PreferredLanguage } from '../../../shared/types/api';

export type ChatSender = 'USER' | 'AI';

export interface RecommendedDepartment {
  department_id: string;
  name: string;
  hospital_id: string;
  hospital_name: string;
  city: string;
}

export interface RecommendedDoctor {
  doctor_id: string;
  name: string;
  specialization: string;
  qualification: string;
  consultation_fee: number;
  department_id: string;
  department_name: string;
  hospital_id: string;
  hospital_name: string;
  city: string;
}

export interface ChatResponse {
  conversation_id: string;
  message: string;
  is_emergency: boolean;
  recommended_department: RecommendedDepartment | null;
  doctors: RecommendedDoctor[];
}

export interface ConversationSummary {
  conversation_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  latest_message: { message_id: string; sender: ChatSender; message: string; created_at: string } | null;
}

export interface ConversationMessage {
  message_id: string;
  sender: ChatSender;
  message: string;
  language: PreferredLanguage | null;
  is_emergency: boolean;
  created_at: string;
  recommendation: { recommended_department: RecommendedDepartment | null; doctors: RecommendedDoctor[] };
}

export interface ConversationDetail {
  conversation_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: ConversationMessage[];
}
