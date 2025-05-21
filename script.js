document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.card');
  const continueButton = document.getElementById('continueButton');
  const mainContent = document.getElementById('mainContent');
  const secondaryContent = document.getElementById('secondaryContent');
  const backButton = document.getElementById('backButton');
  const seg2ButtonContainer = document.getElementById('seg2ButtonContainer');
  const seg2Buttons = document.querySelectorAll('.seg2button');
  const seg2ContinueButton = document.getElementById('seg2ContinueButton');

  // Global booking and payment-related state.
  let selectedSize = '';
  let selectedSeg2Tab = 'interior';
  let selectedSeg2CardTitle = '';
  let pendingBookingData = null;
  let seg3Sidebar = null;
  let squareModal = null;
  let card; // This is the Square card instance.

  // Mapping from seg2 card titles to service UUIDs.
  const serviceUUIDMapping = {
    "Gold": "b7c4edf5-d736-44ca-8714-c0de2a4aa53a",
    "Premium": "54b60514-9521-4395-96ae-712b4585983b",
    "Detailing": "6ecb4ffb-c11c-4825-aedc-f1be2307c4eb",
    "Exterior Ceramic": "d584bda5-5d06-46ac-bbd0-4cb0071478f6",
    "Ministry Ceramic": "59920ac8-f6a3-40b2-9e1f-aab7a665208a"
  };

  // Square configuration parameters.
  const appId = "sandbox-sq0idb-BZ8hmKvYm_lGjEhKgddQwA";
  const locationId = "LHRGP0KGDXTKV";

  // Price configuration and available add-ons.
  const prices = {
    interior: {
      SMALL:    { Gold: 70, Premium: 110, Detailing: 250 },
      MEDIUM:   { Gold: 75, Premium: 120, Detailing: 270 },
      LARGE:    { Gold: 80, Premium: 130, Detailing: 300 }
    },
    exterior: {
      SMALL:    { Gold: 70, Premium: 110, Detailing: 250, "Exterior Ceramic": 999 },
      MEDIUM:   { Gold: 75, Premium: 120, Detailing: 270, "Exterior Ceramic": 999 },
      LARGE:    { Gold: 80, Premium: 130, Detailing: 300, "Exterior Ceramic": 999 }
    },
    "int-ext": {
      SMALL:    { Gold: 180, Premium: 180, Detailing: 400, "Ministry Ceramic": 1499 },
      MEDIUM:   { Gold: 190, Premium: 190, Detailing: 420, "Ministry Ceramic": 1499 },
      LARGE:    { Gold: 200, Premium: 200, Detailing: 450, "Ministry Ceramic": 1499 }
    }
  };

  const addons = [
    { key: "headlight", name: "Headlight Restoration", price: 80 },
    { key: "steam", name: "Steam Clean", price: 40 },
    { key: "leather", name: "Leather Treatment", price: 80 },
    { key: "engine", name: "Engine Wash", price: 80 },
    { key: "odour", name: "Odour Removal", price: 60 },
    { key: "sticker", name: "Sticker Removal", price: 50 },
    { key: "scratch", name: "Scratch Removal", price: 50 },
    { key: "dent", name: "Dent Removal", price: 75 }
  ];

  // --- SEGMENT 1: Vehicle Size Selection ---
  cards.forEach(cardEl => {
    cardEl.addEventListener('click', function() {
      cards.forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      continueButton.classList.add('enabled');
      selectedSize = this.getAttribute('data-size');
    });
  });

  continueButton.addEventListener('click', function() {
    if (this.classList.contains('enabled')) {
      mainContent.style.opacity = '0';
      setTimeout(() => {
        mainContent.style.display = 'none';
        secondaryContent.style.display = 'block';
        setTimeout(() => {
          secondaryContent.classList.add('active');
          hideAllCardContainers();
          seg2ContinueButton.classList.remove('enabled', 'visible');
        }, 50);
      }, 500);
    }
  });

  if (backButton) {
    backButton.addEventListener('click', function() {
      window.location.reload();
    });
  }

  // --- SEGMENT 2: Service Selection with Tabs ---
  seg2Buttons.forEach(button => {
    button.addEventListener('click', function() {
      const tab = this.getAttribute('data-tab');
      selectedSeg2Tab = tab;
      seg2Buttons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      showTab(tab);
      updateCardPrices();
      seg2ButtonContainer.classList.remove('moved', 'moved-up-more', 'moved-interior', 'moved-int-ext');
      if (tab === "exterior") {
        seg2ButtonContainer.classList.add('moved-up-more');
      } else if (tab === "interior") {
        seg2ButtonContainer.classList.add('moved-interior');
      } else if (tab === "int-ext") {
        seg2ButtonContainer.classList.add('moved-int-ext');
      } else {
        seg2ButtonContainer.classList.add('moved');
      }
      seg2ContinueButton.classList.add('visible');
      seg2ContinueButton.classList.remove('enabled');
      document.querySelectorAll(`#seg2Cards-${tab} .seg2-card`).forEach(c => c.classList.remove('selected'));
      selectedSeg2CardTitle = '';
    });
  });

  document.querySelectorAll('.seg2-card').forEach(cardEl => {
    cardEl.addEventListener('click', function() {
      const container = this.closest('.card-container');
      container.querySelectorAll('.seg2-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      seg2ContinueButton.classList.add('enabled');
      selectedSeg2CardTitle = this.getAttribute('data-title');
    });
  });

  seg2ContinueButton.addEventListener('click', function() {
    if (!this.classList.contains('enabled')) return;
    openCalendarModal();
  });

  // --- Calendar Modal Logic ---
  let calendarModal = null;
  function openCalendarModal() {
    if (!calendarModal) {
      calendarModal = document.createElement('div');
      calendarModal.id = 'calendarModal';
      calendarModal.innerHTML = `
        <div class="calendar-backdrop"></div>
        <div class="calendar-modal-content">
          <div class="calendar-modal-header">
            <span>Select a date and time</span>
            <span class="calendar-close-btn" tabindex="0">&times;</span>
          </div>
          <form id="calendarForm">
            <label for="calendar-date">Date:</label>
            <input type="date" id="calendar-date" required /><br><br>
            <label for="calendar-time">Time:</label>
            <select id="calendar-time" required></select><br><br>
            <button type="submit" class="calendar-confirm-btn">Confirm</button>
          </form>
        </div>
      `;
      document.body.appendChild(calendarModal);
      const style = document.createElement('style');
      style.textContent = `
        #calendarModal {
          position: fixed; z-index: 99999; left: 0; top: 0; right: 0; bottom: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .calendar-backdrop {
          position: fixed; left: 0; top: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.3);
        }
        .calendar-modal-content {
          position: relative; background: #1b263b; color: #fff;
          border-radius: 12px; box-shadow: 0 6px 24px #0006;
          padding: 32px 20px 24px 20px; min-width: 290px; min-height: 220px;
          z-index: 10;
        }
        .calendar-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 1.2rem; margin-bottom: 16px; font-weight: 600;
        }
        .calendar-close-btn {
          font-size: 2rem; font-weight: bold; color: #ffe066;
          cursor: pointer;
        }
        #calendarForm label {
          font-size: 1rem; font-weight: 500;
        }
        #calendarForm input[type="date"],
        #calendarForm select {
          padding: 6px 8px; border-radius: 6px; border: 1px solid #b2c9db;
          font-size: 1rem; margin-top: 3px; margin-bottom: 3px;
          background: #fff; color: #222;
        }
        #calendarForm select[disabled] {
          color: #888;
        }
        #calendarForm button.calendar-confirm-btn {
          margin-top: 10px;
          background: #ffe066; color: #1b263b; border: none;
          border-radius: 8px; padding: 10px 20px; font-size: 1rem;
          font-weight: bold; cursor: pointer; transition: background 0.2s;
        }
        #calendarForm button.calendar-confirm-btn:hover {
          background: #f9dc4a;
        }
      `;
      document.head.appendChild(style);
      calendarModal.querySelector('.calendar-backdrop').onclick =
      calendarModal.querySelector('.calendar-close-btn').onclick = function() {
        window.location.reload();
      };
    }

    const dateInput = calendarModal.querySelector('#calendar-date');
    const timeSelect = calendarModal.querySelector('#calendar-time');
    const form = calendarModal.querySelector('#calendarForm');
    dateInput.value = '';
    timeSelect.innerHTML = '<option value="">Select a time</option>';
    timeSelect.disabled = true;
    const today = new Date();
    today.setHours(0,0,0,0);
    const minDate = new Date(today.getTime() + 24*60*60*1000);
    dateInput.min = minDate.toISOString().slice(0,10);
    dateInput.addEventListener('input', function() {
      const chosen = new Date(this.value);
      chosen.setHours(0,0,0,0);
      if (this.value && chosen < minDate) {
        this.value = minDate.toISOString().slice(0,10);
      }
      timeSelect.innerHTML = '';
      let isCeramic = false;
      if (
        (selectedSeg2Tab === 'exterior' && selectedSeg2CardTitle === 'Exterior Ceramic') ||
        (selectedSeg2Tab === 'int-ext' && selectedSeg2CardTitle === 'Ministry Ceramic')
      ) {
        isCeramic = true;
      }
      if (isCeramic) {
        const opt = document.createElement('option');
        opt.value = '09:00';
        opt.textContent = '9:00 am';
        timeSelect.appendChild(opt);
      } else {
        for (let hour = 8; hour <= 15; ++hour) {
          const opt = document.createElement('option');
          opt.value = `${hour.toString().padStart(2,'0')}:00`;
          const ampm = hour < 12 ? 'am' : 'pm';
          const dispHour = (hour <= 12) ? hour : hour - 12;
          opt.textContent = `${dispHour}:00 ${ampm}`;
          timeSelect.appendChild(opt);
        }
      }
      timeSelect.disabled = false;
    });
    form.onsubmit = function(e) {
      e.preventDefault();
      const date = dateInput.value;
      const time = timeSelect.value;
      if (!date || !time) {
        alert("Please select both date and time.");
        return;
      }
      closeCalendarModal();
      // Assemble reserved_on as an ISO 8601 UTC string.
      const reserved_on = `${date}T${time}:00Z`;
      // Merge booking info with required API fields.
      pendingBookingData = Object.assign({}, pendingBookingData, {
        reserved_on,
        seg2Tab: selectedSeg2Tab,
        seg2Card: selectedSeg2CardTitle,
        service_uuid: serviceUUIDMapping[selectedSeg2CardTitle] || "placeholder-uuid",
        location_uuid: "47191ab9-1611-4468-a49c-efcd4ee1109f",
        customer_phone: "",
        customer_first_name: "",
        customer_email: "user@example.com",
        booking_comment: ""
      });
      showSeg3Sidebar({ reserved_on, seg2Tab: selectedSeg2Tab, seg2Card: selectedSeg2CardTitle });
    };
    calendarModal.style.display = 'flex';
  }

  function closeCalendarModal() {
    if (calendarModal) calendarModal.style.display = 'none';
  }

  // --- SEGMENT 3: Checkout Sidebar (Payment, Summary & Contact Details) ---
  function showSeg3Sidebar({ reserved_on, seg2Tab, seg2Card }) {
    secondaryContent.classList.remove('active');
    setTimeout(() => {
      secondaryContent.style.display = 'none';
    }, 500);
    if (seg3Sidebar) seg3Sidebar.remove();
    let basePrice = 0;
    if (selectedSize && prices[seg2Tab] && prices[seg2Tab][selectedSize] && prices[seg2Tab][selectedSize][seg2Card]) {
      basePrice = prices[seg2Tab][selectedSize][seg2Card];
    }
    let selectedAddons = [];
    function calculateTotal() {
      let total = basePrice;
      for (const key of selectedAddons) {
        const found = addons.find(a => a.key === key);
        if (found) total += found.price;
      }
      return total;
    }
    seg3Sidebar = document.createElement('div');
    seg3Sidebar.id = 'seg3Sidebar';
    function renderSidebar() {
      seg3Sidebar.innerHTML = `
        <div class="seg3-header">
          Checkout
          <button class="seg3-x" title="Close">&times;</button>
        </div>
        <div class="seg3-content">
          <div class="summary-section">
            <div class="summary-title">Your Selection</div>
            <div class="summary-row"><span><strong>Date &amp; Time:</strong></span><span>${reserved_on}</span></div>
            <div class="summary-row"><span><strong>Package:</strong></span><span>${seg2Card || 'N/A'}</span></div>
            <div class="summary-row"><span><strong>Service:</strong></span><span>${{ 'interior': 'Interior Only', 'exterior': 'Exterior Only', 'int-ext': 'Interior & Exterior' }[seg2Tab] || 'Unknown'}</span></div>
            <div class="summary-row"><span><strong>Vehicle Size:</strong></span><span>${selectedSize || 'Not selected'}</span></div>
            <div class="summary-row"><span><strong>Base Price:</strong></span><span>$${basePrice}</span></div>
          </div>
          <div class="user-details">
            <div class="input-group">
              <label for="customerName">Name:</label>
              <input type="text" id="customerName" placeholder="Your Name" required/>
            </div>
            <div class="input-group">
              <label for="customerPhone">Phone Number:</label>
              <input type="text" id="customerPhone" placeholder="Your Phone Number" required/>
            </div>
            <div class="input-group">
              <label for="carMakeModel">Car Make and Model?</label>
              <input type="text" id="carMakeModel" placeholder="MERCEDES SUV" required/>
            </div>
          </div>
          <div class="addons-section">
            <div class="addons-title">Add-ons</div>
            <ul class="addon-list">
              ${addons.map(addon => `
                <li class="addon-item">
                  <label class="addon-label">
                    <input type="checkbox" class="addon-checkbox" value="${addon.key}" ${selectedAddons.includes(addon.key) ? "checked" : ""}/>
                    ${addon.name}
                  </label>
                  <span class="addon-price">$${addon.price}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="total-section">
            <div>
              <span class="total-label">Total:</span>
              <span class="total-value">$${calculateTotal()}</span>
            </div>
          </div>
          <button class="checkout-btn">Confirm &amp; Checkout</button>
        </div>
      `;
      seg3Sidebar.querySelector('.seg3-x').onclick = function() {
        window.location.reload();
      };
      seg3Sidebar.querySelectorAll('.addon-checkbox').forEach(cb => {
        cb.onchange = function() {
          const key = this.value;
          if (this.checked) {
            if (!selectedAddons.includes(key)) selectedAddons.push(key);
          } else {
            selectedAddons = selectedAddons.filter(k => k !== key);
          }
          renderSidebar();
        };
      });
      seg3Sidebar.querySelector('.checkout-btn').onclick = function() {
        const nameInput = document.getElementById("customerName");
        const phoneInput = document.getElementById("customerPhone");
        const carInput = document.getElementById("carMakeModel");
        if (!nameInput.value.trim() || !phoneInput.value.trim() || !carInput.value.trim()) {
          alert("Please fill in your name, phone number, and car make/model.");
          return;
        }
        pendingBookingData.customer_first_name = nameInput.value.trim();
        pendingBookingData.customer_phone = phoneInput.value.trim();
        pendingBookingData.booking_comment = carInput.value.trim();
        openSquarePaymentModal();
      };
    }
    renderSidebar();
    document.body.appendChild(seg3Sidebar);
    setTimeout(() => {
      seg3Sidebar.classList.add('visible');
    }, 30);
  }

  function hideAllCardContainers() {
    document.querySelectorAll('#secondaryContent .card-container').forEach(container => {
      container.classList.remove('visible');
      container.style.display = 'none';
    });
  }
  function showTab(tabName) {
    document.querySelectorAll('.card-container[id^="seg2Cards-"]').forEach(container => {
      container.classList.remove('visible');
      container.style.display = 'none';
    });
    const show = document.getElementById(`seg2Cards-${tabName}`);
    if (show) {
      show.style.display = 'flex';
      setTimeout(() => {
        show.classList.add('visible');
      }, 10);
    }
  }
  function updateCardPrices() {
    ['interior', 'exterior', 'int-ext'].forEach(tab => {
      const container = document.getElementById(`seg2Cards-${tab}`);
      if (!container) return;
      const cards = container.querySelectorAll('.seg2-card');
      cards.forEach(card => {
        const cardTitle = card.getAttribute('data-title');
        const priceDiv = card.querySelector('.seg2-price');
        let price = prices[tab][selectedSize] && prices[tab][selectedSize][cardTitle];
        priceDiv.textContent = typeof price === 'number' ? `$${price}` : '';
      });
    });
  }

  // --- Square Payment Integration ---
  async function initializeSquareCard(payments) {
    card = await payments.card();
    await card.attach("#square-card-container");
  }

  async function openSquarePaymentModal() {
    if (!squareModal) {
      squareModal = document.createElement('div');
      squareModal.id = 'squareModal';
      squareModal.innerHTML = `
        <div class="square-backdrop"></div>
        <div class="square-modal-content">
          <div class="square-modal-header">
            <span>Enter Card Details</span>
            <span class="square-close-btn" tabindex="0">&times;</span>
          </div>
          <div id="square-card-container"></div>
          <button id="square-card-button">Pay Now</button>
          <p id="square-payment-status"></p>
        </div>
      `;
      document.body.appendChild(squareModal);
      const style = document.createElement('style');
      style.textContent = `
        #squareModal {
          position: fixed; z-index: 100000; left: 0; top: 0; right: 0; bottom: 0;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.5s ease-in-out;
        }
        #squareModal.show {
          opacity: 1;
        }
        .square-backdrop {
          position: fixed; left: 0; top: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.3);
        }
        .square-modal-content {
          position: relative; background: #fff; padding: 20px;
          border-radius: 8px; min-width: 300px; z-index: 100001; text-align: center;
        }
        .square-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 1.2rem; margin-bottom: 10px;
        }
        .square-close-btn {
          font-size: 2rem; cursor: pointer; color: #444;
        }
      `;
      document.head.appendChild(style);
      squareModal.querySelector('.square-backdrop').onclick =
      squareModal.querySelector('.square-close-btn').onclick = function() {
        window.location.reload();
      };
      const payments = Square.payments(appId, locationId);
      await initializeSquareCard(payments);
      document.getElementById("square-card-button").addEventListener("click", async function () {
        try {
          const tokenResult = await card.tokenize();
          if (tokenResult.status === "OK") {
            const token = tokenResult.token;
            const paymentSuccessful = await createSquarePayment(token);
            if (paymentSuccessful) {
              document.getElementById("square-payment-status").innerText = "✅ Payment Successful!";
              squareModal.classList.remove("show");
              // Finalize booking after successful payment.
              await finalizeBooking();
            } else {
              document.getElementById("square-payment-status").innerText = "❌ Payment Failed!";
            }
          } else {
            throw new Error("Tokenization failed");
          }
        } catch (error) {
          document.getElementById("square-payment-status").innerText = "❌ Payment Failed!";
          console.error(error);
        }
      });
    }
    squareModal.classList.add("show");
  }

  async function createSquarePayment(token) {
    try {
      const paymentResponse = await fetch("https://mnstry.duckdns.org:3001/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: token, bookingId: "pending-booking" })
      });
      return paymentResponse.ok;
    } catch (err) {
      console.error("Error processing Square payment", err);
      return false;
    }
  }

  // --- Finalize Booking: Call Backend to Submit to EasyWeek ---
  async function finalizeBooking() {
    console.log("Finalizing booking with data:", pendingBookingData);
    try {
      const response = await fetch("https://mnstry.duckdns.org:3001/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingBookingData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from backend:", errorText);
        const statusEl = document.getElementById("status");
        if (statusEl) {
          statusEl.innerText = "Booking failed.";
        }
        return;
      }
      const result = await response.json();
      console.log("Booking result from backend:", result);
      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.innerText =
          result.uuid
            ? "Booking created! Booking ID: " + result.uuid
            : "Booking created (no uuid returned).";
      } else {
        console.log("Status element not found in DOM.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.innerText = "Booking failed.";
      }
    }
  }
});