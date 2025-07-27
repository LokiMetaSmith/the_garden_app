document.addEventListener('DOMContentLoaded', () => {
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

    function handleImageUpload(event, fileNameDisplay) {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                if (event.target.id === 'beforeImageUpload') {
                    beforeImageDataURL = e.target.result;
                } else if (event.target.id === 'afterImageUpload') {
                    afterImageDataURL = e.target.result;
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

    beforeImageUpload.addEventListener('change', (e) => handleImageUpload(e, beforeFileNameDisplay));
    afterImageUpload.addEventListener('change', (e) => handleImageUpload(e, afterFileNameDisplay));

    analyzeBtn.addEventListener('click', async () => {
        if (!beforeImageDataURL || !afterImageDataURL) {
            alert('Please upload both a "Before" and an "After" image.');
            return;
        }
        if (requestedTasksInput.value.trim() === '') {
            alert('Please describe the requested landscaping tasks.');
            return;
        }

        loadingSpinner.style.display = 'block';
        reportOutput.textContent = 'Generating report...';

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
            reportOutput.textContent = data.report;

        } catch (error) {
            console.error('Error during landscaping analysis:', error);
            reportOutput.textContent = `Error: ${error.message}`;
            alert('Failed to generate report: ' + error.message);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    downloadReportBtn.addEventListener('click', () => {
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
