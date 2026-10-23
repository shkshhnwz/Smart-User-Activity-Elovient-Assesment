const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

dotenv.config();

const AppError = require("./utils/AppError");
const authRoutes = require("./routes/auth.routes");
const activityRoutes = require("./routes/activity.routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);

app.use((req, res, next) => {
    next(new AppError("Route not found", 404));
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    if (statusCode === 500) {
        console.error(err);
    }

    return res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? "Internal server error" : err.message,
    });
});

const PORT = process.env.PORT;

mongoose
    .connect(process.env.MONGOURL)
    .then(() => {
        console.log("Connected to MongoDB successfully");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err.message);
        process.exit(1);
    });

module.exports = app;
