# app.py
from flask import Flask, render_template, request, jsonify
from PIL import Image
import io
import base64
import os
from openai import OpenAI, APIError
from datetime import datetime

app = Flask(__name__)

# --- API Configuration ---
NRP_API_KEY = os.environ.get("NRP_API_KEY")

if not NRP_API_KEY:
    raise RuntimeError(
        "API Key not found. Please set the NRP_API_KEY environment variable. "
        "Example: export NRP_API_KEY='your_key_here'"
    )

BASE_URL = "https://llm.nrp-nautilus.io/v1"
client = OpenAI(
    api_key=NRP_API_KEY,
    base_url=BASE_URL
)

LLAVA_MODEL_ID = "llava-onevision"

# --- Helper Functions ---
def pil_to_base64_data_url(pil_image, format="PNG"):
    buffered = io.BytesIO()
    pil_image.save(buffered, format=format)
    return f"data:image/{format.lower()};base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

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
            max_tokens=1000,
            temperature=0.7,
        )
        before_analysis = before_response.choices[0].message.content
        print("Before Analysis Complete.")

        # --- Phase 2: Analyze "After" Image and Verify Tasks (Adjusted for single image input) ---
        verification_prompt = (
            "You are a meticulous landscape project manager focused on quality assurance. "
            "You need to verify if landscaping tasks have been completed by a contractor. "
            "I will provide an 'after' image (the current state) and descriptions of the "
            "original 'before' state and the requested tasks. "
            
            f"Here is a description of the 'before' (initial) state:\n{before_analysis}\n\n"
            f"Here are the requested tasks:\n{requested_tasks_text}\n\n"
            
            "Compare the *current image* (the 'after' image you are analyzing now) "
            "to the provided 'before' state description and the requested tasks. "
            "For each task, clearly state its completion status based on the visual evidence "
            "in the *current image*. "
            "If a task is *not* completed, describe precisely what is still missing or what needs to be done. "
            "If a task is completed, briefly describe the visual evidence confirming its completion. "
            "Present your findings in a clear, concise, bulleted checklist format, one bullet point per task.\n\n"
            "Example Format:\n"
            "- Task: Install new rose garden\n  Status: Completed. New rose bushes are visible with fresh mulch in the designated area.\n"
            "- Task: Lay sod in bare area\n  Status: Not completed. The bare dirt area still shows dirt and weeds; new sod has not been laid.\n"
            "- Task: Trim bushes\n  Status: Partially completed. Some bushes appear trimmed, but the large hedge near the fence is still overgrown.\n\n"
            "Now, analyze the *current 'after' image* and verify the tasks:"
        )

        print("Sending 'After' image for task verification to LLaVA-OneVision (with 'before' context)...")
        after_response = client.chat.completions.create(
            model=LLAVA_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": verification_prompt},
                        {"type": "image_url", "image_url": {"url": after_image_data_url}}, # Only one image here
                    ],
                }
            ],
            max_tokens=1500,
            temperature=0.7,
        )
        task_verification_report_raw = after_response.choices[0].message.content
        print("Task Verification Complete.")

        # --- Phase 3: Generate Final Report ---
        final_report_sections = []
        final_report_sections.append("--- Landscaping Project Report ---\n")
        final_report_sections.append(f"**Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S CDT')}**\n")
        final_report_sections.append("\n### 1. Before Image Analysis (Current State)\n")
        final_report_sections.append(before_analysis)

        final_report_sections.append("\n### 2. Requested Tasks Verification\n")
        final_report_sections.append(f"Original Requested Tasks:\n{requested_tasks_text}\n")
        final_report_sections.append("Verification Report:\n")
        final_report_sections.append(task_verification_report_raw)

        uncompleted_tasks_for_payment = []
        lines = task_verification_report_raw.split('\n')
        for line in lines:
            line_lower = line.lower()
            if ("status: not completed" in line_lower or "status: incomplete" in line_lower or "status: partially completed" in line_lower) and "- task:" in line_lower:
                try:
                    task_description = line.split("Task:", 1)[1].split("\n")[0].strip()
                    uncompleted_tasks_for_payment.append(task_description)
                except IndexError:
                    uncompleted_tasks_for_payment.append(line.strip())

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
        return jsonify({"error": f"API Error: {e.status_code} - {e.response.json() if e.response else str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error during landscaping analysis: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    if not os.getenv("NRP_API_KEY"):
        print("Error: NRP_API_KEY environment variable not set.")
        print("Please set it before running the Flask app, e.g.:")
        print("export NRP_API_KEY='your_api_key_here' (Linux/macOS)")
        print("set NRP_API_KEY=your_api_key_here (Windows Cmd)")
        print("$env:NRP_API_KEY='your_api_key_here' (Windows PowerShell)")
        exit(1)
    
    app.run(debug=True, host='0.0.0.0')
