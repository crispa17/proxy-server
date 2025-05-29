const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = ['http://localhost:4200', 'https://tuo-dominio.vercel.app'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.options('/api/ai', cors());


app.post('/api/ai', async (req, res) => {
    const prompt = req.body.prompt;

    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/google/flan-t5-small',
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('AI Request Error:', error.message);
        res.status(500).json({ error: 'AI Request Error' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});