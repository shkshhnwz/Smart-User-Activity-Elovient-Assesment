const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");

const registerUser = async ({ name, email, password }) => {
    if (!name || !email || !password) {
        throw new AppError(
            "Name, email and password are required",
            400
        );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        throw new AppError("Invalid email format", 400);
    }

    if (password.length < 8) {
        throw new AppError(
            "Password must be at least 8 characters",
            400
        );
    }

    const existingUser = await User.findOne({
        email: normalizedEmail,
    });

    if (existingUser) {
        throw new AppError("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
    });

    return {
        id: user._id,
        name: user.name,
        email: user.email,
    };
};

const loginUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new AppError(
            "Email and password are required",
            400
        );
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
    });

    // Use the same message for an unknown email and
    // an incorrect password.
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError("Invalid email or password", 401);
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
    };
};

module.exports = { registerUser, loginUser };