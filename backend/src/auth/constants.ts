export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'dev-secret-key',
  expiresIn: '8h',
} as const;
