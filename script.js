function updateSummary(date) {
    // Format date to day-month
    let options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    let formattedDate = new Date(date).toLocaleDateString('en-GB', options);
    // Assuming SMS logic goes here
    return `Date: ${formattedDate}`;
}