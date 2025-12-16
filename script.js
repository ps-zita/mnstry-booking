document.addEventListener('DOMContentLoaded', () => {
    // --- DATA ---
    const services = {
        "Basic": [
            { id: 1, title: "Basic wash", description: "A basic exterior hand wash and dry, complete with tyre glow.", prices: { SMALL: 25, MEDIUM: 35, LARGE: 40 }, duration: 30 },
            { id: 2, title: "Gold wash", description: "Combines our basic exterior wash with an interior vacuum, wipe-down, and window cleaning.", prices: { SMALL: 50, MEDIUM: 60, LARGE: 70 }, duration: 60 }
        ],
        "Premium": [
            { id: 3, title: "Premium interior", description: "A deep interior clean: all fabrics are brushed, blown, and vacuumed, while trims, dash, and console get a deep wipe and dressing.", prices: { SMALL: 110, MEDIUM: 120, LARGE: 130 }, duration: 120 },
            { id: 4, title: "Premium exterior", description: "A professional exterior hand wash, clay bar treatment, hand polish, and spray wax.", prices: { SMALL: 110, MEDIUM: 120, LARGE: 130 }, duration: 120 },
            { id: 5, title: "Premium max", description: "The ultimate package, combining our Premium Interior and Premium Exterior services for a complete vehicle transformation.", prices: { SMALL: 180, MEDIUM: 190, LARGE: 200 }, duration: 180 }
        ],
        "Detail": [
            { id: 6, title: "Interior detail", description: "Meticulous interior detailing. Fabrics are brushed, blown, vacuumed, and steam cleaned. All leather and plastic trims are shampooed and conditioned.", prices: { SMALL: 250, MEDIUM: 280, LARGE: 320 }, duration: 240 },
            { id: 7, title: "Exterior detail", description: "Focuses on perfecting your vehicle's paint. Includes a hand wash, clay bar treatment, machine cut and polish with a spray wax finish.", prices: { SMALL: 250, MEDIUM: 280, LARGE: 320 }, special_time: '09:00', duration: 240 },
            { id: 8, title: "Full detail", description: "Our most comprehensive service. Combines a full exterior cut and polish with a deep interior steam clean and conditioning.", prices: { SMALL: 450, MEDIUM: 500, LARGE: 550 }, special_time: '09:00', duration: 480 }
        ]
    };

    // --- STATE ---
    let selectedSize = null;
    let selectedService = null;
    let selectedDateTime = null;
    let currentServiceTab = "Basic";
    let currentStep = 1;

    // --- DOM ELEMENTS ---
    const vehicleCards = document.querySelectorAll('.vehicle-cards .card');
    const serviceTabs = document.querySelectorAll('.service-tab');
    const serviceCardsContainer = document.querySelector('.service-cards');
    const steps = document.querySelectorAll('.step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const navButtons = document.querySelectorAll('.nav-button');
    const bookNowBtn = document.getElementById('book-now-btn');
    const bookingDateInput = document.getElementById('booking-date');
    const timeSlotsContainer = document.getElementById('time-slots');

    // --- FUNCTIONS ---
    async function apiFetch(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true',
            ...options.headers 
        };
        const response = await fetch(`https://cia-chen-memory-lined.trycloudflare.com/api${endpoint}`, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `API request failed: ${response.statusText}`);
        }
        return response.json();
    }

    async function findOrCreateClient(name, phone) {
        try {
            // Try to find existing client by phone number
            try {
                const existingClients = await apiFetch(`/clients?phone=${encodeURIComponent(phone)}`);
                if (Array.isArray(existingClients) && existingClients.length > 0) {
                    return existingClients[0]; // Return first matching client
                }
            } catch (findError) {
                if (findError.message.includes('404')) {
                    // continue to create
                } else {
                    console.warn("Could not find existing client:", findError);
                }
            }

            // If not found, create new client
            const [firstName, ...lastNameParts] = name.split(' ');
            const lastName = lastNameParts.join(' ');
            const newClient = await apiFetch('/clients', {
                method: 'POST',
                body: JSON.stringify({ firstName, lastName, phone })
            });

            return newClient;
        } catch (error) {
            console.error("Error finding or creating client:", error);
            throw error;
        }
    }

    function showStep(stepNumber) {
        steps.forEach((step, index) => {
            step.classList.toggle('step--active', index + 1 === stepNumber);
        });
        progressSteps.forEach((progressStep, index) => {
            progressStep.classList.toggle('active', index + 1 <= stepNumber);
        });
        currentStep = stepNumber;
    }

    function renderServiceCards() {
        serviceCardsContainer.innerHTML = '';
        const servicesForTab = services[currentServiceTab];
        servicesForTab.forEach(service => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.serviceId = service.id;
            const price = selectedSize ? `$${service.prices[selectedSize]}` : 'Select Size';
            card.innerHTML = `
                <div class="card-header">
                    <h3>${service.title}</h3>
                    <span class="price">${price}</span>
                </div>
                <p>${service.description}</p>
            `;
            card.addEventListener('click', () => {
                selectedService = service;
                document.querySelectorAll('.service-cards .card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                updateSummary();
                renderTimeSlots();
                showStep(3);
            });
            serviceCardsContainer.appendChild(card);
        });
    }

    function renderTimeSlots() {
        if (!selectedService || !bookingDateInput.value) {
            timeSlotsContainer.innerHTML = '<p>Please select a service and a date.</p>';
            return;
        }

        timeSlotsContainer.innerHTML = '';
        const selectedDate = new Date(bookingDateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0,0,0,0);

        let startHour = 8;
        const endHour = 17;

        if (selectedDate.getTime() === today.getTime()) {
            const currentHour = new Date().getHours();
            if (currentHour + 1 > startHour) {
                startHour = currentHour + 1;
            }
        }
        
        if (startHour > endHour) {
             timeSlotsContainer.innerHTML = '<p>No more available slots for today.</p>';
             return;
        }

        if (selectedService.special_time) {
            const [hour, minute] = selectedService.special_time.split(':');
            if (parseInt(hour) >= startHour && parseInt(hour) <= endHour) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = '9:00 AM';
                timeSlot.dataset.time = selectedService.special_time;
                timeSlot.addEventListener('click', () => handleTimeSelection(timeSlot));
                timeSlotsContainer.appendChild(timeSlot);
            } else {
                 timeSlotsContainer.innerHTML = '<p>This service is not available for the selected date.</p>';
            }
        } else {
            for (let hour = startHour; hour <= endHour; hour++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                const ampm = hour < 12 ? 'AM' : 'PM';
                let displayHour = hour % 12;
                if(displayHour === 0) displayHour = 12;
                timeSlot.textContent = `${displayHour}:00 ${ampm}`;
                timeSlot.dataset.time = `${String(hour).padStart(2, '0')}:00`;
                timeSlot.addEventListener('click', () => handleTimeSelection(timeSlot));
                timeSlotsContainer.appendChild(timeSlot);
            }
        }
        if(timeSlotsContainer.children.length === 0) {
            timeSlotsContainer.innerHTML = '<p>No available time slots for the selected date.</p>';
        }
    }
    
    function handleTimeSelection(timeSlotElement) {
        selectedDateTime = `${bookingDateInput.value}T${timeSlotElement.dataset.time}`;
        document.querySelectorAll('.time-slot').forEach(ts => ts.classList.remove('selected'));
        timeSlotElement.classList.add('selected');
        updateSummary();
        showStep(4);
    }

    function updateSummary() {
        if (selectedSize && selectedService) {
            document.getElementById('summary-size').textContent = selectedSize;
            document.getElementById('summary-service').textContent = selectedService.title;
            document.getElementById('summary-price').textContent = `$${selectedService.prices[selectedSize]}`;
            if (selectedDateTime) {
                document.getElementById('summary-datetime').textContent = new Date(selectedDateTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
            }
        }
    }

    // --- EVENT LISTENERS ---
    vehicleCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedSize = card.dataset.size;
            vehicleCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            renderServiceCards();
            showStep(2);
        });
    });

    serviceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentServiceTab = tab.dataset.tab;
            serviceTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderServiceCards();
        });
    });

    bookingDateInput.addEventListener('change', () => {
        renderTimeSlots();
    });

    navButtons.forEach(button => {
        if (button.classList.contains('prev-button')) {
            button.addEventListener('click', () => {
                const prevStep = parseInt(button.dataset.prevStep, 10);
                showStep(prevStep);
            });
        }
    });

    bookNowBtn.addEventListener('click', async () => {
        const name = document.getElementById('user-name').value;
        const phone = document.getElementById('user-phone').value;
        const car = document.getElementById('user-car').value;
        if(!name || !phone || !car || !selectedService || !selectedDateTime) {
            alert('Please fill in all your details and make a selection.');
            return;
        }

        try {
            const client = await findOrCreateClient(name, phone);
            
            const startTime = new Date(selectedDateTime);
            const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

            const bookingData = {
                serviceId: selectedService.id,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                clientId: client.id,
                customFields: [{ title: "CAR MAKE/MODEL", value: car }]
            };

            await apiFetch('/request-booking', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });

            showStep(5);
        } catch (error) {
            console.error("Booking failed:", error);
            alert("Sorry, we couldn't process your booking request. Please try again later. " + error.message);
        }
    });

    // --- INITIAL RENDER ---
    function init() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        bookingDateInput.value = `${yyyy}-${mm}-${dd}`;
        bookingDateInput.min = `${yyyy}-${mm}-${dd}`;

        showStep(1);
        renderServiceCards();
    }

    init();
});
