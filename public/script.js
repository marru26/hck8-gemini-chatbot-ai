document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('user-input'); // Changed from userInput to chatInput for consistency
    const sendButton = document.getElementById('send-button');
    const suggestionsContainer = document.getElementById('suggestions-container');

    let conversationHistory = [];
    let abortController = null; // Untuk mengelola pembatalan permintaan

    const appendMessage = (sender, message) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        // Basic Markdown rendering for bold, italic, and new lines
        contentElement.innerHTML = marked.parse(message);
        messageElement.appendChild(contentElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
        if (sender === 'user') {
            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.textContent = 'Edit';
            editButton.onclick = () => editMessage(messageElement, message);
            messageElement.appendChild(editButton);
        }
    };

    const simulateTyping = (sender, message) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        messageElement.appendChild(contentElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        const baseDelay = 15; // Default delay
        const minDelay = 1;   // Minimum delay for very long messages

        // Adjust delay based on message length: longer messages have smaller delays
        const delay = Math.max(minDelay, baseDelay - Math.floor(message.length / 100));

        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < message.length) {
                const char = message.charAt(i);
                contentElement.innerHTML += char;
                chatBox.scrollTop = chatBox.scrollHeight;
                i++;

                if (i >= 500 && i < message.length) {
                    // If 500 characters reached, display the rest of the message immediately
                    let remainingMessage = message.substring(i);
                    contentElement.innerHTML = marked.parse(message);
                    chatBox.scrollTop = chatBox.scrollHeight;
                    clearInterval(typingInterval);
                }
            } else {
                clearInterval(typingInterval);
            }
        }, delay);
    };

    const showLoading = () => {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'bot', 'loading');
        loadingElement.innerHTML = '<div class="message-content"><div class="dot-flashing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>';
        chatBox.appendChild(loadingElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const removeLoading = () => {
        const loadingElement = document.querySelector('.message.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    };

    const sendMessage = async (messageText = chatInput.value.trim()) => {
        if (messageText === '') return;

        appendMessage('user', messageText);
        chatInput.value = '';
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none'; // Hide suggestions after first message
        }

        // Add user message to history
        conversationHistory.push({ role: 'user', parts: [{ text: messageText }] });

        showLoading(); // Show loading animation before sending request
        sendButton.textContent = 'Stop'; // Change button text to Stop
        console.log('Button text changed to Stop');
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: conversationHistory, message: messageText }),
                signal: signal, // Pass the signal to the fetch request
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            removeLoading();
            simulateTyping('bot', data.reply);

            // Add bot message to history
            conversationHistory.push({ role: 'model', parts: [{ text: data.reply }] });

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
                appendMessage('bot', 'Permintaan dibatalkan.');
            } else {
                console.error('Error:', error);
                appendMessage('bot', 'Maaf, terjadi kesalahan. Silakan coba lagi.');
            }
        } finally {
            removeLoading();
            sendButton.textContent = 'Send'; // Reset button text to Send
            console.log('Button text changed to Send');
            abortController = null;
        }
    };

    const editMessage = (messageElement, originalMessage) => {
        chatInput.value = originalMessage;
        // Remove the message from display
        messageElement.remove();
        // Remove the message from conversation history
        conversationHistory = conversationHistory.filter(msg => msg.parts[0].text !== originalMessage);
    };

    sendButton.addEventListener('click', () => {
        if (abortController) {
            abortController.abort(); // Abort the ongoing request
        } else {
            sendMessage();
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initial suggestions
    const initialSuggestions = [
        "Apa itu AI?",
        "Bagaimana cuaca hari ini?",
        "Ceritakan lelucon",
        "Apa saja yang bisa dilakukan AI?",
        "Bagaimana cara kerja AI?",
    ];

    if (suggestionsContainer) {
        initialSuggestions.forEach(suggestion => {
            const suggestionButton = document.createElement('button');
            suggestionButton.classList.add('suggestion-button');
            suggestionButton.textContent = suggestion;
            suggestionButton.addEventListener('click', () => {
                sendMessage(suggestion);
            });
            suggestionsContainer.appendChild(suggestionButton);
        });
    }
});