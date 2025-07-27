// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Script is running.');

    const beforeImageUpload = document.getElementById('beforeImageUpload');
    const afterImageUpload = document.getElementById('afterImageUpload'); // Now supports multiple files
    const beforeFileNameDisplay = document.getElementById('beforeFileName');
    const afterFileNameDisplay = document.getElementById('afterFileName'); // Will show file count
    const newTaskInput = document.getElementById('newTaskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const contractorAccomplishmentsInput = document.getElementById('contractorAccomplishments');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const reportOutput = document.getElementById('reportOutput');
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const downloadBeforeTasksBtn = document.getElementById('downloadBeforeTasksBtn');
    const chatHistoryDiv = document.getElementById('chatHistory');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatLoadingSpinner = document.getElementById('chatLoading');

    let beforeImageDataURL = null;
    let afterImageDataURLs = []; // MODIFIED: Now an array for multiple after images
    let storedBeforeAnalysisText = null;
    let storedOriginalTasksText = null;
    let storedContractorAccomplishmentsText = null;
    let tasks = [];
    let chatMessages = [];


    // --- Task List Management Functions ---
    const renderTasks = () => {
        taskList.innerHTML = '';
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

        document.querySelectorAll('.remove-task-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToRemove = parseInt(e.target.dataset.index);
                tasks.splice(indexToRemove, 1);
                renderTasks();
            });
        });
    };

    addTaskBtn.addEventListener('click', () => {
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            tasks.push(taskText);
            newTaskInput.value = '';
            renderTasks();
        } else {
            alert('Please enter a task description.');
        }
    });

    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTaskBtn.click();
        }
    });
    renderTasks();

    // --- Image Upload Handling (MODIFIED for multiple after images) ---
    function handleImageUpload(event, fileNameDisplay) {
        const files = event.target.files;
        if (files.length > 0) {
            if (event.target.id === 'beforeImageUpload') {
                fileNameDisplay.textContent = files[0].name; // Only one before image
                const reader = new FileReader();
                reader.onload = (e) => {
                    beforeImageDataURL = e.target.result;
                    console.log(`Before file loaded: ${files[0].name}, data URL length: ${e.target.result.length}`);
                    console.log('beforeImageDataURL set.');
                    resetChat(); // Reset chat when new images are uploaded
                };
                reader.readAsDataURL(files[0]);
            } else if (event.target.id === 'afterImageUpload') {
                afterImageDataURLs = []; // Clear previous after images
                fileNameDisplay.textContent = `${files.length} file(s) chosen.`; // Display count

                let filesLoaded = 0;
                for (let i = 0; i < files.length; i++) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        afterImageDataURLs.push(e.target.result);
                        console.log(`After file ${i+1} loaded: ${files[i].name}, data URL length: ${e.target.result.length}`);
                        filesLoaded++;
                        if (filesLoaded === files.length) {
                            console.log('All afterImageDataURLs set.');
                            resetChat(); // Reset chat when new images are uploaded
                        }
                    };
                    reader.readAsDataURL(files[i]);
                }
            }
        } else {
            fileNameDisplay.textContent = 'No files chosen';
            if (event.target.id === 'beforeImageUpload') {
                beforeImageDataURL = null;
            } else if (event.target.id === 'afterImageUpload') {
                afterImageDataURLs = [];
            }
            resetChat();
        }
    }

    beforeImageUpload.addEventListener('change', (e) => handleImageUpload(e, beforeFileNameDisplay));
    afterImageUpload.addEventListener('change', (e) => handleImageUpload(e, afterFileNameDisplay));

    // --- Chat Management Functions ---
    const addMessageToChat = (role, content) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(`${role}-message`);
        messageDiv.textContent = content;
        chatHistoryDiv.appendChild(messageDiv);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    };

    const resetChat = () => {
        chatMessages = [];
        chatHistoryDiv.innerHTML = '';
        addMessageToChat('ai', 'Hi! I can answer questions about your landscaping project once you\'ve generated the initial report.');
        chatInput.disabled = true;
        sendChatBtn.disabled = true;
        // Also clear stored report texts
        storedBeforeAnalysisText = null;
        storedOriginalTasksText = null;
        storedContractorAccomplishmentsText = null;
    };

    const enableChat = () => {
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
        chatInput.focus();
    };

    const sendQuestion = async () => {
        const userQuestion = chatInput.value.trim();
        if (!userQuestion) return;

        addMessageToChat('user', userQuestion);
        chatMessages.push({ role: 'user', content: userQuestion });
        chatInput.value = '';
        chatInput.disabled = true;
        sendChatBtn.disabled = true;
        chatLoadingSpinner.style.display = 'block';

        try {
            const response = await fetch('/ask_question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userQuestion,
                    before_image_data_url: beforeImageDataURL,
                    // MODIFIED: Send all after images (backend will decide which to send to LLaVA)
                    after_image_data_urls: afterImageDataURLs, 
                    before_analysis_text: storedBeforeAnalysisText,
                    original_tasks_text: storedOriginalTasksText,
                    contractor_accomplishments_text: storedContractorAccomplishmentsText,
                    chat_history: chatMessages.slice(-5)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.answer;
            addMessageToChat('ai', aiResponse);
            chatMessages.push({ role: 'ai', content: aiResponse });

        } catch (error) {
            console.error('Error asking question:', error);
            addMessageToChat('ai', `Error: Could not get an answer. ${error.message}`);
        } finally {
            chatInput.disabled = false;
            sendChatBtn.disabled = false;
            chatLoadingSpinner.style.display = 'none';
            chatInput.focus();
        }
    };

    sendChatBtn.addEventListener('click', sendQuestion);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendChatBtn.disabled) {
            sendQuestion();
        }
    });
    resetChat(); // Initialize chat on page load

    // --- Main Analyze Button Logic (MODIFIED to send array of after images) ---
    analyzeBtn.addEventListener('click', async () => {
        console.log('Analyze button clicked!');
        console.log('Before image URL status:', beforeImageDataURL ? 'set' : 'NOT SET');
        console.log('After image URLs count:', afterImageDataURLs.length); // Log count for array
        console.log('Tasks:', tasks);
        console.log('Contractor Accomplishments length:', contractorAccomplishmentsInput.value.trim().length);

        if (!beforeImageDataURL || afterImageDataURLs.length === 0) { // Check array length
            alert('Please upload both a "Before" image and at least one "After" image.');
            return;
        }
        if (tasks.length === 0) {
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
                    after_images: afterImageDataURLs, // MODIFIED: Send array of after images
                    requested_tasks: tasks.join('\n'),
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
            storedContractorAccomplishmentsText = data.contractor_accomplishments_text;

            reportOutput.textContent = data.report;
            console.log('Attempted to set reportOutput.textContent.');

            enableChat();

        } catch (error) {
            console.error('Error during fetch or processing:', error);
            reportOutput.textContent = `Error: ${error.message}`;
            alert('Failed to generate report: ' + error.message);
            resetChat();
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // --- Download Buttons (Same as before) ---
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
