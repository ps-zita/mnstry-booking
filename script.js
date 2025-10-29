document.addEventListener('DOMContentLoaded', async function() {
  // Global booking and payment-related state.
  let selectedSize = '';
  let selectedSeg2Tab = 'Basic'; // possible values: "Basic", "Premium", "Detail"
  let selectedSeg2CardTitle = '';
  let pendingBookingData = {};
  let seg3Sidebar = null;
  let squareModal = null;
  let card; // Square card instance.
  let bookNowPayLaterClicked = false; // flag for "Book now & Pay later" button

  const apiKey = '93d2c6d7-1d83-4849-82a0-6407337320a9';
  const services = [{"id":1,"name":"BASIC WASH","description":"Exterior basic hand wash and dry with tyre glow","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":25,"duration":30},{"name":"MEDIUM","price":35,"duration":45},{"name":"LARGE","price":40,"duration":60}],"userId":1,"createdAt":"2025-09-05T20:12:18.082Z","updatedAt":"2025-09-05T20:26:24.622Z"},{"id":2,"name":"PREMIUM INTERIOR","description":"Brush, blow and vacuum all fabrics, leather and plastic trims <br>deep wipe and dressing, clean dash and center console with<br> Basic Exterior wash and dry, Windows and premium air freshener","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":110,"duration":120},{"name":"MEDIUM","price":120,"duration":120},{"name":"LARGE","price":130,"duration":120}],"userId":1,"createdAt":"2025-09-05T20:25:16.727Z","updatedAt":"2025-09-05T20:27:04.429Z"},{"id":3,"name":"PREMIUM MAX","description":"Combined premium interior and exterior and save","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":180,"duration":120},{"name":"MEDIUM","price":190,"duration":120},{"name":"LARGE","price":200,"duration":150}],"userId":1,"createdAt":"2025-09-05T20:29:22.337Z","updatedAt":"2025-09-05T20:29:44.496Z"},{"id":4,"name":"PREMIUM EXTERIOR","description":"Exterior hand wash, clay, hand polish & spray wax, <br>basic interior vacuum and wipe and windows","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":110,"duration":120},{"name":"MEDIUM","price":120,"duration":120},{"name":"LARGE","price":130,"duration":120}],"userId":1,"createdAt":"2025-09-05T20:32:52.154Z","updatedAt":"2025-09-05T20:38:03.067Z"},{"id":5,"name":"CERAMIC COATING","description":"","hasVariants":false,"price":1500,"duration":540,"variants":null,"userId":1,"createdAt":"2025-09-05T20:34:51.424Z","updatedAt":"2025-09-05T20:34:51.424Z"},{"id":6,"name":"FULL DETAIL","description":"Exterior Wash, clay, cut and polish with spray wax finish,<br> wheels and rims, door jambs, Interior fabrics brush, blow and steam clean, <br>all leather and plastic trims shampoo and conditioner, detail the dashboard,<br> center console and air vents, sanitise and odor remover, windows with water repellent.","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":400,"duration":540},{"name":"MEDIUM","price":420,"duration":540},{"name":"LARGE","price":450,"duration":540}],"userId":1,"createdAt":"2025-09-05T20:37:14.277Z","updatedAt":"2025-09-05T20:38:29.527Z"},{"id":7,"name":"INTERIOR DETAIL","description":"Interior Fabrics brush blow vacuum and steam clean,<br> all leather and plastic trims shampoo & conditioner, Detail the dashboard, <br>center console, air vents, sanitisation diffuser and odor remover","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":250,"duration":300},{"name":"MEDIUM","price":270,"duration":300},{"name":"LARGE","price":300,"duration":300}],"userId":1,"createdAt":"2025-09-05T20:40:51.695Z","updatedAt":"2025-09-05T20:41:13.921Z"},{"id":8,"name":"EXTERIOR DETAIL","description":"Hand wash, clay, one stage cut, and polish finished with spray wax and tyre glow","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":300,"duration":300},{"name":"MEDIUM","price":350,"duration":300},{"name":"LARGE","price":400,"duration":300}],"userId":1,"createdAt":"2025-09-05T20:58:10.944Z","updatedAt":"2025-09-05T20:58:10.944Z"},{"id":9,"name":"GOLD WASH","description":"Basic exterior wash and dry with tyre Glow, Interior Basic vacuum and wipe <br> with fresh Windows","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":70,"duration":90},{"name":"MEDIUM","price":75,"duration":90},{"name":"LARGE","price":80,"duration":90}],"userId":1,"createdAt":"2025-09-06T22:42:18.715Z","updatedAt":"2025-09-06T23:19:38.762Z"},{"id":10,"name":"HAND POLISH AND SPRAY","description":"Exterior hand wash clay hand polish and spray sealant with tyre glow","hasVariants":true,"price":null,"duration":null,"variants":[{"name":"SMALL","price":75,"duration":60},{"name":"MEDIUM","price":80,"duration":130},{"name":"LARGE","price":90,"duration":130}],"userId":1,"createdAt":"2025-09-06T23:22:36.405Z","updatedAt":"2025-09-06T23:22:36.405Z"}];
  let customFields = [];

  async function fetchCustomFields() {
    try {
      const response = await fetch('https://api.modulynk.app/api/v1/custom-fields', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      if (response.ok) {
        customFields = await response.json();
        console.log('Custom fields loaded:', customFields);
      } else {
        console.error('Failed to fetch custom fields');
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error);
    }
  }

  await fetchCustomFields();

  // Square configuration parameters.
  const appId = "sq0idp-2UIVBa7RW5RhNJbPp5VAOg";
  const locationId = "FK7Q4N5CDQQH5";

  const addons = [
    { key: "headlight", name: "Headlight Restoration", price: 80 },
    { key: "leather", name: "Leather Treatment", price: 80 },
    { key: "engine", name: "Engine Wash", price: 80 },
    { key: "odour", name: "Odour Removal", price: 60 },
    { key: "sticker", name: "Sticker Removal", price: 50 },
    { key: "scratch", name: "Scratch Removal", price: 50 }
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
      updateCardPrices();
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
      
      const selectedService = services.find(s => s.name.toUpperCase() === selectedSeg2CardTitle.toUpperCase());
      const selectedVariant = selectedService.variants.find(v => v.name === selectedSize);

      pendingBookingData = {
        ...pendingBookingData,
        startTime: reserved_on,
        serviceId: selectedService ? selectedService.id : null,
        price: selectedVariant ? selectedVariant.price : 0,
        duration: selectedVariant ? selectedVariant.duration : 0,
        variants: selectedService ? selectedService.variants : null
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

    const selectedService = services.find(s => s.name.toUpperCase() === seg2Card.toUpperCase());
    let basePrice = 0;
    if (selectedService && selectedService.variants) {
        const selectedVariant = selectedService.variants.find(v => v.name === selectedSize);
        if (selectedVariant) {
            basePrice = selectedVariant.price;
        }
    }

    let selectedAddons = [];
    
    // This function now correctly calculates the total price in cents.
    function calculateTotal() {
      let addonTotal = 0;
      selectedAddons.forEach(key => {
        const addon = addons.find(a => a.key === key);
        if (addon) addonTotal += addon.price;
      });
      const combinedTotal = basePrice + addonTotal;
      const chargeCents = Math.round(combinedTotal * 100);
      const feeCents = Math.round(chargeCents * 0.016);
      return chargeCents + feeCents; // This is the final amount including fees.
    }

    seg3Sidebar = document.createElement('div');
    seg3Sidebar.id = 'seg3Sidebar';
    
    function renderSidebar() {
      // We calculate the total once and use it everywhere.
      const totalAmountCents = calculateTotal();
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
              <span>$${basePrice.toFixed(2)}</span>
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
                  <span class="addon-price">$${addon.price.toFixed(2)}</span>
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
              <span class="total-label">Total (incl. 1.6% fee):</span>
              <span class="total-value">$${(totalAmountCents / 100).toFixed(2)}</span>
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
          renderSidebar(); // Re-render to update the total price
        };
      });

      // Confirm & Checkout: triggers payment modal.
      seg3Sidebar.querySelector('.checkout-btn:not(.book-pay-later-btn)').onclick = async function() {
        const nameInput = document.getElementById("customerName");
        const phoneInput = document.getElementById("customerPhone");
        const carInput = document.getElementById("carMakeModel");
        if (!nameInput.value.trim() || !phoneInput.value.trim() || !carInput.value.trim()) {
          alert("Please fill in your name, phone number, and car make/model.");
          return;
        }
      pendingBookingData.customerName = nameInput.value.trim();
      pendingBookingData.customerPhone = phoneInput.value.trim();
      pendingBookingData.carMakeModel = carInput.value.trim();
      pendingBookingData.amount = calculateTotal();
        openSquarePaymentModal();
      };

      // Book now & Pay later: bypasses payment and finalizes booking.
      seg3Sidebar.querySelector('.book-pay-later-btn').onclick = async function() {
        if (bookNowPayLaterClicked) return;
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
      pendingBookingData.customerName = nameInput.value.trim();
      pendingBookingData.customerPhone = phoneInput.value.trim();
      pendingBookingData.carMakeModel = carInput.value.trim();
      pendingBookingData.amount = calculateTotal();
        await finalizeBooking();
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
        const service = services.find(s => s.name.toUpperCase() === cardTitle.toUpperCase());
        let price;
        if (service && service.variants) {
            const selectedVariant = service.variants.find(v => v.name === selectedSize);
            if (selectedVariant) {
                price = selectedVariant.price;
            }
        }
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
        console.log(`Charging ${(pendingBookingData.amount / 100).toFixed(2)}`);
        try {
          const verificationDetails = {
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
      const response = await fetch('https://mnstry.duckdns.org:3001/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nonce: token,
          amount: amount,
          bookingId: Date.now().toString()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`Payment Successful! Transaction ID: ${result.transactionId}`);
        return true;
      } else {
        console.error("Payment Failed:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Payment Failed:", error);
      return false;
    }
  }

  // Robust formatter for a variety of date inputs
  function formatDateTime(input) {
    if (!input && input !== 0) return '';
    // Date instance
    if (input instanceof Date && !isNaN(input)) {
      return input.toLocaleString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    const s = String(input).trim();
    // numeric (unix seconds or ms)
    if (/^\d+$/.test(s)) {
      let n = Number(s);
      if (s.length === 10) n *= 1000; // seconds -> ms
      const d = new Date(n);
      if (!isNaN(d)) return formatDateTime(d);
    }
    // try ISO parse or other parseable string
    const d = new Date(s);
    if (!isNaN(d)) return formatDateTime(d);
    // fallback: return original string
    return s;
  }

  async function finalizeBooking() {
    console.log("Finalizing booking with data:", pendingBookingData);
    try {
      // Find or create client
      let client;
      const clientResponse = await fetch(`https://api.modulynk.app/api/v1/clients?phone=${pendingBookingData.customerPhone}`, {
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (clientResponse.ok) {
        client = await clientResponse.json();
      } else if (clientResponse.status === 404) {
        const [firstName, ...lastName] = pendingBookingData.customerName.split(' ');
        const newClientResponse = await fetch('https://api.modulynk.app/api/v1/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify({
            firstName: firstName,
            lastName: lastName.join(' '),
            phone: pendingBookingData.customerPhone
          })
        });
        if (newClientResponse.ok) {
          client = await newClientResponse.json();
        } else {
          throw new Error('Failed to create client');
        }
      } else {
        throw new Error('Failed to find client');
      }

      const startTime = new Date(pendingBookingData.startTime);
      const endTime = new Date(startTime.getTime() + pendingBookingData.duration * 60000);

      const bookingBody = {
        serviceId: pendingBookingData.serviceId,
        startTime: pendingBookingData.startTime,
        endTime: endTime.toISOString(),
        price: (basePrice + selectedAddons.reduce((acc, key) => acc + addons.find(a => a.key === key).price, 0)).toFixed(2),
        status: 'confirmed',
        clientId: client.id,
        customFields: []
      };

      const carMakeModelField = customFields.find(f => f.title === 'CAR MAKE/MODEL');
      if (carMakeModelField) {
        bookingBody.customFields.push({
          title: 'CAR MAKE/MODEL',
          value: pendingBookingData.carMakeModel
        });
      }

      if (selectedAddons.length > 0) {
        bookingBody.customFields.push({
          title: 'Add-ons',
          value: selectedAddons.map(key => addons.find(a => a.key === key).name).join(', ')
        });
      }

      const response = await fetch("https://api.modulynk.app/api/v1/bookings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-API-Key': apiKey
        },
        body: JSON.stringify(bookingBody)
      });

      let result = {};
      if (response.ok) {
        result = await response.json();
        console.log("Booking result from backend:", result);

        // Send SMS confirmation
        const bookingDate = new Date(pendingBookingData.startTime).toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' });
        const bookingTime = new Date(pendingBookingData.startTime).toLocaleTimeString('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit' });
        const smsMessage = `Hi ${pendingBookingData.customerName}! your ${selectedSeg2CardTitle} has been confirmed for ${bookingTime} on ${bookingDate} at 473A Centre RD, Bentleigh.`;

        fetch("https://api.modulynk.app/api/v1/sms/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'X-API-Key': apiKey
          },
          body: JSON.stringify({
            phone: pendingBookingData.customerPhone,
            message: smsMessage
          })
        }).catch(error => console.error('Error sending SMS:', error));

      } else {
        const errText = await response.text().catch(()=>'<no body>');
        console.error("Error response from backend:", response.status, errText);
        alert("Booking failed. See console for details.");
      }

      // extract possible fields (be tolerant to different shapes)
      const checkInRaw = result.startTime;
      const checkOutRaw = result.endTime;

      const checkIn = formatDateTime(checkInRaw) || '—';
      const checkOut = formatDateTime(checkOutRaw) || '—';

      const bookingRef = result.id;
      const guestName = `${client.firstName} ${client.lastName}`;
      const totalPaid = (typeof result.price === 'number')
        ? `${result.price.toFixed(2)}`
        : 'TBD';
      const statusText = result.status || 'Confirmed';

      // populate modal fields safely
      const bmGuest = document.getElementById("bmGuest");
      const bmCheckIn = document.getElementById("bmCheckIn");
      const bmCheckOut = document.getElementById("bmCheckOut");
      const bmTotal = document.getElementById("bmTotal");
      const bmStatus = document.getElementById("bmStatus");
      const bmSub = document.getElementById("bm-sub");

      if (bmGuest) bmGuest.textContent = guestName;
      if (bmCheckIn) bmCheckIn.textContent = checkIn;
      if (bmCheckOut) bmCheckOut.textContent = checkOut;
      if (bmTotal) bmTotal.textContent = totalPaid;
      if (bmStatus) {
        bmStatus.textContent = statusText;
        bmStatus.style.color = statusText.toLowerCase() === 'confirmed' ? 'var(--success,#16a34a)' : '#d97706';
      }
      if (bmSub) bmSub.textContent = 'We’ve sent a confirmation to your number. If you need to make changes, contact support below.';

      // show modal (script already expects .visible + aria-hidden toggle)
      const bookingModal = document.getElementById("bookingModal");
      if (bookingModal) {
        bookingModal.setAttribute("aria-hidden", "false");
        bookingModal.classList.add("visible");
        document.body.style.overflow = "hidden";
        (document.getElementById("bmClosePrimary") || document.getElementById("bmClose") )?.focus();
      }

      // wire minimal actions (Done closes)
      document.getElementById("bmClosePrimary")?.addEventListener("click", () => {
        bookingModal?.setAttribute("aria-hidden", "true");
        bookingModal?.classList.remove("visible");
        document.body.style.overflow = "";
      });

    } catch (error) {
      console.error("Error creating booking:", error);
      // Chromium often throws TypeError "Failed to fetch" for CORS / mixed-content / TLS issues
      if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
        alert("Network error (failed to fetch). Check devtools Console/Network for CORS or TLS/mixed-content issues. Firefox may be more permissive than Chromium.");
        console.warn("Hints: verify server TLS certificate, ensure HTTPS endpoint, enable CORS on server, or open the endpoint directly in a tab to inspect the cert.");
      } else {
        alert("Booking failed: " + (error.message || "unknown error"));
      }
    }
  }

  // Booking modal integration — safe when some elements removed
  (function(){
    const modal = document.getElementById('bookingModal');
    if(!modal) return;

    const overlay = document.getElementById('bmOverlay');
    const closeBtn = document.getElementById('bmClose');
    const closePrimary = document.getElementById('bmClosePrimary');

    function populate(details = {}) {
      // expected shape: { guest, checkIn, checkOut, total, status, subtext }
      const guestEl = document.getElementById('bmGuest');
      const checkInEl = document.getElementById('bmCheckIn');
      const checkOutEl = document.getElementById('bmCheckOut');
      const totalEl = document.getElementById('bmTotal');
      const statusEl = document.getElementById('bmStatus');
      const subEl = document.getElementById('bm-sub');

      if (guestEl) guestEl.textContent = details.guest || guestEl.textContent || '—';
      if (checkInEl) checkInEl.textContent = details.checkIn || checkInEl.textContent || '—';
      if (checkOutEl) checkOutEl.textContent = details.checkOut || checkOutEl.textContent || '—';
      if (totalEl) totalEl.textContent = details.total || totalEl.textContent || '—';
      if (statusEl) statusEl.textContent = details.status || statusEl.textContent || 'Confirmed';
      if (subEl) subEl.textContent = details.subtext || 'We’ve sent a confirmation to your number. If you need to make changes, contact support below.';
    }

    function show(details){
      populate(details);
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('visible');
      document.body.style.overflow = 'hidden';
      // focus the primary close button for accessibility
      (closePrimary || closeBtn)?.focus();
    }

    function hide(){
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('visible');
      document.body.style.overflow = '';
    }

    overlay?.addEventListener('click', hide);
    closeBtn?.addEventListener('click', hide);
    closePrimary?.addEventListener('click', hide);
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') hide(); });

    // Expose functions and listen for event
    window.showBookingModal = show;
    window.hideBookingModal = hide;
    document.addEventListener('booking:complete', (e) => { show(e.detail || {}); });
  })();
});
