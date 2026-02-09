function updateSummary() {
        if (selectedSize && selectedService) {
            document.getElementById('summary-size').textContent = selectedSize;
            document.getElementById('summary-service').textContent = selectedService.title;
            document.getElementById('summary-price').textContent = `$${selectedService.prices[selectedSize]}`;
            if (selectedDateTime) {
                const date = new Date(selectedDateTime);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const weekday = date.toLocaleString('en-US', { weekday: 'short' });
                const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
                document.getElementById('summary-datetime').textContent = `${weekday} ${day}-${month} ${time}`;
            }
        }
    }


// Other existing code...
