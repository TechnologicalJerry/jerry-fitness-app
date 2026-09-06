export const RedisKeyBuilder = {
  connection: (connectionId: string) => `realtime:connection:${connectionId}`,
  userConnections: (userId: string) => `realtime:user:${userId}`,
  userPresence: (userId: string) => `presence:user:${userId}`,
  trainerPresence: (trainerId: string) => `presence:trainer:${trainerId}`,
  liveWorkout: (workoutSessionId: string) => `workout:live:${workoutSessionId}`,
  conversationUnread: (conversationId: string, userId: string) => `conversation:unread:${conversationId}:${userId}`,
  userTotalUnread: (userId: string) => `user:unread:${userId}`,
  typingIndicator: (conversationId: string, userId: string) => `typing:${conversationId}:${userId}`,
};
