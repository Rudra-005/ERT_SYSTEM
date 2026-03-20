const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../../logs/cases.json');

/**
 * Ensure the history file exists
 */
function ensureHistoryFile() {
  const logDir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Save a new case to the history
 */
function saveCase(caseData) {
  try {
    ensureHistoryFile();
    
    // Read existing cases
    const fileContent = fs.readFileSync(HISTORY_FILE, 'utf8');
    const cases = JSON.parse(fileContent);
    
    // Create new entry
    const newEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      patientName: caseData.patientName || 'Unknown Patient',
      patientAge: caseData.patientAge || 'N/A',
      patientHistory: caseData.patientHistory || '',
      emergencyDescription: caseData.emergencyDescription || '',
      triageResult: caseData.triageResult || {},
      performance: caseData.performance || {}
    };
    
    // Add to start of list (newest first)
    cases.unshift(newEntry);
    
    // Keep last 50 cases for performance
    const limitedCases = cases.slice(0, 50);
    
    // Write back to file
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limitedCases, null, 2));
    
    return newEntry;
  } catch (error) {
    console.error('Failed to save case history:', error.message);
    throw error;
  }
}

/**
 * Get all saved cases
 */
function getCases(limit = 20) {
  try {
    ensureHistoryFile();
    const fileContent = fs.readFileSync(HISTORY_FILE, 'utf8');
    const cases = JSON.parse(fileContent);
    return cases.slice(0, limit);
  } catch (error) {
    console.error('Failed to get case history:', error.message);
    return [];
  }
}

module.exports = { saveCase, getCases };
