/**
 * Account Management
 * Handles user account data with localStorage/Firebase integration
 */

/**
 * Load user data from localStorage
 */
function loadUserData() {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return null;
}

/**
 * Save user data to localStorage
 */
function saveUserData(data) {
  try {
    localStorage.setItem('userData', JSON.stringify({
      ...data,
      updatedAt: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Show status message
 */
function showMessage(message, type = 'success') {
  const messageDiv = document.getElementById('status-message');
  if (!messageDiv) {
    const newDiv = document.createElement('div');
    newDiv.id = 'status-message';
    newDiv.setAttribute('role', 'alert');
    newDiv.setAttribute('aria-live', 'polite');
    newDiv.style.cssText = `
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    document.querySelector('main').insertBefore(newDiv, document.querySelector('.account-section'));
  }
  
  const msg = document.getElementById('status-message');
  msg.textContent = message;
  
  if (type === 'success') {
    msg.style.background = 'rgba(16, 185, 129, 0.1)';
    msg.style.color = '#10b981';
    msg.style.border = '1px solid #10b981';
  } else if (type === 'error') {
    msg.style.background = 'rgba(239, 68, 68, 0.1)';
    msg.style.color = '#ef4444';
    msg.style.border = '1px solid #ef4444';
  }
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    msg.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      msg.style.display = 'none';
    }, 300);
  }, 5000);
}

/**
 * Populate form with saved data
 */
function populateForm() {
  const userData = loadUserData();
  
  if (userData) {
    if (userData.name) document.getElementById('name').value = userData.name;
    if (userData.email) document.getElementById('email').value = userData.email;
    if (userData.territory) document.getElementById('territory').value = userData.territory;
    if (userData.notifications) document.getElementById('notifications').checked = userData.notifications;
    if (userData.newsletter) document.getElementById('newsletter').checked = userData.newsletter;
  }
}

/**
 * Handle form submission
 */
function handleSubmit(event) {
  event.preventDefault();
  
  // Get form values
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const territory = document.getElementById('territory').value;
  const notifications = document.getElementById('notifications').checked;
  const newsletter = document.getElementById('newsletter').checked;
  
  // Validate
  if (!name) {
    showMessage('❌ Veuillez saisir votre nom', 'error');
    return;
  }
  
  if (!email) {
    showMessage('❌ Veuillez saisir votre email', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showMessage('❌ Format d\'email invalide', 'error');
    return;
  }
  
  if (!territory) {
    showMessage('❌ Veuillez sélectionner votre territoire', 'error');
    return;
  }
  
  // Save data
  const userData = {
    name,
    email,
    territory,
    notifications,
    newsletter
  };
  
  const saved = saveUserData(userData);
  
  if (saved) {
    showMessage('✅ Vos informations ont été enregistrées avec succès !', 'success');
    
    // In production, this would also sync with Firebase/backend
    // syncWithBackend(userData);
  } else {
    showMessage('❌ Erreur lors de l\'enregistrement. Veuillez réessayer.', 'error');
  }
}

/**
 * Initialize account page
 */
function initAccount() {
  populateForm();
  
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
  
  // Real-time email validation
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      const email = this.value.trim();
      if (email && !isValidEmail(email)) {
        this.style.borderColor = '#ef4444';
        const errorMsg = document.getElementById('email-error');
        if (!errorMsg) {
          const error = document.createElement('div');
          error.id = 'email-error';
          error.style.cssText = 'color: #ef4444; font-size: 0.85rem; margin-top: 0.25rem;';
          error.textContent = '⚠️ Format d\'email invalide';
          this.parentElement.appendChild(error);
        }
      } else {
        this.style.borderColor = '#2a2d3e';
        const errorMsg = document.getElementById('email-error');
        if (errorMsg) errorMsg.remove();
      }
    });
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccount);
} else {
  initAccount();
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
`;
document.head.appendChild(style);
