const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const responseDiv = document.getElementById('response');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("👤", userMessage);
  input.value = '';
  input.disabled = true;

  try {
    const reply = await fetchOllamaResponse(userMessage);
    appendMessage("🤖", reply);
  } catch (error) {
    appendMessage("⚠️", "Erreur de réponse.");
  } finally {
    input.disabled = false;
    input.focus();
  }
});

function appendMessage(sender, message) {
  const p = document.createElement('p');
  p.innerHTML = `<strong>${sender}</strong> ${message}`;
  responseDiv.appendChild(p);
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

async function fetchOllamaResponse(prompt) {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'phi3', prompt, stream: false })
  });
  const data = await res.json();
  return data.response;
}
