const { saveCase, getCases } = require('../services/caseHistoryService');

/**
 * Save a new triage case to history
 */
async function addHistory(req, res) {
  try {
    const { patientName, patientAge, patientHistory, emergencyDescription, triageResult, performance } = req.body;
    
    if (!patientHistory && !emergencyDescription) {
      return res.status(400).json({ success: false, error: 'Incomplete data for history' });
    }
    
    const savedEntry = saveCase({
      patientName,
      patientAge,
      patientHistory,
      emergencyDescription,
      triageResult,
      performance
    });
    
    res.status(201).json({ success: true, data: savedEntry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get recent triage cases from history
 */
async function getHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const cases = getCases(limit);
    res.json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { addHistory, getHistory };
