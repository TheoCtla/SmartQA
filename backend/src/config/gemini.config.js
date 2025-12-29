/**
 * Configuration du client Google Gemini AI
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialisation du client avec la clé API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = { genAI };
