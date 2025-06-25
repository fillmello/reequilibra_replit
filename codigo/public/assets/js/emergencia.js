const emergencyBtn = document.getElementById("emergencyBtn");
const emergencyModal = document.getElementById("emergencyModal");
const contactsModal = document.getElementById("contactsModal");
const servicesModal = document.getElementById("servicesModal");
const addContactModal = document.getElementById("addContactModal");
const closeModalBtn = document.getElementById("closeModal");
const contactForm = document.getElementById("contactForm");
const contactsList = document.getElementById("contactsList");
const noContacts = document.getElementById("noContacts");

let editingContactId = null;

emergencyBtn.addEventListener("click", openEmergencyModal);
closeModalBtn.addEventListener("click", closeEmergencyModal);
contactForm.addEventListener("submit", saveContact);

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("show");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllModals();
  }
});

function getContacts() {
  const contacts = localStorage.getItem("emergencyContacts");
  return contacts ? JSON.parse(contacts) : [];
}

function saveContacts(contacts) {
  localStorage.setItem("emergencyContacts", JSON.stringify(contacts));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function openEmergencyModal() {
  emergencyModal.classList.add("show");
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

function closeEmergencyModal() {
  emergencyModal.classList.remove("show");
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.remove("show");
  });
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("show");
}

function callCVV() {
  if (confirm("Ligar para CVV - Centro de Valorização da Vida (188)?")) {
    window.open("tel:188");
    closeAllModals();
  }
}

function callSAMU() {
  if (confirm("Ligar para SAMU - Emergência Médica (192)?")) {
    window.open("tel:192");
    closeAllModals();
  }
}

function callContact(phone, name) {
  if (confirm(`Ligar para ${name}?`)) {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`tel:${cleanPhone}`);
    closeAllModals();
  }
}

function callService(phone) {
  if (confirm(`Ligar para este serviço?`)) {
    window.open(`tel:${phone}`);
    closeAllModals();
  }
}

function showContacts() {
  closeEmergencyModal();
  loadContacts();
  contactsModal.classList.add("show");
}

function showServices() {
  closeEmergencyModal();
  servicesModal.classList.add("show");
}

function showAddContact() {
  editingContactId = null;
  document.getElementById("addContactTitle").innerHTML =
    '<i class="fas fa-user-plus"></i> ADICIONAR CONTATO';
  contactForm.reset();
  closeModal("contactsModal");
  addContactModal.classList.add("show");
}

function editContact(id) {
  const contacts = getContacts();
  const contact = contacts.find((c) => c.id === id);

  if (contact) {
    editingContactId = id;
    document.getElementById("addContactTitle").innerHTML =
      '<i class="fas fa-user-edit"></i> EDITAR CONTATO';
    document.getElementById("contactName").value = contact.name;
    document.getElementById("contactPhone").value = contact.phone;
    document.getElementById("contactRelation").value = contact.relation;

    closeModal("contactsModal");
    addContactModal.classList.add("show");
  }
}

function deleteContact(id) {
  const contacts = getContacts();
  const contact = contacts.find((c) => c.id === id);

  if (
    contact &&
    confirm(`Remover ${contact.name} dos contatos de emergência?`)
  ) {
    const updatedContacts = contacts.filter((c) => c.id !== id);
    saveContacts(updatedContacts);
    loadContacts();
  }
}

function saveContact(e) {
  e.preventDefault();

  const name = document.getElementById("contactName").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const relation = document.getElementById("contactRelation").value;

  if (!name || !phone) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return;
  }

  const contacts = getContacts();

  if (editingContactId) {
    const contactIndex = contacts.findIndex((c) => c.id === editingContactId);
    if (contactIndex !== -1) {
      contacts[contactIndex] = {
        ...contacts[contactIndex],
        name,
        phone,
        relation,
      };
    }
  } else {
    const newContact = {
      id: generateId(),
      name,
      phone,
      relation,
      createdAt: new Date().toISOString(),
    };
    contacts.push(newContact);
  }

  saveContacts(contacts);
  closeModal("addContactModal");
  loadContacts();
  showContacts();
}

function loadContacts() {
  const contacts = getContacts();

  if (contacts.length === 0) {
    contactsList.style.display = "none";
    noContacts.style.display = "block";
    return;
  }

  contactsList.style.display = "flex";
  noContacts.style.display = "none";

  contactsList.innerHTML = contacts
    .map(
      (contact) => `
    <div class="contact-item">
      <div class="contact-info">
        <strong>${contact.name}</strong>
        <span>${contact.phone}</span>
        <div class="contact-relation">${contact.relation}</div>
      </div>
      <div class="contact-actions">
        <button onclick="callContact('${contact.phone}', '${contact.name}')" class="call-btn" title="Ligar">
          <i class="fas fa-phone"></i>
        </button>
        <button onclick="editContact('${contact.id}')" class="edit-btn" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteContact('${contact.id}')" class="delete-btn" title="Remover">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Sistema de Emergência carregado - BH");

  if (window.innerWidth <= 768) {
    emergencyBtn.style.bottom = "15px";
    emergencyBtn.style.right = "15px";
  }

  loadContacts();
});
