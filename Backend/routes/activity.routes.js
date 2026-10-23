const express = require("express");
const activityController = require("../controllers/activity.controller");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateUser);

router.post("/", activityController.logActivity);
router.get("/stats", activityController.getActivityStats);
router.get("/suspicious", activityController.getSuspiciousActivity);
router.post("/replay-check", activityController.replayCheck);

module.exports = router;