// Backend/middleware/isTeacher.js
//
// Same shape as your existing isAdmin.js — assumes an auth middleware runs
// before this one and sets req.user (from the JWT). Allows admins through
// too, so admins can view the teacher panel for oversight.

const isTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Login required",
    });
  }

  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Sirf teacher access kar sakte hain",
    });
  }

  next();
};

module.exports = isTeacher;
