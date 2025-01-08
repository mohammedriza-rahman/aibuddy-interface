const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const session = require('express-session');
const app = express();
const PORT = 3000;

// Dify API configuration
const API_KEY = "app-D2IMY0lIHOB3crQGFLfYIpLW";
const API_BASE_URL = "https://api.dify.ai/v1";

// Session configuration
app.use(session({
    secret: 'your-secret-key',  // Change this to a secure secret
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// Generate unique user ID for new sessions
app.use((req, res, next) => {
    if (!req.session.userId) {
        req.session.userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        req.session.conversationId = '';
    }
    next();
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Use session-specific userId and conversationId
        const response = await fetch(`${API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                inputs: {},
                query: message,
                response_mode: "blocking",
                conversation_id: req.session.conversationId || "",
                user: req.session.userId
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Store the conversation ID in the session
        req.session.conversationId = data.conversation_id;
        
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
        const profileMessage = `I am a ${profession} specializing in ${domain}. ${description} Tell me how AI and AI buddy can help me.`;
        
        // Start a new conversation for profile updates
        req.session.conversationId = '';
        
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
                conversation_id: "",
                user: req.session.userId
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Store the new conversation ID in the session
        req.session.conversationId = data.conversation_id;
        
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
