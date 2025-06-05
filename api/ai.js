const axios = require("axios");
const fs = require('fs');
const path = require('path');


const systemPromptPath = path.join(__dirname, 'aiSystemPrompt.txt'); // Assicurati che il percorso sia corretto
const systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');

module.exports = async (req, res) => {
    console.log("Request received. Method:", req.method);

    const allowedOrigins = [
        'https://shopping-assistant-three.vercel.app',
        'http://localhost:4200'
    ];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        console.warn(`Origin ${origin} not allowed.`);
    }

    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        console.log("Handling OPTIONS (preflight) request within the function.");
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        console.warn(`Method not allowed: ${req.method}`);
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string") {
            console.error("Error: Missing or invalid prompt.");
            return res.status(400).json({ error: "Missing or invalid prompt" });
        }

        const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
        const MODEL_NAME = "mistral-tiny";

        if (!systemPrompt) {
            console.error("Error: AI System Prompt is not loaded.");
            return res.status(500).json({ error: "Server configuration error: AI System Prompt not found." });
        }

        console.log(`Sending request to Mistral AI for model: ${MODEL_NAME}...`);

        const mistralResponse = await axios.post(
            MISTRAL_API_URL,
            {
                model: MODEL_NAME,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 500,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Response received from Mistral AI.");

        if (mistralResponse.data && mistralResponse.data.choices && mistralResponse.data.choices.length > 0) {
            return res.status(200).json({ content: mistralResponse.data.choices[0].message.content });
        } else {
            console.error("Unexpected response from AI:", mistralResponse.data);
            return res.status(500).json({ error: "Unexpected response from AI" });
        }

    } catch (error) {
        console.error("AI Request Error:", error.message);
        if (error.response) {
            console.error("Mistral AI response error - Status:", error.response.status);
            console.error("Mistral AI response error - Data:", error.response.data);
        }
        return res.status(500).json({ error: "AI Request Failed" });
    }
};