const axios = require("axios");

module.exports = async (req, res) => {
    // ✅ Header CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // ✅ Gestione preflight CORS
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // ❌ Solo POST è accettato
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({ error: "Missing or invalid prompt" });
        }

        const hfResponse = await axios.post(
            "https://api-inference.huggingface.co/models/google/flan-t5-small",
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                },
            }
        );

        return res.status(200).json(hfResponse.data);
    } catch (error) {
        console.error("AI Request Error:", error.message);
        return res.status(500).json({ error: "AI Request Failed" });
    }
};