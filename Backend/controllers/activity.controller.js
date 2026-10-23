const activityService = require("../services/activity.service");

async function logActivity(req, res, next) {
  try {
    const ipAddress =
      req.body.ipAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.ip;

    const result = await activityService.logActivity({
      userId: req.user?.id || req.body.userId,
      action: req.body.action,
      meta: req.body.meta,
      ipAddress,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getActivityStats(req, res, next) {
  try {
    const stats = await activityService.getActivityStats();
    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
}

async function getSuspiciousActivity(req, res, next) {
  try {
    const activities = await activityService.getSuspiciousActivity();
    return res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
}

async function replayCheck(req, res, next) {
  try {
    const ipAddress =
      req.body.ipAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.ip;

    const result = await activityService.checkReplay({
      userId: req.user?.id || req.body.userId,
      action: req.body.action,
      clientTime: req.body.clientTime,
      ipAddress,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  logActivity,
  getActivityStats,
  getSuspiciousActivity,
  replayCheck,
};
