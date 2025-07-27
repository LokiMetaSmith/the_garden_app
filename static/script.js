// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Script is running.');

    const beforeImageUpload = document.getElementById('beforeImageUpload');
    const afterImageUpload = document.getElementById('afterImageUpload');
    const beforeFileNameDisplay = document.getElementById('beforeFileName');
    const afterFileNameDisplay = document.getElementById('afterFileName');
    const newTaskInput = document.getElementById('newTaskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const suggestTasksBtn = document.getElementById('suggestTasksBtn'); // NEW
    const taskList = document.getElementById('taskList');
    const contractorAccomplishmentsInput = document.getElementById('contractorAccomplishments');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const reportOutput = document.getElementById('reportOutput');
    const downloadBidBtn = document.getElementById('downloadBidBtn'); // RENAMED
    const loadingSpinner = document.getElementById('loading');

    // Chat elements
    const chatHistory = document.getElementById('chatHistory');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatLoadingSpinner = document.getElementById('chatLoading');

    // Block 2 elements
    const completedTaskList = document.getElementById('completedTaskList'); // NEW
    const finalizeWorkBtn = document.getElementById('finalizeWorkBtn');   // NEW
    
    // Block 3 elements
    const finalReportOutput = document.getElementById('finalReportOutput'); // NEW
    const downloadFinalReportBtn = document.getElementById('downloadFinalReportBtn'); // NEW


    let beforeImageDataURL = null;
    let afterImageDataURLs = []; // Array for multiple images
    let requestedTasks = [];     // Array to store tasks
    let storedBeforeAnalysisText = null;
    let storedOriginalTasksText = null; // Store tasks as a raw string for BID download
    let currentReport = null; // Store the last generated full report for chat context
    let chatConversationHistory = []; // Store chat messages for context


    // --- Image Upload Handlers ---
    function handleImageUpload(event, fileNameDisplay) {
        const files = event.target.files;
        if (files.length > 0) {
            let names = [];
            let dataURLs = [];
            let filesProcessed = 0; // Counter for async reads

            // Clear previous image data if it's a new selection
            if (event.target.id === 'beforeImageUpload') {
                beforeImageDataURL = null;
            } else if (event.target.id === 'afterImageUpload') {
                afterImageDataURLs = [];
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                names.push(file.name);
                const reader = new FileReader();
                reader.onload = (e) => {
                    dataURLs.push(e.target.result);
                    filesProcessed++;
                    // Only assign when all files are read to ensure completeness
                    if (filesProcessed === files.length) {
                        if (event.target.id === 'beforeImageUpload') {
                            beforeImageDataURL = dataURLs[0]; // Only take the first for 'before'
                            console.log('beforeImageDataURL set:', file.name);
                        } else if (event.target.id === 'afterImageUpload') {
                            afterImageDataURLs = dataURLs; // Store all after images
                            console.log('afterImageDataURLs set:', names.join(', '));
                            // Also update completedTaskList for Block 2 if it's relevant
                            updateCompletedTaskList();
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
            fileNameDisplay.textContent = names.join(', ');
            console.log(`Selected files for ${event.target.id}: ${names.join(', ')}`);
        } else {
            fileNameDisplay.textContent = 'No files chosen';
            if (event.target.id === 'beforeImageUpload') {
                beforeImageDataURL = null;
            } else if (event.target.id === 'afterImageUpload') {
                afterImageDataURLs = [];
            }
        }
    }

    beforeImageUpload.addEventListener('change', (e) => handleImageUpload(e, beforeFileNameDisplay));
    afterImageUpload.addEventListener('change', (e) => handleImageUpload(e, afterFileNameDisplay));


    // --- Task List Management ---
    addTaskBtn.addEventListener('click', () => {
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            requestedTasks.push(taskText);
            renderTaskList();
            newTaskInput.value = ''; // Clear input
            updateCompletedTaskList(); // Update Block 2's list
        } else {
            alert('Please enter a task.');
        }
    });

    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskBtn.click();
        }
    });

    function renderTaskList() {
        taskList.innerHTML = ''; // Clear existing list
        if (requestedTasks.length === 0) {
            const hint = document.createElement('p');
            hint.textContent = 'No tasks added yet. Use "Add Task" or "Suggest Tasks".';
            hint.className = 'hint-small';
            taskList.appendChild(hint);
        } else {
            requestedTasks.forEach((task, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = task;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'x';
                removeBtn.className = 'remove-task-btn';
                removeBtn.onclick = () => {
                    requestedTasks.splice(index, 1); // Remove task from array
                    renderTaskList(); // Re-render list
                    updateCompletedTaskList(); // Update Block 2's list
                };
                listItem.appendChild(removeBtn);
                taskList.appendChild(listItem);
            });
        }
    }

    // Initialize the task list
    renderTaskList();


    // --- Suggest Tasks Functionality (NEW) ---
    suggestTasksBtn.addEventListener('click', async () => {
        console.log('Suggest Tasks button clicked!');
        if (!beforeImageDataURL) {
            alert('Please upload a "Before" image first to get task suggestions.');
            return;
        }

        loadingSpinner.style.display = 'block';
        reportOutput.textContent = 'Generating task suggestions...';
        chatInput.disabled = true; // Disable chat during suggestion generation
        sendChatBtn.disabled = true;

        try {
            const response = await fetch('/suggest_tasks', { // NEW ENDPOINT
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ before_image: beforeImageDataURL })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received Suggested Tasks:', data.suggested_tasks);

            // Populate suggested tasks into the requestedTasks array
            const suggestedTasksArray = data.suggested_tasks.split('\n')
                                        .map(task => task.trim())
                                        .filter(task => task.length > 0 && task.startsWith('- ')); // Filter out empty lines and ensure bullet format

            suggestedTasksArray.forEach(task => {
                // Remove the bullet point before adding to our internal array
                requestedTasks.push(task.substring(2)); 
            });
            renderTaskList(); // Re-render the UI list
            updateCompletedTaskList(); // Update Block 2's list

            reportOutput.textContent = 'Task suggestions generated and added to your list. Review and click "Analyze & Generate Initial Report".';
            
            // Re-enable chat after suggestion generation
            chatInput.disabled = false;
            sendChatBtn.disabled = false;
            // Initialize chat history for this interaction
            chatHistory.innerHTML = '<div class="ai-message">Hi! I can answer questions about your landscaping project. Start by suggesting tasks or analyzing your images.</div>';
            chatConversationHistory = [{ role: 'ai', message: 'Hi! I can answer questions about your landscaping project. Start by suggesting tasks or analyzing your images.' }];


        } catch (error) {
            console.error('Error suggesting tasks:', error);
            reportOutput.textContent = `Error suggesting tasks: ${error.message}`;
            alert('Failed to suggest tasks: ' + error.message);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });


    // --- Main Analysis Button (Block 1 Trigger for Report) ---
    analyzeBtn.addEventListener('click', async () => {
        console.log('Analyze button clicked!');
        
        if (!beforeImageDataURL || afterImageDataURLs.length === 0) { // Still needs an 'after' image for the report, even if it's the first step
            alert('Please upload both a "Before" and at least one "After" image.');
            return;
        }
        if (requestedTasks.length === 0) {
            alert('Please add some requested landscaping tasks.');
            return;
        }

        loadingSpinner.style.display = 'block';
        reportOutput.textContent = 'Generating initial project report...';
        chatInput.disabled = true; // Disable chat during main report generation
        sendChatBtn.disabled = true;

        try {
            const response = await fetch('/analyze_landscaping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    before_image: beforeImageDataURL,
                    // Send only the first after image for the main analysis due to API limitation
                    after_image: afterImageDataURLs[0], 
                    requested_tasks: requestedTasks.join('\n'), // Join tasks into a single string for backend
                    contractor_accomplishments: contractorAccomplishmentsInput.value.trim() 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received API Response Data:', data);

            storedBeforeAnalysisText = data.before_analysis_text;
            storedOriginalTasksText = data.original_tasks_text; // Use the text returned from backend
            currentReport = data.report; 

            reportOutput.textContent = data.report;
            console.log('Attempted to set reportOutput.textContent.');

            // Enable chat after successful report generation
            chatInput.disabled = false;
            sendChatBtn.disabled = false;
            chatHistory.innerHTML = '<div class="ai-message">Hi! I can answer questions about your landscaping project once you\'ve generated the initial report.</div>';
            chatConversationHistory = [{ role: 'ai', message: 'Hi! I can answer questions about your landscaping project once you\'ve generated the initial report.' }];

        } catch (error) {
            console.error('Error during fetch or processing:', error);
            reportOutput.textContent = `Error: ${error.message}`;
            alert('Failed to generate report: ' + error.message);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // --- Download Buttons ---
    downloadBidBtn.addEventListener('click', () => { // RENAMED
        console.log('Download Bid & Analysis button clicked!');
        if (!storedBeforeAnalysisText || !storedOriginalTasksText) {
            alert('Please generate an initial report or tasks first.');
            return;
        }

        const combinedText = `--- Landscaping Project Bid & Initial Analysis ---\n\n` +
                             `**Generated on: ${new Date().toLocaleString()}**\n\n` +
                             `### Before Image Analysis (Current State)\n\n${storedBeforeAnalysisText}\n\n` +
                             `### Original Requested Tasks\n\n${storedOriginalTasksText}\n\n` +
                             `This document outlines the initial state and requested tasks for bidding purposes.`;

        const link = document.createElement('a');
        link.download = 'landscaping_bid_analysis.txt'; // Changed filename
        const blob = new Blob([combinedText], { type: 'text/plain' });
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    });

    // --- Block 2 Logic ---
    function updateCompletedTaskList() {
        completedTaskList.innerHTML = '';
        if (requestedTasks.length === 0) {
            const hint = document.createElement('p');
            hint.textContent = 'Add tasks in Block 1 first.';
            hint.className = 'hint-small';
            completedTaskList.appendChild(hint);
        } else {
            requestedTasks.forEach((task, index) => {
                const listItem = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `task-${index}`;
                checkbox.value = task;
                checkbox.className = 'task-checkbox'; // Add class for styling if needed

                const label = document.createElement('label');
                label.htmlFor = `task-${index}`;
                label.textContent = task;

                listItem.appendChild(checkbox);
                listItem.appendChild(label);
                completedTaskList.appendChild(listItem);
            });
        }
    }

    // Initialize completed task list
    updateCompletedTaskList();

    finalizeWorkBtn.addEventListener('click', async () => {
        console.log('Finalize Work button clicked!');
        if (!beforeImageDataURL || afterImageDataURLs.length === 0 || requestedTasks.length === 0) {
            alert('Please ensure Block 1 and Block 2 (images) are complete.');
            return;
        }

        const selectedTasks = Array.from(document.querySelectorAll('.task-checkbox:checked'))
                                .map(checkbox => checkbox.value);

        console.log('Contractor Selected Tasks:', selectedTasks);
        // This button currently doesn't trigger a new API call, but prepares data for a final report.
        // The final report generation will be triggered by a new button in Block 3.
        finalReportOutput.textContent = 'Preparing final verification report...';
        // You'll send this data to a NEW /generate_final_report endpoint in app.py
        // when the user clicks the "Download Final Report" button in Block 3.
        // For now, this just logs and sets a temporary message.
        alert('Data prepared for final report. Now you can generate the final report from Block 3.');
    });


    // --- Block 3 Logic (Final Report) ---
    downloadFinalReportBtn.addEventListener('click', async () => {
        console.log('Download Final Report button clicked!');
        if (!beforeImageDataURL || afterImageDataURLs.length === 0 || requestedTasks.length === 0) {
            alert('Please complete Block 1 and upload After Images in Block 2.');
            return;
        }

        // Get selected tasks from Block 2
        const selectedTasks = Array.from(document.querySelectorAll('.task-checkbox:checked'))
                                .map(checkbox => checkbox.value);

        const contractorAccomplishments = contractorAccomplishmentsInput.value.trim();

        finalReportOutput.textContent = 'Generating final verification report...';
        loadingSpinner.style.display = 'block'; // Use main spinner for this heavy operation

        try {
            const response = await fetch('/generate_final_report', { // NEW FINAL ENDPOINT
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    before_image: beforeImageDataURL,
                    // Again, send only the first after image due to API limitation
                    after_image: afterImageDataURLs[0], 
                    requested_tasks: requestedTasks.join('\n'), // All requested tasks
                    contractor_accomplishments: contractorAccomplishments,
                    contractor_selected_tasks: selectedTasks // Tasks contractor claims completed
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received Final Report Data:', data);
            finalReportOutput.textContent = data.final_report; // Display final report
            // No need to store these for further download unless you want another button just for the final_report content

            const finalReportBlob = new Blob([data.final_report], { type: 'text/plain' });
            const link = document.createElement('a');
            link.download = 'landscaping_final_verification_report.txt';
            link.href = URL.createObjectURL(finalReportBlob);
            link.click();
            URL.revokeObjectURL(link.href);


        } catch (error) {
            console.error('Error generating final report:', error);
            finalReportOutput.textContent = `Error: ${error.message}`;
            alert('Failed to generate final report: ' + error.message);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });


    // --- Chat Functionality ---
    sendChatBtn.addEventListener('click', () => sendChatMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    async function sendChatMessage() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        displayChatMessage(userMessage, 'user');
        chatInput.value = ''; // Clear input
        chatInput.disabled = true;
        sendChatBtn.disabled = true;
        chatLoadingSpinner.style.display = 'block';

        chatConversationHistory.push({ role: 'user', message: userMessage });

        try {
            const response = await fetch('/chat_query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_question: userMessage,
                    before_image: beforeImageDataURL,
                    after_image: afterImageDataURLs.length > 0 ? afterImageDataURLs[0] : null, // Only send first after image
                    context: {
                        before_analysis: storedBeforeAnalysisText,
                        original_tasks: storedOriginalTasksText,
                        contractor_accomplishments: contractorAccomplishmentsInput.value.trim(),
                        full_report: currentReport,
                        conversation_history: chatConversationHistory // Send history for continuity
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received Chat API Response:', data);
            const aiMessage = data.response;
            displayChatMessage(aiMessage, 'ai');
            chatConversationHistory.push({ role: 'ai', message: aiMessage });

        } catch (error) {
            console.error('Error during chat query:', error);
            displayChatMessage(`Error: ${error.message}`, 'ai');
        } finally {
            chatLoadingSpinner.style.display = 'none';
            chatInput.disabled = false;
            sendChatBtn.disabled = false;
            chatInput.focus();
        }
    }

    function displayChatMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message`;
        messageDiv.textContent = message;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Initialize chat input state
    chatInput.disabled = true;
    sendChatBtn.disabled = true;

});
