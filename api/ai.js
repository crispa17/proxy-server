const axios = require("axios");

module.exports = async (req, res) => {
    // Logga il metodo della richiesta in arrivo per debugging.
    console.log("Richiesta ricevuta. Metodo:", req.method);

    // ---
    // ✅ Impostazione degli Header CORS (Cross-Origin Resource Sharing)
    // Questi header devono essere impostati all'inizio per garantire che siano presenti
    // su *ogni* risposta, incluse quelle per le richieste OPTIONS (preflight).
    // ---
    res.setHeader("Access-Control-Allow-Origin", "*"); // Permette richieste da qualsiasi origine.
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS"); // Specifica i metodi HTTP consentiti.
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Specifica gli header consentiti nelle richieste.

    // ---
    // ✅ Gestione delle Richieste Preflight CORS (Metodo OPTIONS)
    // I browser inviano una richiesta OPTIONS prima delle richieste "complesse" (come POST)
    // per verificare se il server permette la richiesta effettiva.
    // Dobbiamo rispondere con uno status 200 OK e gli header CORS appropriati.
    // ---
    if (req.method === "OPTIONS") {
        console.log("Gestione richiesta OPTIONS (preflight).");
        return res.status(200).end(); // Termina la richiesta OPTIONS con successo.
    }

    // ---
    // ❌ Restrizione del Metodo HTTP: Accettiamo solo richieste POST per la logica principale.
    // ---
    if (req.method !== "POST") {
        console.warn(`Metodo non consentito: ${req.method}`);
        return res.status(405).json({ error: "Method not allowed" });
    }

    // ---
    // ✅ Logica Principale: Gestione della Richiesta POST per l'API di Hugging Face.
    // ---
    try {
        const { prompt } = req.body; // Estrae il 'prompt' dal corpo della richiesta.

        // Validazione del prompt: deve essere presente e di tipo stringa.
        if (!prompt || typeof prompt !== "string") {
            console.error("Errore: Prompt mancante o non valido.");
            return res.status(400).json({ error: "Missing or invalid prompt" });
        }

        console.log("Invio richiesta a Hugging Face Inference API...");
        // Effettua la richiesta POST all'API di Hugging Face.
        const hfResponse = await axios.post(
            "https://api-inference.huggingface.co/models/google/flan-t5-small",
            { inputs: prompt }, // Invia il prompt come input.
            {
                headers: {
                    // Utilizza la chiave API di Hugging Face dalle variabili d'ambiente.
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                },
            }
        );

        console.log("Risposta ricevuta da Hugging Face.");
        // Restituisce la risposta dell'API di Hugging Face al client Angular.
        return res.status(200).json(hfResponse.data);
    } catch (error) {
        // Gestione degli errori durante la richiesta all'API di Hugging Face.
        console.error("Errore nella richiesta all'AI:", error.message);
        // Restituisce un errore 500 al client in caso di fallimento.
        return res.status(500).json({ error: "AI Request Failed" });
    }
};