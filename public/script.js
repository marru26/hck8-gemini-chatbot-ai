document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    const appendMessage = (sender, message) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        // Basic Markdown rendering for bold, italic, and new lines
        let formattedMessage = message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/\n/g, '<br>'); // New lines
        contentElement.innerHTML = formattedMessage;
        messageElement.appendChild(contentElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
    };

    sendButton.addEventListener('click', async () => {
        const message = userInput.value.trim();
        if (message) {
            appendMessage('user', message);
            userInput.value = '';

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                });
                const data = await response.json();
                if (data.reply) {
                    appendMessage('bot', data.reply);
                } else if (data.error) {
                    appendMessage('bot', `Error: ${data.error}`);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                appendMessage('bot', 'Failed to get a response from the bot.');
            }
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
});