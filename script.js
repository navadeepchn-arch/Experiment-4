function showPage(id, el) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('nav .tabs a').forEach(function(a){ a.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  el.classList.add('active');
}

var employees = JSON.parse(localStorage.getItem('emp4') || '[]');
var empId = employees.length ? Math.max.apply(null, employees.map(function(e){ return e.id; })) + 1 : 1;

function saveEmps() { localStorage.setItem('emp4', JSON.stringify(employees)); }

function addEmp() {
  var name  = document.getElementById('e-name').value.trim();
  var email = document.getElementById('e-email').value.trim();
  var dept  = document.getElementById('e-dept').value.trim();
  var sal   = parseFloat(document.getElementById('e-sal').value);
  if (!name || name.length < 2) { alert('Name must be at least 2 characters'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Invalid email'); return; }
  if (employees.find(function(e){ return e.email === email; })) { alert('Email already exists'); return; }
  if (!dept || dept.length < 2) { alert('Invalid department'); return; }
  if (isNaN(sal) || sal <= 0) { alert('Invalid salary'); return; }
  employees.push({ id: empId++, name: name, email: email, department: dept, salary: sal });
  saveEmps();
  ['e-name','e-email','e-dept','e-sal'].forEach(function(i){ document.getElementById(i).value = ''; });
  renderEmps();
}

function deleteEmp(id) {
  employees = employees.filter(function(e){ return e.id !== id; });
  saveEmps();
  renderEmps();
}

function renderEmps() {
  var q = document.getElementById('e-search').value.toLowerCase();
  var list = employees.filter(function(e){
    return e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
  });
  var el = document.getElementById('emp-list');
  if (!list.length) { el.innerHTML = '<div class="empty-msg">No employees found.</div>'; return; }
  el.innerHTML = list.map(function(e){
    return '<div class="emp-item"><div class="info"><strong>' + e.name + '</strong><span>' + e.email + ' | ' + e.department + ' | ₹' + e.salary.toLocaleString() + '</span></div><button class="del-btn" onclick="deleteEmp(' + e.id + ')">Remove</button></div>';
  }).join('');
}

renderEmps();

var cards = JSON.parse(localStorage.getItem('cards4') || '[]');
var cardId = cards.length ? Math.max.apply(null, cards.map(function(c){ return c.id; })) + 1 : 1;
var SUIT_ICONS  = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
var SUIT_COLORS = { Hearts: '#cc0000', Diamonds: '#cc0000', Clubs: '#1a1f2e', Spades: '#1a1f2e' };

function saveCards() { localStorage.setItem('cards4', JSON.stringify(cards)); }

function addCard() {
  var suit  = document.getElementById('c-suit').value;
  var value = document.getElementById('c-value').value;
  var cond  = document.getElementById('c-cond').value;
  var notes = document.getElementById('c-notes').value;
  if (!suit)  { alert('Select a suit'); return; }
  if (!value) { alert('Select a value'); return; }
  if (cards.find(function(c){ return c.suit === suit && c.value === value; })) {
    setCardResponse('409 Conflict\n{\n  "error": "Card already exists in collection"\n}');
    return;
  }
  var card = { id: cardId++, suit: suit, value: value, condition: cond, notes: notes, addedAt: new Date().toISOString() };
  cards.push(card);
  saveCards();
  setCardResponse('201 Created\n' + JSON.stringify(card, null, 2));
  renderCards();
}

function deleteCard(id) {
  var card = cards.find(function(c){ return c.id === id; });
  cards = cards.filter(function(c){ return c.id !== id; });
  saveCards();
  setCardResponse('200 OK\n{\n  "message": "Card removed",\n  "card": ' + JSON.stringify(card) + '\n}');
  renderCards();
}

function showStats() {
  var bySuit = { Hearts: 0, Diamonds: 0, Clubs: 0, Spades: 0 };
  cards.forEach(function(c){ bySuit[c.suit]++; });
  var stats = { total: cards.length, bySuit: bySuit, deckCompletion: cards.length + '/52', percentComplete: ((cards.length / 52) * 100).toFixed(1) + '%' };
  setCardResponse('200 OK — GET /api/stats/summary\n' + JSON.stringify(stats, null, 2));
}

function setCardResponse(text) { document.getElementById('card-response').textContent = text; }

function renderCards() {
  var filter = document.getElementById('c-filter').value;
  var list = filter ? cards.filter(function(c){ return c.suit === filter; }) : cards;
  var el = document.getElementById('card-list');
  if (!list.length) { el.innerHTML = '<div class="empty-msg">No cards found.</div>'; return; }
  el.innerHTML = list.map(function(c){
    return '<div class="card-item"><div style="display:flex;align-items:center;"><span class="suit-icon" style="color:' + SUIT_COLORS[c.suit] + '">' + SUIT_ICONS[c.suit] + '</span><div class="cinfo"><strong>' + c.value + ' of ' + c.suit + '</strong><span>Condition: ' + c.condition + (c.notes ? ' | ' + c.notes : '') + '</span></div></div><button class="del-btn" onclick="deleteCard(' + c.id + ')">Remove</button></div>';
  }).join('');
}

renderCards();

var EVENTS = {
  EVT001: { name: 'IPL Final 2025', total: 50 },
  EVT002: { name: 'Ed Sheeran Live', total: 30 },
  EVT003: { name: 'TechConf 2025', total: 20 }
};

var ticketDB = JSON.parse(localStorage.getItem('tickets4') || '{}');

function saveTix() { localStorage.setItem('tickets4', JSON.stringify(ticketDB)); }

function getState(eid) {
  if (!ticketDB[eid]) ticketDB[eid] = { booked: [], locked: {}, bookings: {} };
  return ticketDB[eid];
}

function getEvt() { return document.getElementById('t-event').value; }
function getUid() { return document.getElementById('t-user').value.trim() || 'user1'; }
function setTixResponse(text) { document.getElementById('ticket-response').textContent = text; }

function lockSeat() {
  var eid = getEvt();
  var uid = getUid();
  var st = getState(eid);
  var now = Date.now();
  Object.keys(st.locked).forEach(function(u){ if (now - st.locked[u] > 10000) delete st.locked[u]; });
  if (st.locked[uid]) { setTixResponse('409 Conflict\n{\n  "error": "You already have a seat locked"\n}'); return; }
  var avail = EVENTS[eid].total - st.booked.length - Object.keys(st.locked).length;
  if (avail <= 0) { setTixResponse('409 Conflict\n{\n  "error": "No seats available"\n}'); return; }
  st.locked[uid] = Date.now();
  saveTix();
  var remaining = EVENTS[eid].total - st.booked.length - Object.keys(st.locked).length;
  setTixResponse('200 OK — POST /api/lock\n{\n  "success": true,\n  "message": "Seat locked for 10 seconds",\n  "userId": "' + uid + '",\n  "lockExpiresIn": "10 seconds",\n  "remaining": ' + remaining + '\n}');
  renderSeats();
  setTimeout(function(){
    if (st.locked[uid]) { delete st.locked[uid]; saveTix(); renderSeats(); setTixResponse('Lock expired for ' + uid + '. Call /api/lock again.'); }
  }, 10000);
}

function bookSeat() {
  var eid = getEvt();
  var uid = getUid();
  var st = getState(eid);
  if (!st.locked[uid]) { setTixResponse('400 Bad Request\n{\n  "error": "No active lock. Call /api/lock first."\n}'); return; }
  if (st.bookings[uid]) { setTixResponse('409 Conflict\n{\n  "error": "Already booked"\n}'); return; }
  var bookingId = Date.now();
  st.booked.push(uid);
  st.bookings[uid] = { bookingId: bookingId, userId: uid, event: EVENTS[eid].name, bookedAt: new Date().toISOString() };
  delete st.locked[uid];
  saveTix();
  var remaining = EVENTS[eid].total - st.booked.length - Object.keys(st.locked).length;
  setTixResponse('201 Created — POST /api/book\n{\n  "success": true,\n  "bookingId": ' + bookingId + ',\n  "remaining": ' + remaining + '\n}');
  renderSeats();
}

function cancelBooking() {
  var eid = getEvt();
  var uid = getUid();
  var st = getState(eid);
  if (!st.bookings[uid]) { setTixResponse('404 Not Found\n{\n  "error": "No booking found for ' + uid + '"\n}'); return; }
  st.booked = st.booked.filter(function(u){ return u !== uid; });
  delete st.bookings[uid];
  saveTix();
  setTixResponse('200 OK — DELETE /api/booking\n{\n  "success": true,\n  "message": "Booking cancelled, seat restored"\n}');
  renderSeats();
}

function renderSeats() {
  var eid = getEvt();
  var st = getState(eid);
  var uid = getUid();
  var total = EVENTS[eid].total;
  var now = Date.now();
  Object.keys(st.locked).forEach(function(u){ if (now - st.locked[u] > 10000) delete st.locked[u]; });
  var bookedCount = st.booked.length;
  var lockedCount = Object.keys(st.locked).length;
  var avail = total - bookedCount - lockedCount;
  document.getElementById('s-total').textContent  = total;
  document.getElementById('s-avail').textContent  = avail;
  document.getElementById('s-locked').textContent = lockedCount;
  document.getElementById('s-booked').textContent = bookedCount;
  var grid = document.getElementById('seat-grid');
  grid.innerHTML = '';
  for (var i = 1; i <= total; i++) {
    var div = document.createElement('div');
    div.className = 'seat';
    div.textContent = i;
    var owner = st.booked[i - 1];
    if (owner === uid) { div.classList.add('mine'); div.title = 'Your seat'; }
    else if (owner) { div.classList.add('booked'); div.title = 'Booked'; }
    else if (st.locked[uid] && i === bookedCount + 1) { div.classList.add('locked'); div.title = 'Your lock'; }
    else if (i > bookedCount && i <= bookedCount + lockedCount) { div.classList.add('locked'); div.title = 'Locked'; }
    grid.appendChild(div);
  }
}

document.getElementById('t-event').addEventListener('change', renderSeats);
renderSeats();