/**
 * Application Configuration
 */

export const CONFIG = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'porsche_secret_jwt_key_2026_super_secure',
    JWT_EXPIRES_IN: '7d'
};
