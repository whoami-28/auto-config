/**
 * Centralized Error Handler Middleware
 * Formats all uncaught errors into structured JSON responses with appropriate HTTP codes.
 */

export function errorHandler(err, req, res, next) {
    console.error('Server Error:', err);

    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

    res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: err.message || 'Внутренняя ошибка сервера',
            details: err.details || null
        }
    });
}
