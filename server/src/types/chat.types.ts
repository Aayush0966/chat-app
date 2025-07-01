import { MessageType } from "@prisma/client";

type UserId = string;

export interface Chat {
    name?: string;
    creatorId: UserId;
    participantIds: UserId[];
    isGroup: boolean;
}

export interface Message {
    senderId: string;
    chatId: string;
    type: MessageType
    text?: string;
    attachment?: string;
}