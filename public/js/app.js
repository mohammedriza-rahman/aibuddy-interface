// Constants
const PROFESSION_DOMAINS = {
    "Teacher": ["Mathematics", "Science", "English", "History", "Computer Science", "Other"],
    "Doctor": ["General Medicine", "Pediatrics", "Cardiology", "Neurology", "Surgery", "Other"],
    "Engineer": ["Software", "Civil", "Mechanical", "Electrical", "Chemical", "Other"],
    "Student": ["High School", "Undergraduate", "Graduate", "PhD", "Other"],
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

// Debug log
console.log('DOM Elements loaded:', {
    sidebar, menuBtn, professionSelect, domainSelect,
    submitProfile, messageInput, sendBtn, messageContainer, aboutInput
});

// Add at the top with other variables
let isStreaming = false;

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

// Insert custom input fields
domainSelect.parentNode.after(customDomainContainer);
professionSelect.parentNode.after(customProfessionContainer);

// Create typing indicator
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

// Text streaming function
function streamText(text, textDiv) {
    return new Promise((resolve) => {
        const delay = 20; // milliseconds per character
        let index = 0;
        textDiv.textContent = '';
        textDiv.classList.add('streaming');
        
        function addNextCharacter() {
            if (index < text.length) {
                textDiv.textContent += text[index];
                index++;
                messageContainer.scrollTop = messageContainer.scrollHeight;
                setTimeout(addNextCharacter, delay);
            } else {
                textDiv.classList.remove('streaming');
                resolve();
            }
        }
        
        addNextCharacter();
    });
}

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

// Domain selection change handler
domainSelect.addEventListener('change', () => {
    const selectedDomain = domainSelect.value;
    customDomainContainer.style.display = selectedDomain === 'Other' ? 'block' : 'none';
});

// Profession selection change handler
professionSelect.addEventListener('change', () => {
    const profession = professionSelect.value;
    const domains = PROFESSION_DOMAINS[profession] || [];
    
    customProfessionContainer.style.display = profession === 'Other' ? 'block' : 'none';
    
    domainSelect.innerHTML = '<option value="">Select Domain</option>';
    domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain;
        option.textContent = domain;
        domainSelect.appendChild(option);
    });
    
    if (profession === 'Other') {
        domainSelect.style.display = 'none';
        customProfessionContainer.style.display = 'block';
        customDomainContainer.style.display = 'block';
    } else {
        domainSelect.style.display = 'block';
        customProfessionContainer.style.display = 'none';
        customDomainContainer.style.display = 'none';
    }
});

// Format text with proper spacing
function formatText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let formattedText = '';

    lines.forEach(line => {
        // Handle numbered sections
        if (/^\d+\./.test(line)) {
            formattedText += `• ${line.replace(/^\d+\.\s*/, '')}\n`;
        }
        // Handle bullet points or subheadings
        else if (line.startsWith('*') || line.includes(':')) {
            const cleanLine = line.replace(/^\*+\s*/, '').replace(/\*\*/g, '').trim();
            formattedText += `• ${cleanLine}\n`;
        }
        // Handle regular text
        else {
            formattedText += `${line.replace(/\*\*/g, '')}\n`;
        }
    });

    return formattedText.trim();
}

// Add message to chat
async function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
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
    
    messageDiv.appendChild(textDiv);
    messageContainer.appendChild(messageDiv);

    if (isUser) {
        textDiv.textContent = text;
    } else {
        const formattedText = formatText(text);
        await streamText(formattedText, textDiv);
    }
    
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Handle sending messages
async function sendMessage(message, isProfile = false) {
    if (isStreaming) return;
    if (!message.trim()) return;

    isStreaming = true;
    messageInput.disabled = true; // Disable input while streaming
    sendBtn.disabled = true;
    
    // messageInput.value = '';
    // sendBtn.disabled = true;
    
    await addMessage(message, true);
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
                domain: (() => {
                    if (professionSelect.value === 'Other') {
                        return document.getElementById('customDomain').value;
                    }
                    return domainSelect.value === 'Other' ? 
                        document.getElementById('customDomain').value : 
                        domainSelect.value;
                })(),
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
        await addMessage(data.message);
    } catch (error) {
        console.error('Error:', error);
        if (messageContainer.contains(typingIndicator)) {
            messageContainer.removeChild(typingIndicator);
        }
        await addMessage('Sorry, I encountered an error. Please try again.');
    }finally {
        isStreaming = false;
        messageInput.disabled = false; // Re-enable input
        messageInput.focus();
        sendBtn.disabled = !messageInput.value.trim();
    }
}

// Event Listeners for chat
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        sendMessage(message);
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim()) {
        sendMessage(messageInput.value);
    }
});

// Handle profile submission
submitProfile.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const isOtherSelected = professionSelect.value === 'Other';
    const profession = isOtherSelected ? 
        document.getElementById('customProfession').value : 
        professionSelect.value;
    const domain = isOtherSelected ? 
        document.getElementById('customDomain').value :
        (domainSelect.value === 'Other' ? 
            document.getElementById('customDomain').value : 
            domainSelect.value);
    const about = aboutInput.value;

    if (!profession || !domain) {
        alert('Please fill in all required fields');
        return;
    }

    const profileMessage = `I am a ${profession} specializing in ${domain}. ${about}`;
    
    try {
        closeSidebar();
        await addMessage(profileMessage, true);
        
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
        await addMessage(data.message);
        messageInput.focus();
        
        // Reset form
        professionSelect.value = '';
        domainSelect.innerHTML = '<option value="">Select Domain</option>';
        aboutInput.value = '';
        customProfessionContainer.style.display = 'none';
        customDomainContainer.style.display = 'none';
        
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
        await addMessage('Sorry, I encountered an error submitting your profile.');
    }
});

// Disable send button when input is empty
messageInput.addEventListener('input', () => {
    sendBtn.disabled = !messageInput.value.trim();
});

// Initialize send button state
sendBtn.disabled = true;
