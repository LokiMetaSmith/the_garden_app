// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Script is running.');

    const beforeImageUpload = document.getElementById('beforeImageUpload');
    const afterImageUpload = document.getElementById('afterImageUpload');
    const beforeFileNameDisplay = document.getElementById('beforeFileName');
    const afterFileNameDisplay = document.getElementById('afterFileName');
    const newTaskInput = document.getElementById('newTaskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const suggestTasksBtn = document.getElementById('suggestTasksBtn');
    const taskList = document.getElementById('taskList');
    const contractorAccomplishmentsInput = document.getElementById('contractorAccomplishments');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const reportOutput = document.getElementById('reportOutput');
    const downloadBidBtn = document.getElementById('downloadBidBtn');
    const loadingSpinner = document.getElementById('loading');

    // Chat elements
    const chatHistory = document.getElementById('chatHistory');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatLoadingSpinner = document.getElementById('chatLoading');

    // Block 2 elements
    const completedTaskList = document.getElementById('completedTaskList');
    const finalizeWorkBtn = document.getElementById('finalizeWorkBtn');
    
    // Block 3 elements
    const finalReportOutput = document.getElementById('finalReportOutput');
    const downloadFinalReportBtn = document.getElementById('downloadFinalReportBtn');


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
                            updateCompletedTaskList(); // Update Block 2's list
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


    // --- Suggest Tasks Functionality ---
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

            const suggestedTasksArray = data.suggested_tasks.split('\n')
                                        .map(task => task.trim())
                                        .filter(task => task.length > 0 && task.startsWith('- ')); 

            suggestedTasksArray.forEach(task => {
                requestedTasks.push(task.substring(2)); 
            });
            renderTaskList(); // Re-render the UI list
            updateCompletedTaskList(); // Update Block 2's list

            reportOutput.textContent = 'Task suggestions generated and added to your list. Review and click "Analyze & Generate Initial Report".';
            
            chatInput.disabled = false;
            sendChatBtn.disabled = false;
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
        
        // --- MODIFIED VALIDATION: Only 'before' image is strictly required for initial report ---
        if (!beforeImageDataURL) { 
            alert('Please upload a "Before" image to generate the initial report.');
            return;
        }
        if (requestedTasks.length === 0) {
            alert('Please add some requested landscaping tasks before generating the report.');
            return;
        }

        loadingSpinner.style.display = 'block';
        reportOutput.textContent = 'Generating initial project report...';
        chatInput.disabled = true; 
        sendChatBtn.disabled = true;

        try {
            const response = await fetch('/analyze_landscaping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    before_image: beforeImageDataURL,
                    // Send first after image if available, otherwise null
                    after_image: afterImageDataURLs.length > 0 ? afterImageDataURLs[0] : null, 
                    requested_tasks: requestedTasks.join('\n'), 
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
            storedOriginalTasksText = data.original_tasks_text;
            currentReport = data.report; 

            reportOutput.textContent = data.report;
            console.log('Attempted to set reportOutput.textContent.');

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
    downloadBidBtn.addEventListener('click', () => { 
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
        link.download = 'landscaping_bid_analysis.txt';
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
                checkbox.className = 'task-checkbox';

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
            alert('Please ensure Block 1 is complete and "After Images" are uploaded in Block 2.');
            return;
        }

        const selectedTasks = Array.from(document.querySelectorAll('.task-checkbox:checked'))
                                .map(checkbox => checkbox.value);

        console.log('Contractor Selected Tasks:', selectedTasks);
        alert('Contractor work details prepared. Now you can generate the Final Report from Block 3.');
        // This button currently doesn't trigger a new API call.
        // Data prepared here will be used by the Block 3 button.
    });


    // --- Block 3 Logic (Final Report) ---
    downloadFinalReportBtn.addEventListener('click', async () => {
        console.log('Download Final Report button clicked!');
        if (!beforeImageDataURL || afterImageDataURLs.length === 0 || requestedTasks.length === 0) {
            alert('Please complete Block 1 and upload After Images in Block 2.');
            return;
        }

        const selectedTasks = Array.from(document.querySelectorAll('.task-checkbox:checked'))
                                .map(checkbox => checkbox.value);

        const contractorAccomplishments = contractorAccomplishmentsInput.value.trim();

        finalReportOutput.textContent = 'Generating final verification report...';
        loadingSpinner.style.display = 'block';

        try {
            const response = await fetch('/generate_final_report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    before_image: beforeImageDataURL,
                    after_image: afterImageDataURLs.length > 0 ? afterImageDataURLs[0] : null,
                    requested_tasks: requestedTasks.join('\n'), 
                    contractor_accomplishments: contractorAccomplishments,
                    contractor_selected_tasks: selectedTasks
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received Final Report Data:', data);
            finalReportOutput.textContent = data.final_report;

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
                    after_image: afterImageDataURLs.length > 0 ? afterImageDataURLs[0] : null, 
                    context: {
                        before_analysis: storedBeforeAnalysisText,
                        original_tasks: storedOriginalTasksText,
                        contractor_accomplishments: contractorAccomplishmentsInput.value.trim(),
                        full_report: currentReport,
                        conversation_history: chatConversationHistory 
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
