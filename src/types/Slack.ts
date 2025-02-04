export interface SlackPayload {
  challenge?: string;
  event?: Record<string, unknown>;
}

export type MessageWithTextAndUser = {
  text: string;
  user: string;
};
