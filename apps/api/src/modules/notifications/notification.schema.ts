export const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'number', default: 1, minimum: 1 },
    limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
  },
};

export const notificationIdParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
  },
};
