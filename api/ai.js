const axios = require("axios");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // ✅ Gestione della richiesta preflight (OPTIONS)
    if (req.method === "OPTIONS") {
        return res.status(200).end(); // Terminare qui il preflight
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const prompt = req.body.prompt;

        const response = await axios.post(
            "https://api-inference.huggingface.co/models/google/flan-t5-small",
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                },
            }
        );

        return res.status(200).json(response.data);
    } catch (error) {
        console.error("AI Request Error:", error.message);
        return res.status(500).json({ error: "AI Request Failed" });
    }
};
