import { Type, Static } from '@sinclair/typebox';

const EnvSchema = Type.Object({
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test'),
  ]),
  PORT: Type.String({ default: '3000' }),
  HOST: Type.String({ default: '0.0.0.0' }),
  DATABASE_URL: Type.String(),
  JWT_SECRET: Type.String(),
  GOOGLE_CLIENT_ID: Type.String(),
  GOOGLE_CLIENT_SECRET: Type.String(),
  YOUTUBE_API_KEY: Type.String(),
  FRONTEND_URL: Type.String({ default: 'http://localhost:5173' }),
  BACKEND_URL: Type.String({ default: 'http://localhost:3000' }),
});

export type EnvConfig = Static<typeof EnvSchema>;

export { EnvSchema }; 