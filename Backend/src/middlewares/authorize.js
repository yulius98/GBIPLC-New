import AppError from '../utils/AppError.js';
/**
 * Middleware otorisasi berbasis role.
 * Wajib dipasang SETELAH middleware authenticate.
 *
 * @param {...string} allowedRoles - role yang diizinkan, mis. authorize('pengurus')
 * @returns middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthenticated. Silakan login terlebih dahulu.', 401));
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return next(
        new AppError(
          'Access denied. Insufficient permissions.',
          403,
          { required_roles: allowedRoles, current_role: role }
        )
      );
    }

    next();
  };
}

export default authorize;
