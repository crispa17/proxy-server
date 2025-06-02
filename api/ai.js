const axios = require("axios");

module.exports = async (req, res) => {
    console.log("Request received. Method:", req.method);

    res.setHeader("Access-Control-Allow-Origin", "*");
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
        const { prompt } = req.body; // This 'prompt' now includes the user's request + current list context from Angular

        if (!prompt || typeof prompt !== "string") {
            console.error("Error: Missing or invalid prompt.");
            return res.status(400).json({ error: "Missing or invalid prompt" });
        }

        const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
        const MODEL_NAME = "mistral-tiny"; // Or "mistral-small" for more capability

        // Inject the detailed AI instructions (system prompt) here!
        const systemPrompt = 
            `You are a shopping list assistant. Your goal is to suggest items to add to a shopping list based on user requests and current list context.
            Your response MUST be a JSON object with a single top-level key "actions".
            The "actions" key's value MUST be an array of objects. Each object represents an "add" action.

            - If type is "add":
            - It MUST have an "item" object.
            - The "item" object MUST have a "name" (string).
            - It MAY have "quantity" (number) and "unit" (string, choose from 'pcs', 'g', 'kg', 'ml', 'l', 'pack', 'can', 'bottle').
            - If quantity/unit are not specified by user, default quantity to 1 and omit unit.

            Do NOT include any other text or explanation outside the JSON.
            Provide a brief summary message in the "message" field of the JSON.

            Example JSON structure:
            {
            "actions": [
                { "type": "add", "item": { "name": "Pasta", "quantity": 500, "unit": "g" } },
                { "type": "add", "item": { "name": "Tomatoes", "quantity": 1, "unit": "kg" } },
                { "type": "add", "item": { "name": "Mozzarella" } }
            ],
            "message": "Here are some items for your requested list!"
            }
            If no items are suggested, return an empty "actions" array.`;

        console.log(`Sending request to Mistral AI for model: ${MODEL_NAME}...`);

        const mistralResponse = await axios.post(
            MISTRAL_API_URL,
            {
                model: MODEL_NAME,
                messages: [
                    { role: "system", content: systemPrompt }, // The system prompt with rules
                    { role: "user", content: prompt },         // The user's specific request and list context
                ],
                response_format: { "type": "json_object" },
                temperature: 0.7,
                max_tokens: 500,
                // ✅ IMPORTANT: If Mistral AI supports 'response_format' for JSON, add it here:
                // response_format: { type: "json_object" }
                // Check Mistral AI documentation for this option. It greatly improves JSON reliability.
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
