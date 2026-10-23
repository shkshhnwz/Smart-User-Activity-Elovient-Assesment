const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Authentication token required", 401);
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
        };

        return next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return next(new AppError("Invalid or expired token", 401));
        }

        return next(error);
    }
};

module.exports = { authenticateUser };