export const requestUploadUrlSchema = {
  description: 'Request a presigned upload URL for direct client-to-storage upload',
  tags: ['Media'],
  body: {
    type: 'object',
    required: ['fileName', 'contentType', 'size', 'mediaType', 'context'],
    properties: {
      fileName: { type: 'string', minLength: 1, maxLength: 255 },
      contentType: { type: 'string', minLength: 3, maxLength: 100 },
      size: { type: 'number', minimum: 1 },
      mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'] },
      context: {
        type: 'string',
        enum: [
          'PROFILE_AVATAR',
          'PROGRESS_PHOTO',
          'EXERCISE_VIDEO',
          'EXERCISE_THUMBNAIL',
          'WORKOUT_MEDIA',
          'RECIPE_IMAGE',
          'TRAINER_MEDIA',
          'SOCIAL_POST',
          'CHALLENGE_MEDIA',
        ],
      },
      contextId: { type: 'string' },
      visibility: { type: 'string', enum: ['PRIVATE', 'PUBLIC', 'TRAINER_ONLY', 'FOLLOWERS', 'UNLISTED'] },
    },
  },
};

export const completeUploadSchema = {
  description: 'Confirm direct storage upload completion and enqueue background processing',
  tags: ['Media'],
  params: {
    type: 'object',
    required: ['mediaId'],
    properties: {
      mediaId: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      checksum: { type: 'string' },
    },
  },
};

export const getSignedUrlSchema = {
  description: 'Get a signed delivery URL for a media asset or variant',
  tags: ['Media'],
  params: {
    type: 'object',
    required: ['mediaId'],
    properties: {
      mediaId: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      variant: { type: 'string', enum: ['thumbnail', 'small', 'medium', 'large', 'original'], default: 'original' },
      expiresIn: { type: 'integer', minimum: 60, maximum: 86400, default: 3600 },
    },
  },
};

export const attachMediaSchema = {
  description: 'Attach a ready media asset to a target entity',
  tags: ['Media'],
  params: {
    type: 'object',
    required: ['mediaId'],
    properties: {
      mediaId: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['entityType', 'entityId'],
    properties: {
      entityType: { type: 'string' },
      entityId: { type: 'string' },
      sortOrder: { type: 'integer', default: 0 },
    },
  },
};
