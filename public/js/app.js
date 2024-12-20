// Constants
const PROFESSION_DOMAINS = {
    "Teacher": ["Mathematics", "Science", "English", "History", "Computer Science"],
    "Doctor": ["General Medicine", "Pediatrics", "Cardiology", "Neurology", "Surgery"],
    "Engineer": ["Software", "Civil", "Mechanical", "Electrical", "Chemical"],
    "Student": ["High School", "Undergraduate", "Graduate", "PhD"],
    "Other": ["Other"]
};

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const professionSelect = document.getElementById('professionSelect');
const domainSelect = document.getElementById('domainSelect');
const submitProfile = document.getElementById('submitProfile');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messageContainer = document.getElementById('messageContainer');
const aboutInput = document.getElementById('aboutInput');

// Create custom input containers
const customProfessionContainer = document.createElement('div');
customProfessionContainer.className = 'form-group custom-profession-input';
customProfessionContainer.style.display = 'none';
customProfessionContainer.innerHTML = `
    <label>Enter Your Profession:</label>
    <input type="text" id="customProfession" placeholder="Enter your profession">
`;

const customDomainContainer = document.createElement('div');
customDomainContainer.className = 'form-group custom-domain-input';
customDomainContainer.style.display = 'none';
customDomainContainer.innerHTML = `
    <label>Enter Your Domain:</label>
    <input type="text" id="customDomain" placeholder="Enter your domain">
`;

// Insert custom input fields after the respective select elements
domainSelect.parentNode.after(customDomainContainer);
professionSelect.parentNode.after(customProfessionContainer);

// Create typing indicator element
const typingIndicator = document.createElement('div');
typingIndicator.className = 'message assistant';
typingIndicator.innerHTML = `
    <div class="avatar">
        <img src="/images/AI-Buddy.png" alt="AI-Buddy">
    </div>
    <div class="typing-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    </div>
`;

// Toggle Sidebar
function closeSidebar() {
    sidebar.classList.remove('open');
}

function openSidebar() {
    sidebar.classList.add('open');
}

menuBtn.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

// Click outside sidebar to close
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains('open')) {
        closeSidebar();
    }
});

// Update domains when profession changes
professionSelect.addEventListener('change', () => {
    const profession = professionSelect.value;
    const domains = PROFESSION_DOMAINS[profession] || [];
    
    // Show/hide custom profession input
    customProfessionContainer.style.display = profession === 'Other' ? 'block' : 'none';
    
    // Reset and update domain select
    domainSelect.innerHTML = '<option value="">Select Domain</option>';
    domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain;
        option.textContent = domain;
        domainSelect.appendChild(option);
    });
    
    // Show/hide custom domain input based on domain selection
    if (profession === 'Other') {
        domainSelect.style.display = 'none';
        customDomainContainer.style.display = 'block';
    } else {
        domainSelect.style.display = 'block';
        customDomainContainer.style.display = 'none';
    }
});

// Format text with proper line breaks and bullets
function formatText(text) {
    const paragraphs = text.split(/\*|\n/).map(p => p.trim()).filter(p => p.length > 0);
    return paragraphs.map(paragraph => {
        if (paragraph.includes(":") || /^\d+\./.test(paragraph)) {
            return • ${paragraph};
        }
        return paragraph;
    }).join('\n\n');
}

// Add message to chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = message ${isUser ? 'user' : 'assistant'};
    
    if (!isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        const avatarImg = document.createElement('img');
        avatarImg.src = '/images/AI-Buddy.png';
        avatarImg.alt = 'AI-Buddy';
        avatar.appendChild(avatarImg);
        messageDiv.appendChild(avatar);
    }
    
    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    textDiv.style.whiteSpace = 'pre-wrap';
    textDiv.style.wordBreak = 'break-word';
    textDiv.textContent = isUser ? text : formatText(text);
    
    messageDiv.appendChild(textDiv);
    messageContainer.appendChild(messageDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Handle sending messages
async function sendMessage(message, isProfile = false) {
    if (!message.trim()) return;
    
    addMessage(message, true);
    messageContainer.appendChild(typingIndicator);
    typingIndicator.querySelector('.typing-indicator').classList.add('visible');
    messageContainer.scrollTop = messageContainer.scrollHeight;
    
    try {
        const response = await fetch(isProfile ? '/api/profile' : '/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(isProfile ? {
                profession: professionSelect.value === 'Other' ? 
                    document.getElementById('customProfession').value : 
                    professionSelect.value,
                domain: professionSelect.value === 'Other' ? 
                    document.getElementById('customDomain').value : 
                    domainSelect.value,
                description: aboutInput.value
            } : { message })
        });
        
        if (messageContainer.contains(typingIndicator)) {
            messageContainer.removeChild(typingIndicator);
        }
        
        if (!response.ok) {
            throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        addMessage(data.message);
    } catch (error) {
        console.error('Error:', error);
        if (messageContainer.contains(typingIndicator)) {
            messageContainer.removeChild(typingIndicator);
        }
        addMessage('Sorry, I encountered an error. Please try again.');
    }
}

// Event Listeners for chat
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        sendMessage(message);
        messageInput.value = '';
        sendBtn.disabled = true;
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim()) {
        sendMessage(messageInput.value);
        messageInput.value = '';
        sendBtn.disabled = true;
    }
});

// Update your submitProfile event listener
submitProfile.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const isOtherSelected = professionSelect.value === 'Other';
    const profession = isOtherSelected ? 
        document.getElementById('customProfession').value : 
        professionSelect.value;
    const domain = isOtherSelected ? 
        document.getElementById('customDomain').value : 
        domainSelect.value;
    const about = aboutInput.value;

    if (!profession || !domain) {
        alert('Please fill in all required fields');
        return;
    }

    const profileMessage = I am a ${profession} specializing in ${domain}. ${about};
    
    try {
        // Close sidebar first for smooth transition
        closeSidebar();
        
        // Add user message
        addMessage(profileMessage, true);
        
        // Show typing indicator
        messageContainer.appendChild(typingIndicator);
        typingIndicator.querySelector('.typing-indicator').classList.add('visible');
        messageContainer.scrollTop = messageContainer.scrollHeight;
        
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profession,
                domain,
                description: about
            })
        });
        
        if (messageContainer.contains(typingIndicator)) {
            messageContainer.removeChild(typingIndicator);
        }
        
        if (!response.ok) {
            throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        
        // Add AI response
        addMessage(data.message);
        
        // Focus the chat input after response
        messageInput.focus();
        
        // Reset form
        professionSelect.value = '';
        domainSelect.innerHTML = '<option value="">Select Domain</option>';
        aboutInput.value = '';
        if (document.getElementById('customProfession')) {
            document.getElementById('customProfession').value = '';
        }
        if (document.getElementById('customDomain')) {
            document.getElementById('customDomain').value = '';
        }
        
    } catch (error) {
        console.error('Error:', error);
        if (messageContainer.contains(typingIndicator)) {
            messageContainer.removeChild(typingIndicator);
        }
        addMessage('Sorry, I encountered an error submitting your profile.');
    }
});

// Disable send button when input is empty
messageInput.addEventListener('input', () => {
    sendBtn.disabled = !messageInput.value.trim();
});

// Initialize send button state
sendBtn.disabled = true;
