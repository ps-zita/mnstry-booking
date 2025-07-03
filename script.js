document.addEventListener('DOMContentLoaded', function() {
  // Global booking and payment-related state.
  let selectedSize = '';
  let selectedSeg2Tab = 'Basic'; // possible values: "Basic", "Premium", "Detail"
  let selectedSeg2CardTitle = '';
  let pendingBookingData = {};
  let seg3Sidebar = null;
  let squareModal = null;
  let card; // Square card instance.
  let bookNowPayLaterClicked = false; // flag for "Book now & Pay later" button

  // Mapping from service names to UUIDs.
  const serviceUUIDMapping = {
    "Basic wash": "578ddbbb-62b7-4061-9fee-f8ccc1c92bf5",
    "Gold wash": "fab6e492-607c-4b5b-a5fb-987d54e596fa",
    "Premium interior": "95875e74-5df1-4ccc-98b0-f4fef420723c",
    "Premium exterior": "da7b5fb9-68b5-4f44-abcd-6e7604e637ea",
    "Premium max": "d5a7fdbf-a028-45d8-a187-76609f6d5a24",
    "Interior detail": "3069f316-a9a1-4042-ae98-26961bbd66d1",
    "Exterior detail": "f6a28756-3bff-4bd0-9a30-0b53bd065d2d",
    "Full detail": "f433b1b6-04ad-420c-be3c-35f768f2be7"
  };

  function getServiceUUID(cardTitle, size, group) {
    let uuid = serviceUUIDMapping[cardTitle];
    if (!uuid) {
      console.warn(`Service "${cardTitle}" not found. Defaulting to "Full detail".`);
      uuid = serviceUUIDMapping["Full detail"];
    }
    console.log(`Mapped [${group}] ${cardTitle} (${size}) to UUID: ${uuid}`);
    return uuid;
  }

  // Square configuration parameters.
  const appId = "sq0idp-2UIVBa7RW5RhNJbPp5VAOg";
  const locationId = "FK7Q4N5CDQQH5";

  // New Price configuration and available add-ons.
  // Basic: SMALL: Basic wash: $25, Gold wash: $70
  //        MEDIUM: Basic wash: $35, Gold wash: $75
  //        LARGE: Basic wash: $40, Gold wash: $80
  // Premium: SMALL: Premium interior: $110, Premium exterior: $110, Premium max: $180
  //          MEDIUM: Premium interior: $120, Premium exterior: $120, Premium max: $190
  //          LARGE: Premium interior: $130, Premium exterior: $200, Premium max: $200
  // Detail:  SMALL: Interior detail: $250, Exterior detail: $300, Full detail: $400
  //          MEDIUM: Interior detail: $250, Exterior detail: $320, Full detail: $420
  //          LARGE: Interior detail: $300, Exterior detail: $350, Full detail: $450
  const prices = {
    Basic: {
      SMALL: { "Basic wash": 25, "Gold wash": 70 },
      MEDIUM: { "Basic wash": 35, "Gold wash": 75 },
      LARGE: { "Basic wash": 40, "Gold wash": 80 }
    },
    Premium: {
      SMALL: { "Premium interior": 110, "Premium exterior": 110, "Premium max": 180 },
      MEDIUM: { "Premium interior": 120, "Premium exterior": 120, "Premium max": 190 },
      LARGE: { "Premium interior": 130, "Premium exterior": 200, "Premium max": 200 }
    },
    Detail: {
      SMALL: { "Interior detail": 250, "Exterior detail": 300, "Full detail": 400 },
      MEDIUM: { "Interior detail": 250, "Exterior detail": 320, "Full detail": 420 },
      LARGE: { "Interior detail": 300, "Exterior detail": 350, "Full detail": 450 }
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

  const isMobile = window.innerWidth <= 900;
  const sizeCards = document.querySelectorAll('.card');
  const continueButton = document.getElementById('continueButton');
  const mainContent = document.getElementById('mainContent');
  const secondaryContent = document.getElementById('secondaryContent');
  const backButton = document.getElementById('backButton');
  const seg2ButtonContainer = document.getElementById('seg2ButtonContainer');
  const seg2Buttons = document.querySelectorAll('.seg2button');
  let seg2ContinueButton = document.getElementById('seg2ContinueButton');

  // SEGMENT 1: Vehicle Size Selection.
  sizeCards.forEach(cardEl => {
    cardEl.addEventListener('click', function() {
      sizeCards.forEach(c => c.classList.remove('selected'));
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
          if (seg2ContinueButton) {
            seg2ContinueButton.classList.remove('enabled', 'visible');
          }
        }, 50);
      }, 500);
    }
  });

  if (backButton) {
    backButton.addEventListener('click', () => window.location.reload());
  }
  if (isMobile && seg2ContinueButton) {
    seg2ContinueButton.remove();
    seg2ContinueButton = null;
  }

  // SEGMENT 2: Service Selection with Tabs.
  seg2Buttons.forEach(button => {
    button.addEventListener('click', function() {
      const tab = this.getAttribute('data-tab'); // "Basic", "Premium", or "Detail"
      selectedSeg2Tab = tab;
      seg2Buttons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      showTab(tab);
      updateCardPrices();
      seg2ButtonContainer.classList.remove('moved', 'moved-up-more', 'moved-interior', 'moved-int-ext');
      if (tab === "Basic")
        seg2ButtonContainer.classList.add('moved-up-more');
      else if (tab === "Premium")
        seg2ButtonContainer.classList.add('moved-interior');
      else if (tab === "Detail")
        seg2ButtonContainer.classList.add('moved-int-ext');
      else
        seg2ButtonContainer.classList.add('moved');
      if (!isMobile && seg2ContinueButton) {
        seg2ContinueButton.classList.add('visible');
        seg2ContinueButton.classList.remove('enabled');
      }
      document.querySelectorAll(`#seg2Cards-${tab} .seg2-card`).forEach(c => c.classList.remove('selected'));
      selectedSeg2CardTitle = '';
    });
  });

  document.querySelectorAll('.seg2-card').forEach(cardEl => {
    cardEl.addEventListener('click', function() {
      const container = this.closest('.card-container');
      container.querySelectorAll('.seg2-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      selectedSeg2CardTitle = this.getAttribute('data-title');
      if (isMobile)
        openCalendarModal();
      else if (seg2ContinueButton)
        seg2ContinueButton.classList.add('enabled');
    });
  });

  if (seg2ContinueButton) {
    seg2ContinueButton.addEventListener('click', function() {
      if (!this.classList.contains('enabled')) return;
      openCalendarModal();
    });
  }

  // CALENDAR MODAL
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
            <input type="date" id="calendar-date" required><br><br>
            <label for="calendar-time">Time:</label>
            <select id="calendar-time" required></select><br><br>
            <button type="submit" class="calendar-confirm-btn">Confirm</button>
          </form>
        </div>
      `;
      document.body.appendChild(calendarModal);
      calendarModal.querySelector('.calendar-close-btn').onclick = closeCalendarModal;
      calendarModal.querySelector('.calendar-backdrop').onclick = closeCalendarModal;
    }
    const dateInput = calendarModal.querySelector('#calendar-date');
    const timeSelect = calendarModal.querySelector('#calendar-time');
    const form = calendarModal.querySelector('#calendarForm');
    dateInput.value = '';
    timeSelect.innerHTML = '<option value="">Select a time</option>';
    timeSelect.disabled = true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateInput.min = today.toISOString().slice(0, 10);

    dateInput.addEventListener('input', function() {
      const chosen = new Date(this.value);
      chosen.setHours(0, 0, 0, 0);
      timeSelect.innerHTML = '';
      const now = new Date();
      let startHour = 8;
      const endHour = 15;
      // Only adjust for today's bookings.
      if (this.value === today.toISOString().slice(0, 10)) {
        startHour = now.getHours() + 1;
        if (startHour > endHour) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'No available times today';
          timeSelect.appendChild(opt);
          timeSelect.disabled = true;
          return;
        }
      }

      let isCeramic = false;
      if ((selectedSeg2Tab === 'Premium' && selectedSeg2CardTitle === 'Exterior ceramic') ||
          (selectedSeg2Tab === 'Detail' && selectedSeg2CardTitle === 'Full detail'))
      {
        isCeramic = true;
      }

      if (isCeramic) {
        const opt = document.createElement('option');
        opt.value = '09:00';
        opt.textContent = '9:00 am';
        timeSelect.appendChild(opt);
      } else {
        for (let hour = startHour; hour <= endHour; ++hour) {
          const opt = document.createElement('option');
          const hourStr = hour.toString().padStart(2, '0');
          opt.value = `${hourStr}:00`;
          const ampm = hour < 12 ? 'am' : 'pm';
          const dispHour = hour <= 12 ? hour : hour - 12;
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
      const localDateTimeString = `${date}T${time}:00+10:00`;
      const localDateObj = new Date(localDateTimeString);
      // Check if the selected time is in the past.
      if (localDateObj < new Date()) {
        alert("You cannot book a time in the past. Please select a future time.");
        return;
      }
      closeCalendarModal();
      const reserved_on = localDateObj.toISOString().replace(/\.[0-9]{3}Z$/, 'Z');
      console.log("Debug - Time being sent:", reserved_on);
      const serviceUUID = getServiceUUID(selectedSeg2CardTitle, selectedSize, selectedSeg2Tab);
      pendingBookingData = {
        ...pendingBookingData,
        reserved_on,
        seg2Tab: selectedSeg2Tab,
        seg2Card: selectedSeg2CardTitle,
        service_uuid: serviceUUID,
        location_uuid: "47191ab9-1611-4468-a49c-efcd4ee1109f",
        customer_phone: "",
        customer_first_name: "",
        customer_email: "user@example.com",
        booking_comment: "", // Will be updated later with separate price info.
        timezone: "Australia/Melbourne",
        customer_browser_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        customer_browser_language: navigator.language || "en"
      };
      showSeg3Sidebar({
        reserved_on,
        seg2Tab: selectedSeg2Tab,
        seg2Card: selectedSeg2CardTitle
      });
    };

    calendarModal.style.display = 'flex';
  }

  function closeCalendarModal() {
    if (calendarModal) {
      calendarModal.style.display = 'none';
    }
  }

  // SEGMENT 3: Checkout Sidebar.
  function showSeg3Sidebar({ reserved_on, seg2Tab, seg2Card }) {
    secondaryContent.classList.remove('active');
    setTimeout(() => {
      secondaryContent.style.display = 'none';
    }, 500);
    if (seg3Sidebar) seg3Sidebar.remove();

    let basePrice = 0;
    if (
      selectedSize &&
      prices[selectedSeg2Tab] &&
      prices[selectedSeg2Tab][selectedSize] &&
      prices[selectedSeg2Tab][selectedSize][seg2Card]
    ) {
      basePrice = prices[selectedSeg2Tab][selectedSize][seg2Card];
    }
    let selectedAddons = [];
    // Modified calculateTotal to use cents directly.
    // For testing purposes if basePrice is 40 then it will be treated as 40 cents.
    function calculateTotal() {
      let addonTotal = 0;
      selectedAddons.forEach(key => {
        const addon = addons.find(a => a.key === key);
        if (addon) addonTotal += addon.price;
      });
      const combinedTotal = basePrice + addonTotal;
      // Previously we multiplied by 100 to convert dollars to cents.
      // Now we want to test using cents so we use the combinedTotal directly.
      const chargeCents = combinedTotal;
      const feeCents = Math.round(chargeCents * 0.016);
      return chargeCents + feeCents;
    }
    function fullCharge() {
      return calculateTotal();
    }
    seg3Sidebar = document.createElement('div');
    seg3Sidebar.id = 'seg3Sidebar';
    function renderSidebar() {
      const fullChargeCents = fullCharge();
      seg3Sidebar.innerHTML = `
        <div class="seg3-header">
          Checkout
          <button class="seg3-x" title="Close">&times;</button>
        </div>
        <div class="seg3-content">
          <div class="summary-section">
            <div class="summary-title">Your Selection</div>
            <div class="summary-row">
              <span><strong>Date &amp; Time:</strong></span>
              <span>${reserved_on}</span>
            </div>
            <div class="summary-row">
              <span><strong>Package:</strong></span>
              <span>${seg2Card || 'N/A'}</span>
            </div>
            <div class="summary-row">
              <span><strong>Service:</strong></span>
              <span>${selectedSeg2Tab}</span>
            </div>
            <div class="summary-row">
              <span><strong>Vehicle Size:</strong></span>
              <span>${selectedSize || 'Not selected'}</span>
            </div>
            <div class="summary-row">
              <span><strong>Base Price:</strong></span>
              <span>$${basePrice}</span>
            </div>
            <div class="summary-row">
              <span><strong>Transaction Fee (1.6%):</strong></span>
              <span>$${(Math.round(basePrice * 0.016)).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span><strong>Total Charge:</strong></span>
              <span>$${(fullChargeCents / 100).toFixed(2)}</span>
            </div>
          </div>
          <div class="addons-section">
            <div class="addons-title">Add-ons</div>
            <ul class="addon-list">
              ${addons.map(addon => `
                <li class="addon-item">
                  <label class="addon-label">
                    <input type="checkbox" class="addon-checkbox" value="${addon.key}" ${selectedAddons.includes(addon.key) ? "checked" : ""}>
                    ${addon.name}
                  </label>
                  <span class="addon-price">$${addon.price}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="user-details">
            <div class="input-group">
              <label for="customerName">Name:</label>
              <input type="text" id="customerName" placeholder="Your Name" required>
            </div>
            <div class="input-group">
              <label for="customerPhone">Phone Number:</label>
              <input type="text" id="customerPhone" placeholder="Your Phone Number" required>
            </div>
            <div class="input-group">
              <label for="carMakeModel">Car Make and Model?</label>
              <input type="text" id="carMakeModel" placeholder="MERCEDES SUV" required>
            </div>
          </div>
          <div class="total-section">
            <div>
              <span class="total-label">Total (Base + Fee + Add-ons):</span>
              <span class="total-value">$${(calculateTotal() / 100).toFixed(2)}</span>
            </div>
          </div>
          <button class="checkout-btn">Confirm &amp; Checkout</button>
          <button class="checkout-btn book-pay-later-btn">Book now &amp; Pay later</button>
          <br>&nbsp;<br>&nbsp;<br>&nbsp;<br>
        </div>
      `;
      seg3Sidebar.querySelector('.seg3-x').onclick = () => { /* Optional close behavior */ };

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

      // Confirm & Checkout: triggers payment modal.
      seg3Sidebar.querySelector('.checkout-btn:not(.book-pay-later-btn)').onclick = function() {
        const nameInput = document.getElementById("customerName");
        const phoneInput = document.getElementById("customerPhone");
        const carInput = document.getElementById("carMakeModel");
        if (!nameInput.value.trim() || !phoneInput.value.trim() || !carInput.value.trim()) {
          alert("Please fill in your name, phone number, and car make/model.");
          return;
        }
        // Build add-ons prices list.
        const addonPricesText = selectedAddons.map(key => {
          const addon = addons.find(a => a.key === key);
          return addon ? `${addon.name}: $${addon.price.toFixed(2)}` : "";
        }).filter(s => s !== "").join(", ");
        const bookingPriceText = `Booking Price: $${parseFloat(basePrice).toFixed(2)}`;
        pendingBookingData.booking_comment = `${carInput.value.trim()} - ${selectedSeg2Tab} - ${bookingPriceText}${addonPricesText ? " | Addon Prices: " + addonPricesText : ""}`;
        pendingBookingData.customer_first_name = nameInput.value.trim();
        pendingBookingData.customer_phone = phoneInput.value.trim();
        pendingBookingData.amount = fullCharge();
        openSquarePaymentModal();
      };

      // Book now & Pay later: bypasses payment and finalizes booking with a modal popup.
      seg3Sidebar.querySelector('.book-pay-later-btn').onclick = function() {
        if (bookNowPayLaterClicked) return; // prevent multiple submissions
        bookNowPayLaterClicked = true;
        this.disabled = true;
        const nameInput = document.getElementById("customerName");
        const phoneInput = document.getElementById("customerPhone");
        const carInput = document.getElementById("carMakeModel");
        if (!nameInput.value.trim() || !phoneInput.value.trim() || !carInput.value.trim()) {
          alert("Please fill in your name, phone number, and car make/model.");
          bookNowPayLaterClicked = false;
          this.disabled = false;
          return;
        }
        const addonPricesText = selectedAddons.map(key => {
          const addon = addons.find(a => a.key === key);
          return addon ? `${addon.name}: $${addon.price.toFixed(2)}` : "";
        }).filter(s => s !== "").join(", ");
        const bookingPriceText = `Booking Price: $${parseFloat(basePrice).toFixed(2)}`;
        pendingBookingData.booking_comment = `${carInput.value.trim()} - ${selectedSeg2Tab} - ${bookingPriceText}${addonPricesText ? " | Addon Prices: " + addonPricesText : ""}`;
        pendingBookingData.customer_first_name = nameInput.value.trim();
        pendingBookingData.customer_phone = phoneInput.value.trim();
        pendingBookingData.amount = fullCharge();
        finalizeBooking();
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
    ['Basic', 'Premium', 'Detail'].forEach(cat => {
      const container = document.getElementById(`seg2Cards-${cat}`);
      if (!container) return;
      const cards = container.querySelectorAll('.seg2-card');
      cards.forEach(card => {
        const cardTitle = card.getAttribute('data-title');
        const priceDiv = card.querySelector('.seg2-price');
        let price = prices[cat] && prices[cat][selectedSize] && prices[cat][selectedSize][cardTitle];
        priceDiv.textContent = typeof price === 'number' ? `$${price}` : '';
      });
    });
  }

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
      squareModal.querySelector('.square-backdrop').onclick =
      squareModal.querySelector('.square-close-btn').onclick = () => { /* Keep modal open */ };
      const payments = Square.payments(appId, locationId);
      await initializeSquareCard(payments);
      document.getElementById("square-card-button").addEventListener("click", async function () {
        console.log(`Charging $${(pendingBookingData.amount / 100).toFixed(2)}`);
        try {
          const verificationDetails = {
            // Because pendingBookingData.amount is now in cents for testing,
            // we still divide by 100 here for display purposes in the verification details.
            amount: (pendingBookingData.amount / 100).toFixed(2),
            billingContact: {
              givenName: 'Test',
              familyName: 'User',
              email: 'test@example.com',
              phone: '0000000000',
              addressLines: ['123 Test St'],
              city: 'Test City',
              state: 'TS',
              countryCode: 'AU'
            },
            currencyCode: 'AUD',
            intent: 'CHARGE',
            customerInitiated: true,
            sellerKeyedIn: false
          };
          const tokenResult = await card.tokenize(verificationDetails);
          if (tokenResult.status === "OK") {
            const token = tokenResult.token;
            const paymentSuccessful = await createSquarePayment(token, pendingBookingData.amount);
            if (paymentSuccessful) {
              console.log("✅ Payment Successful!");
              document.getElementById("square-payment-status").innerText = "✅ Payment Successful!";
              await finalizeBooking();
            } else {
              console.error("Payment declined. Booking will not be sent.");
              document.getElementById("square-payment-status").innerText = "❌ Payment Declined.";
            }
          } else {
            console.error("Tokenization failed with status:", tokenResult.status);
            document.getElementById("square-payment-status").innerText = "❌ Card Validation Failed!";
          }
        } catch (error) {
          console.error("Payment Error:", error);
          document.getElementById("square-payment-status").innerText = "❌ Payment Error.";
        }
      });
    }
    squareModal.classList.add("show");
  }

  async function createSquarePayment(token, amount) {
    try {
      const paymentResponse = await axios.post("https://connect.squareup.com/v2/payments", {
        source_id: token,
        idempotency_key: Date.now().toString(),
        amount_money: { amount: amount, currency: "AUD" }
      }, {
        headers: {
          "Authorization": `Bearer EAAAl_aH-FzgdiGtcdmHDToKcHyoYaqShKbTV_WwaaI713SYOcbP_w8r002ih2mP`,
          "Content-Type": "application/json"
        }
      });
      const payment = paymentResponse.data.payment;
      console.log(`Payment Successful! Transaction ID: ${payment.id}`);
      return true;
    } catch (error) {
      console.error("Payment Failed:", error.response ? error.response.data : error.message);
      return false;
    }
  }

  // Modified finalizeBooking:
  // If booking was made via "Book now & Pay later", show a success modal,
  // otherwise (e.g. after payment) perform the existing redirect.
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
        if (statusEl) statusEl.innerText = "Booking failed.";
        return;
      }
      const result = await response.json();
      console.log("Booking result from backend:", result);
      if (bookNowPayLaterClicked) {
        showBookingSuccessModal();
      } else {
        window.location.href = "booking-success.html";
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      const statusEl = document.getElementById("status");
      if (statusEl) statusEl.innerText = "Booking failed.";
    }
  }

  // New function to show a small modal popup for booking success.
  function showBookingSuccessModal() {
    const modal = document.createElement('div');
    modal.id = 'bookingSuccessModal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <span class="modal-close" title="Close" tabindex="0">&times;</span>
        <p>Booking Successful!</p>
      </div>
    `;
    document.body.appendChild(modal);
    // Allow closing the modal either by clicking the backdrop or the close button.
    modal.querySelector('.modal-backdrop').onclick = () => { modal.remove(); };
    modal.querySelector('.modal-close').onclick = () => { modal.remove(); };
    // Optional: automatically close after 3 seconds.
    setTimeout(() => modal.remove(), 3000);
  }
});