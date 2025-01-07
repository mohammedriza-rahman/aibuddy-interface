const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 3000;

// Dify API configuration
const API_KEY = "app-D2IMY0lIHOB3crQGFLfYIpLW";
const API_BASE_URL = "https://api.dify.ai/v1";

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
        const { message, userId } = req.body;

        // Add user message to history
        conversationHistory.push({ role: "user", content: message });

        // Prepare the request payload for Dify
        const payload = {
            query: message,
            response_mode: "streaming", // or "blocking" based on your preference
            conversation_id: "", // Optionally manage this on your side
            user: userId || "default_user",
            inputs: {} // Additional inputs if needed
        };

        // Make request to Dify API
        const response = await fetch(`${API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.answer;

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
        const { profession, domain, description, userId } = req.body;

        const systemPrompt = `You are an AI assistant specializing in providing immediate, actionable advice for ${profession}s. 
        The user is a ${profession} specializing in ${domain}. Based on their profile, provide:
        1. Ways AI and AI-Buddy can enhance their efficiency and effectiveness
        2. Real-world examples of AI implementation in ${domain}
        3. How AI-Buddy can help them in their ${profession} and ${domain}
        
        Important guidelines:
        - DO NOT ask any questions
        - Provide comprehensive, direct information
        - Give specific examples and use cases
        - Suggest a course from AI-Buddy
        - Keep the response well-structured with clear sections
        - Make sure the answer is short.`;

        const profileMessage = `I am a ${profession} specializing in ${domain}. ${description}`;

        // Prepare the request payload for Dify
        const payload = {
            query: profileMessage,
            response_mode: "blocking",
            conversation_id: "",
            user: userId || "default_user",
            inputs: {}
        };

        // Make request to Dify API
        const response = await fetch(`${API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.answer;

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
