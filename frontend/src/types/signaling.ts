
export type CallMessageType =
  | "call-request"
  | "call-accept"
  | "call-reject"
  | "call-offer"
  | "call-answer"
  | "call-ice"
  | "call-end";

export interface BaseMessage {
  type: CallMessageType;
  from?: string;
  to?: string;
}

export interface CallOfferMessage extends BaseMessage {
  type: "call-offer";
  offer: RTCSessionDescriptionInit;
}

export interface CallAnswerMessage extends BaseMessage {
  type: "call-answer";
  answer: RTCSessionDescriptionInit;
}

export interface CallIceMessage extends BaseMessage {
  type: "call-ice";
  candidate: RTCIceCandidateInit;
}

export type SignalingMessage =
  | CallOfferMessage
  | CallAnswerMessage
  | CallIceMessage
  | BaseMessage;