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
let conversationId = ""; // Initialize empty conversationId

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        const userId = "user-123"; // Use a consistent user ID for tracking

        // Make request to Dify API
        const response = await fetch(`${API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                inputs: {},
                query: message,
                response_mode: "blocking", // or "streaming" if you want to implement streaming
                conversation_id: conversationId || "", // Use existing or start a new conversation
                user: userId
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Store the conversation ID for future messages
        conversationId = data.conversation_id;

        res.json({ 
            message: data.answer,
            metadata: data.metadata
        });
    } catch (error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Profile endpoint
app.post('/api/profile', async (req, res) => {
    try {
        const { profession, domain, description } = req.body;

        // Create the profile message
        const profileMessage = `I am a ${profession} specializing in ${domain}. ${description} Tell me how AI and AI buddy can help me.`;

        const userId = "user-123"; // Use a consistent user ID

        // Make request to Dify API with custom prompt
        const response = await fetch(`${API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                inputs: {
                    profession: profession,
                    domain: domain,
                    description: description
                },
                query: profileMessage,
                response_mode: "blocking",
                conversation_id: "", // Start a new conversation for profile
                user: userId
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Store the new conversation ID
        conversationId = data.conversation_id;

        res.json({ 
            message: data.answer,
            metadata: data.metadata
        });
    } catch (error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
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
