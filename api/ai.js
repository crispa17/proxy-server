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

        // --- Modifiche cruciali per il formato dell'input per Zephyr ---

        const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/" + "HuggingFaceH4/zephyr-7b-beta";
        const MODEL_NAME = "HuggingFaceH4/zephyr-7b-beta";

        // ✅ Costruisci il prompt nel formato specifico per Zephyr Chat Models
        // Questo è il formato conversazionale che Zephyr si aspetta come singola stringa di input.
        const formattedPrompt = `<|user|>\n${prompt}<|endoftext|>\n<|assistant|>`;

        console.log(`Invio richiesta a Hugging Face Inference API (Standard) per il modello: ${MODEL_NAME}...`);
        console.log(`Prompt inviato (formattato): ${formattedPrompt}`); // Logga il prompt formattato

        const hfResponse = await axios.post(
            HUGGINGFACE_API_URL,
            {
                // ✅ L'API Inference standard si aspetta una singola stringa (o un array di stringhe) per 'inputs'
                inputs: formattedPrompt,
                // Aggiungiamo alcuni parametri comuni per la generazione di testo
                parameters: {
                    max_new_tokens: 250, // Limita la lunghezza della risposta
                    temperature: 0.7,    // Controlla la creatività (0.0 è più deterministico)
                    // Non includere return_full_text: false qui, altrimenti il modello potrebbe non restituire nulla
                },
                // options: {
                //     use_cache: false // Utile per test, disabilita la cache di Hugging Face
                // }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Risposta ricevuta da Hugging Face (Standard API).");

        // ✅ Estrai la risposta, ora dovrebbe essere più semplice
        // Il risultato è un array, il cui primo elemento contiene il testo generato.
        if (hfResponse.data && hfResponse.data.length > 0 && hfResponse.data[0].generated_text) {
            // Zephyr restituisce l'intera conversazione, estraiamo solo l'ultima parte dell'assistente
            const fullResponse = hfResponse.data[0].generated_text;
            const assistantMessageMatch = fullResponse.match(/<\|assistant\|>\s*(.*?)(?:<\|endoftext\|>|$)/s); // Modifica la regex per essere più robusta
            
            if (assistantMessageMatch && assistantMessageMatch[1]) {
                return res.status(200).json({ content: assistantMessageMatch[1].trim() });
            } else {
                // Se la regex non trova il match, restituisci comunque l'intero testo generato
                console.warn("Formato risposta Zephyr inatteso, restituisco il testo completo.");
                return res.status(200).json({ content: fullResponse.trim() });
            }
        } else {
            console.error("Risposta inaspettata dall'AI:", hfResponse.data);
            return res.status(500).json({ error: "Unexpected response from AI" });
        }

    } catch (error) {
        console.error("AI Request Error:", error.message);
        if (error.response) {
            console.error("Errore risposta HF (Standard API) - Status:", error.response.status);
            console.error("Errore risposta HF (Standard API) - Data:", error.response.data);
        }
        return res.status(500).json({ error: "AI Request Failed" });
    }
};