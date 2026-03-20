const express = require('express');
const router = express.Router();
const { addHistory, getHistory } = require('../controllers/historyController');

/**
 * GET /api/history - Get all saved cases
 * POST /api/history - Save a new case
 */
router.get('/', getHistory);
router.post('/', addHistory);

module.exports = router;
