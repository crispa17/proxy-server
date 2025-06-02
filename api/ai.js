const axios = require("axios");

module.exports = async (req, res) => {
    console.log("Richiesta ricevuta. Metodo:", req.method);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        console.log("Gestione richiesta OPTIONS (preflight) all'interno della funzione.");
        return res.status(200).end();
    }

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

        // --- NUOVE MODIFICHE PER MISTRAL AI ---

        // ✅ URL per l'API di Chat Completions di Mistral AI
        const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
        // ✅ Modello da usare: 'mistral-tiny' è il più piccolo e veloce
        // Potresti anche provare 'mistral-small' o 'mistral-medium'
        const MODEL_NAME = "mistral-tiny";

        console.log(`Invio richiesta a Mistral AI per il modello: ${MODEL_NAME}...`);
        console.log(`Prompt inviato: ${prompt}`);

        const mistralResponse = await axios.post(
            MISTRAL_API_URL,
            {
                // ✅ Formato del payload standard per le Chat Completions (come OpenAI)
                model: MODEL_NAME,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                // Puoi aggiungere altri parametri qui, es:
                // temperature: 0.7,
                // max_tokens: 250,
            },
            {
                headers: {
                    // La chiave API di Mistral AI
                    Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`, // <-- NOME DELLA VARIABILE AMBIENTE CAMBIATO
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Risposta ricevuta da Mistral AI.");

        // ✅ Estrai la risposta nel formato delle chat completions
        if (mistralResponse.data && mistralResponse.data.choices && mistralResponse.data.choices.length > 0) {
            return res.status(200).json({ content: mistralResponse.data.choices[0].message.content });
        } else {
            console.error("Risposta inaspettata da Mistral AI:", mistralResponse.data);
            return res.status(500).json({ error: "Unexpected response from AI" });
        }

    } catch (error) {
        console.error("AI Request Error:", error.message);
        if (error.response) {
            console.error("Errore risposta Mistral AI - Status:", error.response.status);
            console.error("Errore risposta Mistral AI - Data:", error.response.data);
        }
        return res.status(500).json({ error: "AI Request Failed" });
    }
};