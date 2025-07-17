import type { FieldValues, Control } from "react-hook-form";

export interface LoginFormInputs {
  phoneNumber: string;
  password: string;
}

export interface RegisterFormInputs {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface ForgotFormInputs {
  email: string;
}

export interface ValidateOTPInputs {
  email: string;
  OTP: string;
}

export interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
}

export interface UserSearchQuery {
  query: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ChatParticipant {
  userId: string;
  chatId: string;
  deleted?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  userId?: string; // ID of the other user in direct chats
  participants?: ChatParticipant[];
  lastMessageSenderId?: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageType?: string | null;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  reactedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  sentAt: string;
  type: string;
  attachment?: string; // Server uses 'attachment' field for image URLs
  isUploading?: boolean; // Flag to show loading state for image uploads
  isTemp?: boolean; // Flag to identify temporary messages
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  readBy?: string[]; // Array of user IDs who have read the message
  delivered?: boolean; // Indicates if the message has been delivered
  reactions?: MessageReaction[]; // Array of reactions on the message
}

export interface SendMessageInput {
  chatId: string;
  text: string;
  messageType: string;
}

export interface TypingData {
  chatId: string;
  typingUserName: string;
  typingUserId: string;
}