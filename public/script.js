document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('user-input'); // Changed from userInput to chatInput for consistency
    const sendButton = document.getElementById('send-button');
    const suggestionsContainer = document.getElementById('suggestions-container');

    let conversationHistory = [];

    const appendMessage = (sender, message) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        // Basic Markdown rendering for bold, italic, and new lines
        let formattedMessage = message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/(?<!\S)\*(?!\s)(.*?)(?<!\s)\*(?!\S)/g, '<em>$1</em>') // Italic (only if not at start of line or preceded by non-whitespace)
            .replace(/^\*\s*(.*)/gm, '<li>$1</li>') // Bullet points
            .replace(/\n/g, '<br>'); // New lines
        contentElement.innerHTML = formattedMessage;
        messageElement.appendChild(contentElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
    };

    const simulateTyping = (sender, message, delay = 20) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        messageElement.appendChild(contentElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < message.length) {
                let partialMessage = message.substring(0, i + 1);
                let formattedPartialMessage = partialMessage
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/(?<!\S)\*(?!\s)(.*?)(?<!\s)\*(?!\S)/g, '<em>$1</em>')
                    .replace(/^\*\s*(.*)/gm, '<li>$1</li>')
                    .replace(/\n/g, '<br>');
                contentElement.innerHTML = formattedPartialMessage;
                chatBox.scrollTop = chatBox.scrollHeight;
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, delay);
    };

    const showLoading = () => {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'bot', 'loading');
        loadingElement.innerHTML = '<div class="message-content"><div class="dot-flashing"></div></div>';
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

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: conversationHistory, message: messageText }),
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
            console.error('Error:', error);
            removeLoading();
            appendMessage('bot', 'Maaf, terjadi kesalahan. Silakan coba lagi.');
        }
    };

    sendButton.addEventListener('click', () => sendMessage());

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initial suggestions
    const initialSuggestions = [
        "Apa itu AI?",
        "Bagaimana cuaca hari ini?",
        "Ceritakan lelucon."
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