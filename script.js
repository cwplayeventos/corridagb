/*
  URL do Google Apps Script.
  Depois de publicar o Code.gs como Aplicativo da Web, cole a URL abaixo.
*/
const API_URL = "https://script.google.com/macros/s/AKfycbzbVu7aFmFplBg2zvRfSMEGPsRa9rRNXZLS0EWQYNuFBUbLXcAZlEvNe1zLhT5DijI9wA/exec";

const CONFIG = {
  pixKey: "cwplayeventos@gmail.com",
  pixReceiver: "cwplayeventos",
  kits: [
    { id: "basico", name: "Corrida / Caminhada", price: 19.90, medal: false, shirt: false, description: "Somente participação na corrida ou caminhada." },
    { id: "medalha", name: "Com Medalha", price: 39.90, medal: true, shirt: false, description: "Participação + medalha." },
    { id: "completo", name: "Kit Completo", price: 59.90, medal: true, shirt: true, description: "Participação + medalha + camiseta unissex." }
  ],
  distances: ["2,5 km", "5 km"],
  modes: ["Corrida", "Caminhada"],
  shirts: ["PP", "P", "M", "G", "GG", "XGG"]
};

const state = { participants: [] };

const money = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function renderKits() {
  const box = document.getElementById("kitCards");
  box.innerHTML = CONFIG.kits.map((kit, i) => `
    <article class="kit-card ${i === 2 ? "featured" : ""}">
      <h3>${kit.name}</h3>
      <div class="price">${money(kit.price)}</div>
      <p>${kit.description}</p>
      <ul>
        <li>2,5 km ou 5 km</li>
        <li>Corrida ou caminhada</li>
        ${kit.medal ? "<li>Medalha inclusa</li>" : ""}
        ${kit.shirt ? "<li>Camiseta unissex</li>" : ""}
      </ul>
      <a href="#inscricao" class="btn btn-primary">SELECIONAR</a>
    </article>
  `).join("");
}

function createParticipant(data = {}) {
  return {
    name: data.name || "",
    whatsapp: data.whatsapp || "",
    mode: data.mode || "Corrida",
    distance: data.distance || "2,5 km",
    kitId: data.kitId || "basico",
    shirt: data.shirt || ""
  };
}

function renderParticipants() {
  const container = document.getElementById("participants");
  container.innerHTML = state.participants.map((p, index) => {
    const kit = CONFIG.kits.find(k => k.id === p.kitId) || CONFIG.kits[0];
    return `
      <article class="participant" data-index="${index}">
        <div class="participant-head">
          <h3>Participante ${index + 1}</h3>
          <span>${money(kit.price)}</span>
        </div>
        <div class="fields">
          <label>Nome completo
            <input data-field="name" type="text" value="${escapeHtml(p.name)}" required>
          </label>
          <label>WhatsApp
            <input data-field="whatsapp" type="tel" value="${escapeHtml(p.whatsapp)}" required>
          </label>
          <label>Modalidade
            <div class="radio-group">
              ${CONFIG.modes.map(mode => `
                <label class="radio-option"><input data-field="mode" type="radio" name="mode-${index}" value="${mode}" ${p.mode === mode ? "checked" : ""}> ${mode}</label>
              `).join("")}
            </div>
          </label>
          <label>Distância
            <select data-field="distance" required>
              ${CONFIG.distances.map(d => `<option value="${d}" ${p.distance === d ? "selected" : ""}>${d}</option>`).join("")}
            </select>
          </label>
          <label>Kit / valor
            <select data-field="kitId" required>
              ${CONFIG.kits.map(k => `<option value="${k.id}" ${p.kitId === k.id ? "selected" : ""}>${k.name} — ${money(k.price)}</option>`).join("")}
            </select>
          </label>
          <label class="shirt-field" style="${kit.shirt ? "display:block" : "display:none"}">Tamanho da camiseta
            <select data-field="shirt" ${kit.shirt ? "required" : ""}>
              <option value="">Selecione</option>
              ${CONFIG.shirts.map(s => `<option value="${s}" ${p.shirt === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </label>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll(".participant").forEach(card => {
    card.addEventListener("input", handleParticipantChange);
    card.addEventListener("change", handleParticipantChange);
  });
  updateSummary();
}

function handleParticipantChange(e) {
  const card = e.currentTarget;
  const index = Number(card.dataset.index);
  const field = e.target.dataset.field;
  if (!field) return;
  if (field === "mode") state.participants[index].mode = e.target.value;
  else state.participants[index][field] = e.target.value;

  if (field === "kitId") {
    if (e.target.value !== "completo") state.participants[index].shirt = "";
    renderParticipants();
    return;
  }
  updateSummary();
}

function updateSummary() {
  const total = state.participants.reduce((sum, p) => {
    const kit = CONFIG.kits.find(k => k.id === p.kitId) || CONFIG.kits[0];
    return sum + kit.price;
  }, 0);
  document.getElementById("participantCount").textContent = state.participants.length;
  document.getElementById("summaryCount").textContent = state.participants.length;
  document.getElementById("summaryTotal").textContent = money(total);
  return total;
}

function changeQuantity(delta) {
  const next = Math.max(1, Math.min(20, state.participants.length + delta));
  if (next === state.participants.length) return;
  if (next > state.participants.length) {
    state.participants.push(createParticipant());
  } else {
    state.participants.pop();
  }
  renderParticipants();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function validate() {
  const form = document.getElementById("registrationForm");
  if (!form.reportValidity()) return false;
  if (state.participants.some(p => p.kitId === "completo" && !p.shirt)) {
    alert("Selecione o tamanho da camiseta de todos os participantes do Kit Completo.");
    return false;
  }
  return true;
}

async function submitRegistration(event) {
  event.preventDefault();
  const message = document.getElementById("formMessage");
  const button = document.getElementById("submitBtn");
  if (!validate()) return;
  if (!API_URL || API_URL.includes("COLE_AQUI")) {
    message.textContent = "Configure primeiro a URL do Google Apps Script no arquivo script.js.";
    return;
  }

  const total = updateSummary();
  const responsible = {
    name: document.getElementById("responsibleName").value.trim(),
    whatsapp: document.getElementById("responsibleWhatsapp").value.trim()
  };

  button.disabled = true;
  button.textContent = "ENVIANDO...";
  message.textContent = "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "createRegistration",
        responsible,
        participants: state.participants,
        total
      })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Não foi possível criar a inscrição.");

    document.getElementById("paymentTotal").textContent = money(result.total);
    document.getElementById("registrationId").textContent = result.registrationId;
    document.getElementById("payment").classList.remove("hidden");
    document.getElementById("payment").scrollIntoView({ behavior: "smooth" });
    document.getElementById("registrationForm").reset();
    state.participants = [createParticipant()];
    renderParticipants();
    message.textContent = "";
  } catch (error) {
    console.error(error);
    message.textContent = error.message || "Erro ao enviar. Tente novamente.";
  } finally {
    button.disabled = false;
    button.textContent = "FINALIZAR INSCRIÇÃO";
  }
}

async function markPaid() {
  const registrationId = document.getElementById("registrationId").textContent;
  const message = document.getElementById("paymentMessage");
  const button = document.getElementById("paidBtn");
  if (!registrationId || registrationId === "GDB-000000") return;
  if (!API_URL || API_URL.includes("COLE_AQUI")) return;
  button.disabled = true;
  button.textContent = "REGISTRANDO...";
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "markPayment", registrationId })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Erro.");
    message.textContent = "Pagamento registrado como aguardando confirmação. Obrigado!";
    button.textContent = "PAGAMENTO INFORMADO";
  } catch (error) {
    message.textContent = error.message || "Não foi possível registrar.";
    button.disabled = false;
    button.textContent = "JÁ REALIZEI O PAGAMENTO";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderKits();
  state.participants = [createParticipant()];
  renderParticipants();
  document.getElementById("plusParticipant").addEventListener("click", () => changeQuantity(1));
  document.getElementById("minusParticipant").addEventListener("click", () => changeQuantity(-1));
  document.getElementById("registrationForm").addEventListener("submit", submitRegistration);
  document.getElementById("paidBtn").addEventListener("click", markPaid);
  document.getElementById("copyPix").addEventListener("click", async () => {
    await navigator.clipboard.writeText(CONFIG.pixKey);
    document.getElementById("copyPix").textContent = "COPIADO";
    setTimeout(() => document.getElementById("copyPix").textContent = "COPIAR", 1500);
  });
});
