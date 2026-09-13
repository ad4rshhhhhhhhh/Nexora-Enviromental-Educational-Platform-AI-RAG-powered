// Assumes your User model has a `role` field (e.g. "admin" / "student").
// Must run AFTER the auth middleware, since it relies on req.user being set.
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};

module.exports = isAdmin;
