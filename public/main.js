async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;
  
    appendMessage('Du', message);
    input.value = '';
    showLoading(true);
  
    try {
      const response = await fetch('https://househacker.app.n8n.cloud/webhook/a889d2ae-2159-402f-b326-5f61e90f602e/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
  
      const text = await response.text();
      console.log('RAW response:', text);
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('Kunne ikke parse JSON:', err);
        data = {};
      }
  
      const reply = data.output || data.reply || JSON.stringify(data) || 'Ingen respons.';
      appendMessage('Househacker', reply);
    } catch (error) {
      appendMessage('Househacker', 'Noe gikk galt. Prøv igjen senere.');
      console.error(error);
    }
  
    showLoading(false);
  }
  
  function appendMessage(sender, text) {
    console.log('appendMessage kalles med:', sender, text);
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) {
      console.error('chat-log ikke funnet i DOM');
      return;
    }
    const messageEl = document.createElement('div');
    messageEl.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatLog.appendChild(messageEl);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  
  function showLoading(show) {
    const indicator = document.getElementById('loading-indicator');
    indicator.style.display = show ? 'block' : 'none';
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('chat-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        sendMessage();
      });
    } else {
      console.error('chat-form ikke funnet i DOM');
    }
  });
  