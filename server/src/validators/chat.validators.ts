import {z} from "zod";

export const chatSchema = z.object({
    name: z.string().optional().nullable(),
    creatorId: z.string().nonempty("Creator ID is required!"),
    participantIds: z.array(z.string().nonempty("Participants IDs are required!")),
    isGroup: z.boolean().default(false)
})