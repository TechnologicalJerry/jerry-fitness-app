import { MessageType } from '@prisma/client';

export interface RealtimeEvent<T = any> {
  eventId: string;
  eventType: string; // e.g. "workout.started.v1", "message.created.v1"
  aggregateType: string; // "workout", "message", "goal", "recovery", "notification"
  aggregateId: string;
  userId: string;
  timestamp: string;
  version: string;
  payload: T;
}

export type PresenceState = 'ONLINE' | 'AWAY' | 'OFFLINE' | 'IN_WORKOUT';

export interface PresenceInfo {
  userId: string;
  state: PresenceState;
  lastActive: string;
  currentWorkoutId?: string;
}

export interface ActiveConnectionMeta {
  connectionId: string;
  userId: string;
  deviceId: string;
  connectedAt: string;
  lastHeartbeat: string;
  serverInstanceId: string;
}

export interface RestTimerPayload {
  workoutSessionId: string;
  exerciseId: string;
  setNumber: number;
  durationSeconds: number;
  startedAt: string;
  endsAt: string;
}

export interface LiveWorkoutState {
  workoutSessionId: string;
  userId: string;
  currentExerciseId: string;
  currentSet: number;
  isPaused: boolean;
  activeTimer: RestTimerPayload | null;
  lastEventAt: string;
}

export interface CreateConversationDto {
  participantIds: string[];
  title?: string;
  isGroup?: boolean;
}

export interface SendMessageDto {
  content: string;
  messageType?: MessageType;
  recipientId?: string;
}

export interface QueryMessagesParams {
  cursor?: string;
  limit?: number;
}
