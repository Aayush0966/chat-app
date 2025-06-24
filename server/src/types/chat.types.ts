type UserId = string;

interface Chat {
    name?: string;
    creatorId: UserId;
    participantIds: UserId[];
    isGroup: boolean;
}

interface Message {
    senderId: string;
    receiverId: string;
    chatId: string;
    text: string;
    attachment: string;
}