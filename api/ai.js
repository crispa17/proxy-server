const axios = require("axios");

module.exports = async (req, res) => {
    console.log("Richiesta ricevuta. Metodo:", req.method);

    // ✅ Header CORS (rimangono uguali, ma ora vercel.json li gestisce principalmente per OPTIONS)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // ✅ Gestione preflight CORS (rimane utile per test locali o fallback)
    if (req.method === "OPTIONS") {
        console.log("Gestione richiesta OPTIONS (preflight) all'interno della funzione.");
        return res.status(200).end();
    }

    // ❌ Solo POST è accettato
    if (req.method !== "POST") {
        console.warn(`Metodo non consentito: ${req.method}`);
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt } = req.body; // Ottieni il prompt dal client Angular

        if (!prompt || typeof prompt !== "string") {
            console.error("Errore: Prompt mancante o non valido.");
            return res.status(400).json({ error: "Missing or invalid prompt" });
        }

        // --- INIZIO DELLE MODIFICHE QUI ---

        // ✅ Nuovo URL per l'API di Chat Completion del provider Novita
        const HUGGINGFACE_API_URL = "https://router.huggingface.co/novita/v3/openai/chat/completions";
        const MODEL_NAME = "deepseek-ai/DeepSeek-R1-0528"; // Il modello che vuoi usare

        console.log(`Invio richiesta a Hugging Face Inference API (Novita) per il modello: ${MODEL_NAME}...`);


        const hfResponse = await axios.post(
            HUGGINGFACE_API_URL,
            {
                // ✅ Nuovo formato del payload per Chat Completions (tipo OpenAI)
                model: MODEL_NAME,
                messages: [
                    {
                        role: "user",
                        content: prompt, // Il prompt dal tuo frontend Angular
                    },
                ],
                // Puoi aggiungere altri parametri qui, come temperature, max_tokens, ecc.
                // temperature: 0.7,
                // max_tokens: 150,
            },
            {
                headers: {
                    // La chiave API di Hugging Face è necessaria per autenticarsi con il router
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Content-Type": "application/json", // Specifica il tipo di contenuto
                },
            }
        );

        console.log("Risposta ricevuta da Hugging Face (Novita).");

        // ✅ Estrai la risposta nel formato delle chat completions
        // La risposta sarà simile a { choices: [{ message: { role: "assistant", content: "..." } }] }
        if (hfResponse.data && hfResponse.data.choices && hfResponse.data.choices.length > 0) {
            return res.status(200).json(hfResponse.data.choices[0].message);
        } else {
            console.error("Risposta inaspettata dall'AI:", hfResponse.data);
            return res.status(500).json({ error: "Unexpected response from AI" });
        }

    } catch (error) {
        console.error("AI Request Error:", error.message);
        // Se c'è una risposta HTTP, puoi loggare anche quella per più dettagli
        if (error.response) {
            console.error("Errore risposta HF (Novita) - Status:", error.response.status);
            console.error("Errore risposta HF (Novita) - Data:", error.response.data);
        }
        return res.status(500).json({ error: "AI Request Failed" });
    }
};