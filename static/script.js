// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Script is running.');

    const beforeImageUpload = document.getElementById('beforeImageUpload');
    const afterImageUpload = document.getElementById('afterImageUpload');
    const beforeFileNameDisplay = document.getElementById('beforeFileName');
    const afterFileNameDisplay = document.getElementById('afterFileName');
    const requestedTasksInput = document.getElementById('requestedTasks');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const reportOutput = document.getElementById('reportOutput');
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const loadingSpinner = document.getElementById('loading');

    let beforeImageDataURL = null;
    let afterImageDataURL = null;

    // Helper to read file and update display
    function handleImageUpload(event, fileNameDisplay) {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log(`File loaded: ${file.name}, data URL length: ${e.target.result.length}`);
                if (event.target.id === 'beforeImageUpload') {
                    beforeImageDataURL = e.target.result;
                    console.log('beforeImageDataURL set.');
                } else if (event.target.id === 'afterImageUpload') {
                    afterImageDataURL = e.target.result;
                    console.log('afterImageDataURL set.');
                }
            };
            reader.readAsDataURL(file);
        } else {
            fileNameDisplay.textContent = '';
            if (event.target.id === 'beforeImageUpload') {
                beforeImageDataURL = null;
            } else if (event.target.id === 'afterImageUpload') {
                afterImageDataURL = null;
            }
        }
    }

    // Event listeners for file inputs
    beforeImageUpload.addEventListener('change', (e) => handleImageUpload(e, beforeFileNameDisplay));
    afterImageUpload.addEventListener('change', (e) => handleImageUpload(e, afterFileNameDisplay));

    analyzeBtn.addEventListener('click', async () => {
        console.log('Analyze button clicked!');
        console.log('Before image URL status:', beforeImageDataURL ? 'set' : 'NOT SET');
        console.log('After image URL status:', afterImageDataURL ? 'set' : 'NOT SET');
        console.log('Requested tasks length:', requestedTasksInput.value.trim().length);

        if (!beforeImageDataURL || !afterImageDataURL) {
            alert('Please upload both a "Before" and an "After" image.');
            return;
        }
        if (requestedTasksInput.value.trim() === '') {
            alert('Please describe the requested landscaping tasks.');
            return;
        }

        loadingSpinner.style.display = 'block';
        reportOutput.textContent = 'Generating report...'; // Set initial text

        try {
            const response = await fetch('/analyze_landscaping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    before_image: beforeImageDataURL,
                    after_image: afterImageDataURL,
                    requested_tasks: requestedTasksInput.value.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received API Response Data:', data); // CRUCIAL: Log the actual data received

            // This is the line that updates the report output
            reportOutput.textContent = data.report;
            console.log('Attempted to set reportOutput.textContent.');

        } catch (error) {
            console.error('Error during fetch or processing:', error);
            reportOutput.textContent = `Error: ${error.message}`; // Display error in report area
            alert('Failed to generate report: ' + error.message);
        } finally {
            loadingSpinner.style.display = 'none'; // Hide spinner
        }
    });

    downloadReportBtn.addEventListener('click', () => {
        console.log('Download button clicked!');
        if (reportOutput.textContent.trim() === '' || reportOutput.textContent.includes('Error:')) {
            alert('No valid report to download.');
            return;
        }
        const link = document.createElement('a');
        link.download = 'landscaping_report.txt';
        const blob = new Blob([reportOutput.textContent], { type: 'text/plain' });
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    });
});
