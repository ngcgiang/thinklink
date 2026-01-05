/**
 * Utility functions cho xử lý text và parsing
 */

/**
 * Clean và normalize text từ user input
 */
const cleanText = (text) => {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * Extract số từ text
 */
const extractNumbers = (text) => {
  const matches = text.match(/\d+\.?\d*/g);
  return matches ? matches.map(Number) : [];
};

/**
 * Detect đơn vị trong text (m/s, kg, m, s, etc.)
 */
const detectUnits = (text) => {
  const unitPatterns = [
    /m\/s²?/gi,  // m/s hoặc m/s²
    /km\/h/gi,   // km/h
    /\bkg\b/gi,  // kg
    /\bm\b/gi,   // m (mét)
    /\bs\b/gi,   // s (giây)
    /\bN\b/gi,   // N (Newton)
    /\bJ\b/gi    // J (Joule)
  ];
  
  const units = [];
  unitPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      units.push(...matches);
    }
  });
  
  return [...new Set(units)]; // Remove duplicates
};

/**
 * Format response data
 */
const formatAnalysisResponse = (data) => {
  return {
    summary: data.summary || '',
    key_points: data.key_points || [],
    unknowns: data.unknowns || [],
    metadata: {
      total_key_points: data.key_points?.length || 0,
      level_1_count: data.key_points?.filter(p => p.level === 1).length || 0,
      level_2_count: data.key_points?.filter(p => p.level === 2).length || 0,
      unknowns_count: data.unknowns?.length || 0
    }
  };
};

module.exports = {
  cleanText,
  extractNumbers,
  detectUnits,
  formatAnalysisResponse
};
