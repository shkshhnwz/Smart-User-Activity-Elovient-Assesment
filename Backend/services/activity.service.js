const mongoose = require("mongoose");
// Note: Ensure the file name in models/ is activityModels or activityModel
const ActivityLog = require("../models/activityModels");
const AppError = require("../utils/AppError");

const ACTION_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 1000;
const REPLAY_WINDOW_MS = 3 * 1000; 
const MAX_CLOCK_DIFFERENCE_MS = 30 * 1000; 

const logActivity = async ({
    userId,
    action,
    meta,
    ipAddress,
}) => {
    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    if (!action || typeof action !== "string") {
        throw new AppError("Action is required and must be a string", 400);
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);

    const actionsInWindow = await ActivityLog.countDocuments({
        userId,
        createdAt: { $gte: windowStart, $lte: now },
    });

    if (actionsInWindow >= ACTION_LIMIT) {
        throw new AppError(
            "Rate limit exceeded. Maximum 5 actions per 10 seconds.",
            429
        );
    }

    const log = await ActivityLog.create({
        userId,
        action,
        meta: meta || {},
        ipAddress: ipAddress || "",
        createdAt: now,
    });

    return {
        success: true,
        serverTime: now.toISOString(),
        actionsInLast10Sec: actionsInWindow + 1,
        activityId: log._id,
    };
};

const getActivityStats = async () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const [
        totalActions,
        commonActionResult,
        activeUserResult,
        minuteResults,
    ] = await Promise.all([
        ActivityLog.countDocuments(),

        ActivityLog.aggregate([
            {
                $group: {
                    _id: "$action",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 1 },
        ]),

        ActivityLog.aggregate([
            {
                $group: {
                    _id: "$userId",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 1 },
        ]),

        ActivityLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: tenMinutesAgo, $lte: now },
                },
            },
            {
                $group: {
                    _id: {
                        $dateTrunc: {
                            date: "$createdAt",
                            unit: "minute",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);

    const actionsPerMinute = [];
    const currentMinute = new Date(now);
    currentMinute.setUTCSeconds(0, 0);

    for (let i = 9; i >= 0; i--) {
        const minute = new Date(
            currentMinute.getTime() - i * 60 * 1000
        );

        const result = minuteResults.find(
            (item) => new Date(item._id).getTime() === minute.getTime()
        );

        actionsPerMinute.push({
            minute: minute.toISOString(),
            count: result ? result.count : 0,
        });
    }

    return {
        totalActions,
        mostCommonAction: commonActionResult[0]?._id || null,
        actionsPerMinute,
        mostActiveUser: activeUserResult[0]
            ? {
                userId: activeUserResult[0]._id,
                count: activeUserResult[0].count,
            }
            : null,
    };
};

const getSuspiciousActivity = async () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [highFrequencyUsers, multipleIpUsers] = await Promise.all([
        ActivityLog.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: oneMinuteAgo,
                        $lte: now,
                    },
                },
            },
            {
                $group: {
                    _id: "$userId",
                    count: { $sum: 1 },
                },
            },
            {
                $match: { count: { $gt: 20 } },
            },
        ]),

        ActivityLog.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: fiveMinutesAgo,
                        $lte: now,
                    },
                    ipAddress: { $exists: true, $ne: "" },
                },
            },
            {
                $group: {
                    _id: "$userId",
                    ipAddresses: { $addToSet: "$ipAddress" },
                },
            },
            {
                $project: {
                    count: { $size: "$ipAddresses" },
                },
            },
            {
                $match: { count: { $gt: 2 } },
            },
        ]),
    ]);

    const suspiciousUsers = new Map();

    for (const user of highFrequencyUsers) {
        suspiciousUsers.set(user._id.toString(), {
            userId: user._id,
            reason: "High frequency",
            count: user.count
        });
    }

    for (const user of multipleIpUsers) {
        const id = user._id.toString();
        const existing = suspiciousUsers.get(id);

        if (existing) {
            existing.reason += " / Multiple IPs";
            existing.ipCount = user.count;
        } else {
            suspiciousUsers.set(id, {
                userId: user._id,
                reason: "Multiple IPs",
                count: user.count,
            });
        }
    }

    return Array.from(suspiciousUsers.values());
};

const checkReplay = async ({
    userId,
    action,
    clientTime,
    ipAddress,
}) => {
    if (!userId) {
        throw new AppError("User ID is required", 400);
    }

    if (!action || !clientTime) {
        throw new AppError(
            "Action and clientTime are required",
            400
        );
    }

    const clientTimestamp = new Date(clientTime);
    if (Number.isNaN(clientTimestamp.getTime())) {
        throw new AppError("Invalid clientTime", 400);
    }

    const now = new Date();
    const clockDifference = Math.abs(
        now.getTime() - clientTimestamp.getTime()
    );

    if (clockDifference > MAX_CLOCK_DIFFERENCE_MS) {
        throw new AppError(
            "Replay rejected: client timestamp is too far from server time",
            400
        );
    }

    const replayWindowStart = new Date(
        now.getTime() - REPLAY_WINDOW_MS
    );

    const previousAction = await ActivityLog.findOne({
        userId,
        action,
        createdAt: {
            $gte: replayWindowStart,
            $lte: now,
        },
    }).lean();

    if (previousAction) {
        throw new AppError(
            "Replay rejected: the same action was submitted within 3 seconds",
            409
        );
    }

    const log = await ActivityLog.create({
        userId,
        action,
        meta: { source: "replay-check" },
        ipAddress: ipAddress || "",
        createdAt: now,
    });

    return {
        allowed: true,
        serverTime: now.toISOString(),
        activityId: log._id,
    };
};

module.exports = {
    logActivity,
    getActivityStats,
    getSuspiciousActivity,
    checkReplay,
};
