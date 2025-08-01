// Funksjon for å formatere AI-responser med tilbudskort
function formatAIResponse(response) {
  // Sjekk om responsen inneholder tilbuds-struktur
  if (response.includes('🔨') && response.includes('💰 Estimat:')) {
    return formatProviderResponse(response);
  }
  
  // Standard formatering for andre meldinger
  return response.replace(/\n/g, '<br>');
}

// Spesiell formatering for leverandør-tilbud
function formatProviderResponse(response) {
  const lines = response.split('\n');
  let formattedHtml = '';
  let inProviderSection = false;
  let currentProvider = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Sjekk om vi starter en tilbuds-seksjon
    if (line.includes('🔨') && line.includes(':')) {
      formattedHtml += `<div class="provider-section">`;
      formattedHtml += `<h3>${line}</h3>`;
      inProviderSection = true;
      continue;
    }
    
    // Sjekk om dette er et leverandør-navn (linje som ikke starter med emoji)
    if (inProviderSection && line && !line.match(/^[💰📋🔧*]/)) {
      if (currentProvider) {
        formattedHtml += `</div>`; // Lukk forrige kort
      }
      formattedHtml += `<div class="provider-card">`;
      formattedHtml += `<div class="provider-header">${line}</div>`;
      currentProvider = line;
      continue;
    }
    
    // Formatér pris-linje
    if (line.includes('💰 Estimat:')) {
      formattedHtml += `<div class="provider-price">${line}</div>`;
      continue;
    }
    
    // Formatér inkluderer-linje
    if (line.includes('📋 Inkluderer:')) {
      formattedHtml += `<div class="provider-details">${line}</div>`;
      continue;
    }
    
    // Formatér spesialitet-linje
    if (line.includes('🔧 Spesialitet:')) {
      formattedHtml += `<div class="provider-specialty">${line}</div>`;
      continue;
    }
    
    // Prisinfo disclaimer
    if (line.includes('Prisene er estimater') || line.includes('*Prisene er estimater*')) {
      if (currentProvider) {
        formattedHtml += `</div>`; // Lukk siste kort
        currentProvider = '';
      }
      formattedHtml += `<div class="price-disclaimer">${line.replace(/^\*|\*$/g, '')}</div>`;
      continue;
    }
    
    // Ønsker du tilbud fra-seksjon
    if (line.includes('Ønsker du tilbud fra:')) {
      formattedHtml += `<div class="options-section">`;
      formattedHtml += `<p><strong>${line}</strong></p>`;
      formattedHtml += `<div class="options-buttons">`;
      
      // Se etter alternativ-linjer
      let j = i + 1;
      while (j < lines.length && lines[j].match(/^[1-3]️⃣/)) {
        const optionText = lines[j].trim();
        const cleanText = optionText.replace(/^[1-3]️⃣\s*/, ''); // Fjern emoji-nummer for onclick
        formattedHtml += `<button type="button" class="option-button" onclick="selectOption('${cleanText}')">${optionText}</button>`;
        j++;
      }
      
      formattedHtml += `</div></div>`;
      i = j - 1; // Hopp over de linjer vi allerede har behandlet
      continue;
    }
    
    // Standard linje
    if (line) {
      formattedHtml += `<p>${line}</p>`;
    }
  }
  
  // Lukk eventuelle åpne tags
  if (currentProvider) {
    formattedHtml += `</div>`;
  }
  if (inProviderSection) {
    formattedHtml += `</div>`;
  }
  
  return formattedHtml;
}

// Håndter klikk på alternativ-knapper
window.selectOption = function(optionText) {
  const input = document.getElementById('user-input');
  input.value = optionText;
  sendMessage();
};

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
    
    // Bruk den nye formatering-funksjonen
    const formattedReply = formatAIResponse(reply);
    appendMessage('Househacker', formattedReply, true); // true = HTML-innhold
    
  } catch (error) {
    appendMessage('Househacker', 'Noe gikk galt. Prøv igjen senere.');
    console.error(error);
  }

  showLoading(false);
}

function appendMessage(sender, text, isHtml = false) {
  console.log('appendMessage kalles med:', sender, text);
  const chatLog = document.getElementById('chat-log');
  if (!chatLog) {
    console.error('chat-log ikke funnet i DOM');
    return;
  }
  const messageEl = document.createElement('div');
  
  if (isHtml) {
    messageEl.innerHTML = `<strong>${sender}:</strong> ${text}`;
  } else {
    messageEl.innerHTML = `<strong>${sender}:</strong> ${text.replace(/\n/g, '<br>')}`;
  }
  
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