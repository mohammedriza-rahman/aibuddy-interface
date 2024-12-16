const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 3000;


// Tasking.ai API configuration
const API_KEY = "taPxd2jFPxNTTEXZsGAXbRxSgylLsEKi";
const API_BASE_URL = "https://oapi.tasking.ai/v1";
const MODEL_ID = "X5lMtrEVvhZuirQGg3aflNOW";

// Store conversation history
let conversationHistory = [
    { role: "assistant", content: "Hello! How can I assist you today?" }
];

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Add user message to history
        conversationHistory.push({ role: "user", content: message });

        // Make request to Tasking.ai API
        const response = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;
        
        // Add assistant response to history
        conversationHistory.push({ role: "assistant", content: assistantMessage });

        res.json({ message: assistantMessage });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Profile endpoint
app.post('/api/profile', async (req, res) => {
    try {
        const { profession, domain, description } = req.body;

        // Create specific system prompts based on profession
        let systemPrompt = `You are an AI assistant specializing in providing immediate, actionable advice for ${profession}s. 
        The user is a ${profession} specializing in ${domain}. Based on their profile, provide:
        1. Ways AI  and AI-buddy can enhance their efficiency and effectiveness
        2. Real-world examples of AI implementation in ${domain} in short concise answer
        3. tell them how AI-Buddy can help them in there ${profession} and ${domain}

        Important guidelines:
        - DO NOT ask any questions
        - Provide comprehensive, direct information
        - Give specific examples and use cases
        - suggest them a course from the AI-buddy
        - Keep the response well-structured with clear sections
        -make sure the answer is short.

        Format the response with clear bullet points and sections for readability.`;

        // Add user profile to conversation
        const profileMessage = `I am a ${profession} specializing in ${domain}. ${description} tell me how AI and AI buddy can help me `;

        // Make request to Tasking.ai API
        const response = await fetch(`${API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: profileMessage }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;
        
        // Reset conversation history with the new context
        conversationHistory = [
            { role: "system", content: systemPrompt },
            { role: "user", content: profileMessage },
            { role: "assistant", content: assistantMessage }
        ];

        res.json({ message: assistantMessage });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});