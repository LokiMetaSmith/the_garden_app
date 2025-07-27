// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Script is running.');

    const beforeImageUpload = document.getElementById('beforeImageUpload');
    const afterImageUpload = document.getElementById('afterImageUpload');
    const beforeFileNameDisplay = document.getElementById('beforeFileName');
    const afterFileNameDisplay = document.getElementById('afterFileName');
    const newTaskInput = document.getElementById('newTaskInput'); // NEW
    const addTaskBtn = document.getElementById('addTaskBtn');     // NEW
    const taskList = document.getElementById('taskList');         // NEW
    const contractorAccomplishmentsInput = document.getElementById('contractorAccomplishments'); // NEW
    const analyzeBtn = document.getElementById('analyzeBtn');
    const reportOutput = document.getElementById('reportOutput');
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const downloadBeforeTasksBtn = document.getElementById('downloadBeforeTasksBtn');

    let beforeImageDataURL = null;
    let afterImageDataURL = null;
    let storedBeforeAnalysisText = null;
    let storedOriginalTasksText = null;
    let tasks = []; // NEW: Array to store the tasks


    // --- Task List Management Functions ---
    const renderTasks = () => {
        taskList.innerHTML = ''; // Clear current list
        if (tasks.length === 0) {
            taskList.innerHTML = '<li style="color: #888; text-align: center;">No tasks added yet.</li>';
            return;
        }
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${task}</span>
                <button class="remove-task-btn" data-index="${index}">&times;</button>
            `;
            taskList.appendChild(li);
        });

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-task-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.target.dataset.index);
                tasks.splice(indexToRemove, 1); // Remove task from array
                renderTasks(); // Re-render the list
            });
        });
    };

    addTaskBtn.addEventListener('click', () => {
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            tasks.push(taskText);
            newTaskInput.value = ''; // Clear input field
            renderTasks(); // Update the displayed list
        } else {
            alert('Please enter a task description.');
        }
    });

    // Allow adding tasks by pressing Enter in the input field
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if any
            addTaskBtn.click(); // Simulate button click
        }
    });

    // Initial render of tasks (will show "No tasks added yet.")
    renderTasks();

    // --- Image Upload Handling (Same as before) ---
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

    beforeImageUpload.addEventListener('change', (e) => handleImageUpload(e, beforeFileNameDisplay));
    afterImageUpload.addEventListener('change', (e) => handleImageUpload(e, afterFileNameDisplay));

    // --- Main Analyze Button Logic ---
    analyzeBtn.addEventListener('click', async () => {
        console.log('Analyze button clicked!');
        console.log('Before image URL status:', beforeImageDataURL ? 'set' : 'NOT SET');
        console.log('After image URL status:', afterImageDataURL ? 'set' : 'NOT SET');
        console.log('Tasks:', tasks); // Log the collected tasks
        console.log('Contractor Accomplishments length:', contractorAccomplishmentsInput.value.trim().length);

        if (!beforeImageDataURL || !afterImageDataURL) {
            alert('Please upload both a "Before" and an "After" image.');
            return;
        }
        if (tasks.length === 0) { // Check the tasks array
            alert('Please add at least one landscaping task.');
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
                    requested_tasks: tasks.join('\n'), // Send tasks as a single string, newline separated
                    contractor_accomplishments: contractorAccomplishmentsInput.value.trim() // NEW FIELD
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received API Response Data:', data);

            storedBeforeAnalysisText = data.before_analysis_text;
            storedOriginalTasksText = data.original_tasks_text;

            reportOutput.textContent = data.report;
            console.log('Attempted to set reportOutput.textContent.');

        } catch (error) {
            console.error('Error during fetch or processing:', error);
            reportOutput.textContent = `Error: ${error.message}`;
            alert('Failed to generate report: ' + error.message);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // --- Download Buttons (Same as before, with updated filename for full report) ---
    downloadReportBtn.addEventListener('click', () => {
        console.log('Download Full Report button clicked!');
        if (reportOutput.textContent.trim() === '' || reportOutput.textContent.includes('Error:')) {
            alert('No valid report to download.');
            return;
        }
        const link = document.createElement('a');
        link.download = 'landscaping_full_report.txt';
        const blob = new Blob([reportOutput.textContent], { type: 'text/plain' });
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    });

    downloadBeforeTasksBtn.addEventListener('click', () => {
        console.log('Download Before Analysis & Tasks button clicked!');
        if (!storedBeforeAnalysisText || !storedOriginalTasksText) {
            alert('Please generate a report first to get the before analysis and tasks.');
            return;
        }

        const combinedText = `--- Before Image Analysis ---\n\n${storedBeforeAnalysisText}\n\n` +
                             `--- Original Requested Tasks ---\n\n${storedOriginalTasksText}\n`;

        const link = document.createElement('a');
        link.download = 'landscaping_before_tasks_summary.txt';
        const blob = new Blob([combinedText], { type: 'text/plain' });
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    });
});
