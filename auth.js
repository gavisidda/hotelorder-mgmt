// Shared PIN login used by all staff dashboards.
// Expects a global REQUIRED_ROLE variable to be set before this loads,
// e.g. const REQUIRED_ROLE = 'waiter';

let currentUser = null;
let enteredPin = '';

function pinPress(digit) {
  if (enteredPin.length >= 4) return;
  enteredPin += digit;
  updatePinDots();
  if (enteredPin.length === 4) checkPin();
}

function pinBackspace() {
  enteredPin = enteredPin.slice(0, -1);
  updatePinDots();
}

function updatePinDots() {
  document.querySelectorAll('.pin-dots span').forEach((dot, i) => {
    dot.classList.toggle('filled', i < enteredPin.length);
  });
}

function checkPin() {
  db.collection('users').where('pin', '==', enteredPin).where('active', '==', true).get()
    .then(snap => {
      const match = snap.docs.find(d => d.data().role === REQUIRED_ROLE);
      if (match) {
        currentUser = { id: match.id, ...match.data() };
        sessionStorage.setItem('staffUser_' + REQUIRED_ROLE, JSON.stringify(currentUser));
        onLoginSuccess();
      } else {
        document.getElementById('loginError').textContent = 'Incorrect PIN or not authorized for this dashboard';
        enteredPin = '';
        updatePinDots();
      }
    })
    .catch(err => {
      document.getElementById('loginError').textContent = 'Login failed: ' + err.message;
      enteredPin = '';
      updatePinDots();
    });
}

function tryRestoreSession() {
  const saved = sessionStorage.getItem('staffUser_' + REQUIRED_ROLE);
  if (saved) {
    currentUser = JSON.parse(saved);
    onLoginSuccess();
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem('staffUser_' + REQUIRED_ROLE);
  location.reload();
}
