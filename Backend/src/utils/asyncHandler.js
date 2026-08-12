/**
 * Wrapper untuk menghindari try/catch berulang di tiap handler.
 * Error otomatis diteruskan ke error handler global.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
