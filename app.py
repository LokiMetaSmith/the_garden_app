# app.py
from flask import Flask, render_template, request, jsonify
from PIL import Image
import io
import base64
import os
from openai import OpenAI, APIError

app = Flask(__name__)
import requests # We need this for listing the models
from IPython.display import HTML, display # Added for word wrap

# --- Configure for better readability in Colab (Word Wrap) ---
# This snippet helps prevent long AI responses from creating horizontal scrollbars,
# making the output easier to read in Google Colab cells.
def set_css():
  display(HTML('''
  <style>
    pre {
        white-space: pre-wrap;
    }
  </style>
  '''))
get_ipython().events.register('pre_run_cell', set_css)
# --- API Configuration ---
# This safely gets your API key from environment variable.
# It's crucial to set this variable before running the app.
# This safely gets your API key from Colab's Secret Manager.
try:
    from google.colab import userdata
    NRP_API_KEY = userdata.get('NRP_API_KEY')
except (ImportError, ModuleNotFoundError):
    # Fallback for running locally if you set an environment variable
    NRP_API_KEY = os.environ.get("NRP_API_KEY")
    if not NRP_API_KEY:
      raise RuntimeError("API Key not found. Please set the NRP_API_KEY environment variable or run in Google Colab with secrets.")
except userdata.SecretNotFoundError:
    raise RuntimeError("API Key not found. Please add it to Colab Secrets as 'NRP_API_KEY'.")



if not NRP_API_KEY:
    raise RuntimeError(
        "API Key not found. Please set the NRP_API_KEY environment variable. "
        "Example: export NRP_API_KEY='your_key_here'"
    )

# Define the base URL and initialize the OpenAI client
BASE_URL = "https://llm.nrp-nautilus.io/v1"
client = OpenAI(
    api_key=NRP_API_KEY,
    base_url=BASE_URL
)

# Define the LLaVA model ID from your available models list
LLAVA_MODEL_ID = "llava-onevision" # This should match the ID provided by your API

# --- Helper Functions ---
# Converts PIL Image to base64 data URL for sending to API
def pil_to_base64_data_url(pil_image, format="PNG"):
    buffered = io.BytesIO()
    pil_image.save(buffered, format=format)
    return f"data:image/{format.lower()};base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

# Converts base64 data URL from frontend to PIL Image (useful if you need to process images locally)
def base64_data_url_to_pil(data_url):
    header, encoded = data_url.split(",", 1)
    data = base64.b64decode(encoded)
    return Image.open(io.BytesIO(data)).convert("RGB")

# --- Flask Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze_landscaping', methods=['POST'])
def analyze_landscaping():
    try:
        data = request.json
        before_image_data_url = data['before_image']
        after_image_data_url = data['after_image']
        requested_tasks_text = data['requested_tasks']

        # --- Phase 1: Describe the "Before" Image ---
        # Prompt for detailed description of the current state
        before_description_prompt = (
            "You are a professional landscape designer and inspector. "
            "Analyze the 'before' image provided. Describe in detail the current state "
            "of the lawn, garden beds, and any bare dirt areas. "
            "Focus on: plant health, presence of weeds, soil condition (if visible), "
            "existing landscaping features, and any visible signs of neglect or areas "
            "that clearly need work. "
            "Provide a bulleted list of potential landscaping projects that seem necessary or could enhance the space based on this image. "
            "Maintain a neutral, professional tone."
        )

        print("Sending 'Before' image analysis request to LLaVA-OneVision...")
        before_response = client.chat.completions.create(
            model=LLAVA_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": before_description_prompt},
                        {"type": "image_url", "image_url": {"url": before_image_data_url}},
                    ],
                }
            ],
            max_tokens=1000, # Allow for detailed descriptions
            temperature=0.7, # A bit creative but not too random
        )
        before_analysis = before_response.choices[0].message.content
        print("Before Analysis Complete.")

        # --- Phase 2: Analyze "After" Image and Verify Tasks ---
        # Combine before/after images and tasks in one powerful prompt
        # This leverages LLaVA-OneVision's multi-image capability
        verification_prompt = (
            "You are a meticulous landscape project manager focused on quality assurance. "
            "Your goal is to verify if landscaping tasks have been completed by a contractor. "
            "I will provide two images: one labeled 'Before' showing the initial state, "
            "and one labeled 'After' showing the current state after work. "
            "I will also provide a list of requested tasks. "
            f"Here are the requested tasks:\n{requested_tasks_text}\n\n"
            "For each task, clearly state its completion status based on the visual evidence in the 'After' image compared to the 'Before' image. "
            "If a task is *not* completed, describe precisely what is still missing or what needs to be done. "
            "If a task is completed, briefly describe the visual evidence confirming its completion. "
            "Present your findings in a clear, concise, bulleted checklist format, one bullet point per task.\n\n"
            "Example Format:\n"
            "- Task: Install new rose garden\n  Status: Completed. New rose bushes are visible with fresh mulch in the designated area.\n"
            "- Task: Lay sod in bare area\n  Status: Not completed. The bare dirt area still shows dirt and weeds; new sod has not been laid.\n"
            "- Task: Trim bushes\n  Status: Partially completed. Some bushes appear trimmed, but the large hedge near the fence is still overgrown.\n\n"
            "Now, analyze the images and verify the tasks:"
        )

        print("Sending 'Before' and 'After' images for task verification to LLaVA-OneVision...")
        after_response = client.chat.completions.create(
            model=LLAVA_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": verification_prompt},
                        {"type": "image_url", "image_url": {"url": before_image_data_url}}, # LLaVA supports multiple images
                        {"type": "image_url", "image_url": {"url": after_image_data_url}}, # Add the second image
                    ],
                }
            ],
            max_tokens=1500, # More tokens for detailed verification
            temperature=0.7, # Maintain consistency
        )
        task_verification_report_raw = after_response.choices[0].message.content
        print("Task Verification Complete.")

        # --- Phase 3: Generate Final Report ---
        final_report_sections = []
        final_report_sections.append("--- Landscaping Project Report ---\n")
        final_report_sections.append(f"**Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S CDT')}**\n") # Add timestamp
        final_report_sections.append("\n### 1. Before Image Analysis (Current State)\n")
        final_report_sections.append(before_analysis)

        final_report_sections.append("\n### 2. Requested Tasks Verification\n")
        final_report_sections.append(f"Original Requested Tasks:\n{requested_tasks_text}\n")
        final_report_sections.append("Verification Report:\n")
        final_report_sections.append(task_verification_report_raw) # Keep raw output for full context

        # Basic parsing to identify uncompleted tasks for payment verification
        uncompleted_tasks_for_payment = []
        lines = task_verification_report_raw.split('\n')
        for line in lines:
            line_lower = line.lower()
            # Look for lines indicating incomplete status AND containing a task description
            if ("status: not completed" in line_lower or "status: incomplete" in line_lower or "status: partially completed" in line_lower) and "- task:" in line_lower:
                # Extract the task description part
                task_description = line.split("Task:", 1)[1].split("\n")[0].strip()
                uncompleted_tasks_for_payment.append(task_description)


        if uncompleted_tasks_for_payment:
            final_report_sections.append("\n### 3. Tasks Left to Be Completed (Before Contractor Payment)\n")
            final_report_sections.append("The following tasks require further attention based on the 'After' image:\n")
            for task in uncompleted_tasks_for_payment:
                final_report_sections.append(f"- {task}\n")
            final_report_sections.append("\n*Please refer to the 'Requested Tasks Verification' section above for detailed reasons for non-completion.*")
        else:
            final_report_sections.append("\n### 3. All Requested Tasks Appear Completed!\n")
            final_report_sections.append("Based on the provided images and tasks, all specified work seems to be finished. The contractor is good to go for payment verification.\n")

        full_report_text = "".join(final_report_sections)
        print("Full Report Generated.")

        return jsonify({"report": full_report_text})

    except APIError as e:
        print(f"API Error during landscaping analysis: {e}")
        return jsonify({"error": f"API Error: {e.status_code} - {e.response}"}), 500
    except Exception as e:
        print(f"Unexpected error during landscaping analysis: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    # Ensure NRP_API_KEY environment variable is set before running
    if not os.getenv("NRP_API_KEY"):
        print("Error: NRP_API_KEY environment variable not set.")
        print("Please set it before running the Flask app, e.g.:")
        print("export NRP_API_KEY='your_api_key_here' (Linux/macOS)")
        print("set NRP_API_KEY=your_api_key_here (Windows Cmd)")
        print("$env:NRP_API_KEY='your_api_key_here' (Windows PowerShell)")
        exit(1)
    
    # Import datetime here, to avoid circular import if placed at top with app initialization
    from datetime import datetime 
    app.run(debug=True, host='0.0.0.0') # host='0.0.0.0' makes it accessible externally if needed
