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
TEXT_LLM_MODEL_ID = "llama3" 

# --- Helper Functions ---
def pil_to_base64_data_url(pil_image, format="PNG"):
    buffered = io.BytesIO()
    pil_image.save(buffered, format=format)
    return f"data:image/{format.lower()};base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

def base64_data_url_to_pil(data_url):
    header, encoded = data_url.split(",", 1)
    data = base64.b64decode(encoded)
    return Image.open(io.BytesIO(data)).convert("RGB")

def build_messages_with_image(prompt_text, image_data_url=None, context_messages=None):
    messages = []
    if context_messages:
        for msg in context_messages:
            messages.append({"role": msg['role'], "content": msg['content']})

    user_content = [{"type": "text", "text": prompt_text}]
    if image_data_url:
        user_content.append({"type": "image_url", "image_url": {"url": image_data_url}})
    
    messages.append({"role": "user", "content": user_content})
    return messages


# --- Flask Routes ---
@app.route('/')
def index():
    return render_template('index.html')

# --- NEW ENDPOINT for Suggesting Tasks (Block 1) ---
@app.route('/suggest_tasks', methods=['POST'])
def suggest_tasks():
    try:
        data = request.json
        before_image_data_url = data['before_image']

        suggest_prompt = (
            "You are an AI landscape designer assistant. "
            "Analyze the provided 'before' image of a landscaping area. "
            "Based on what you see (e.g., bare spots, overgrown areas, existing features, soil condition), "
            "suggest a bulleted list of 5-10 specific, actionable landscaping tasks that could be done "
            "to improve the area. Focus on practical improvements like planting, trimming, mulching, adding features, etc. "
            "Each task should be concise and start with a bullet point '- '."
        )

        print("Sending 'Before' image for task suggestions to LLaVA-OneVision...")
        response = client.chat.completions.create(
            model=LLAVA_MODEL_ID,
            messages=build_messages_with_image(suggest_prompt, before_image_data_url),
            max_tokens=500,
            temperature=0.8,
        )
        suggested_tasks_text = response.choices[0].message.content
        print(f"Suggested Tasks: {suggested_tasks_text}")

        return jsonify({"suggested_tasks": suggested_tasks_text})

    except APIError as e:
        print(f"API Error suggesting tasks: {e}")
        return jsonify({"error": f"API Error: {e.status_code} - {e.response.json() if e.response else str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error suggesting tasks: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/analyze_landscaping', methods=['POST'])
def analyze_landscaping():
    try:
        data = request.json
        before_image_data_url = data['before_image']
        # This can now be null if no after image is provided for initial report
        after_image_data_url = data['after_image'] 
        requested_tasks_text = data['requested_tasks']
        contractor_accomplishments_text = data.get('contractor_accomplishments', '') 

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
            messages=build_messages_with_image(before_description_prompt, before_image_data_url),
            max_tokens=1000,
            temperature=0.7,
        )
        before_analysis = before_response.choices[0].message.content
        print("Before Analysis Complete.")

        # --- Phase 2: Conditionally Analyze "After" Image and Verify Tasks ---
        task_verification_report_raw = "N/A - After image not provided for initial report."
        if after_image_data_url: # Only run verification if after image is present
            verification_prompt = (
                "You are a meticulous landscape project manager focused on quality assurance. "
                "You need to verify if landscaping tasks have been completed by a contractor. "
                "I will provide an 'after' image (the current state) and descriptions of the "
                "original 'before' state and the requested tasks. "
                "Also, the contractor has provided the following statement about their accomplishments: "
                f"'{contractor_accomplishments_text}'\n\n"
                
                f"Here is a description of the 'before' (initial) state:\n{before_analysis}\n\n"
                f"Here are the requested tasks:\n{requested_tasks_text}\n\n"
                
                "Compare the *current image* (the 'after' image you are analyzing now) "
                "to the provided 'before' state description, the requested tasks, and the contractor's statement. "
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

            print("Sending 'After' image for task verification to LLaVA-OneVision (with 'before' and contractor context)...")
            after_response = client.chat.completions.create(
                model=LLAVA_MODEL_ID,
                messages=build_messages_with_image(verification_prompt, after_image_data_url),
                max_tokens=1500,
                temperature=0.7,
            )
            task_verification_report_raw = after_response.choices[0].message.content
            print("Task Verification Complete.")

        # --- Generate Initial Report ---
        initial_report_sections = []
        initial_report_sections.append("--- Initial Landscaping Project Report ---\n")
        initial_report_sections.append(f"**Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S CDT')}**\n")
        initial_report_sections.append("\n### 1. Before Image Analysis (Current State)\n")
        initial_report_sections.append(before_analysis)
        initial_report_sections.append("\n### 2. Requested Tasks (from your list)\n")
        initial_report_sections.append(f"{requested_tasks_text}\n")
        
        # Only add verification section if an after image was processed
        if after_image_data_url:
            initial_report_sections.append("\n### 3. Initial Task Verification (Based on After Image Provided)\n")
            initial_report_sections.append(task_verification_report_raw)
        else:
            initial_report_sections.append("\n### 3. Initial Task Verification (After Image Not Provided Yet)\n")
            initial_report_sections.append("Please upload 'After Image(s)' in Block 2 and generate the Final Report in Block 3 for task verification.")


        full_initial_report_text = "".join(initial_report_sections)
        print("Initial Report Generated.")

        return jsonify({
            "report": full_initial_report_text,
            "before_analysis_text": before_analysis,
            "original_tasks_text": requested_tasks_text # This is the newline-separated string
        })

    except APIError as e:
        print(f"API Error during landscaping analysis: {e}")
        return jsonify({"error": f"API Error: {e.status_code} - {e.response.json() if e.response else str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error during landscaping analysis: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# --- NEW ENDPOINT for Final Report Generation (Block 3) ---
@app.route('/generate_final_report', methods=['POST'])
def generate_final_report():
    try:
        data = request.json
        before_image_data_url = data['before_image']
        after_image_data_url = data['after_image'] 
        all_requested_tasks_text = data['requested_tasks']
        contractor_accomplishments_text = data.get('contractor_accomplishments', '')
        contractor_selected_tasks_list = data.get('contractor_selected_tasks', [])

        # --- Validate essential inputs for final report ---
        if not before_image_data_url or not after_image_data_url:
            return jsonify({"error": "Both 'before' and 'after' images are required for final report generation."}), 400
        if not all_requested_tasks_text:
            return jsonify({"error": "Requested tasks from Block 1 are required for final report generation."}), 400

        # Generate fresh analysis of 'before' image (could cache this from analyze_landscaping if preferred)
        before_description_prompt = (
            "Describe the initial state of this landscaping image in detail. Focus on elements like lawn health, bare areas, existing plants, and any visible problems."
        )
        before_response = client.chat.completions.create(
            model=LLAVA_MODEL_ID,
            messages=build_messages_with_image(before_description_prompt, before_image_data_url),
            max_tokens=1000, temperature=0.5,
        )
        before_analysis_for_final = before_response.choices[0].message.content

        # Convert contractor's selected tasks into a readable string
        contractor_selected_tasks_str = "\n".join([f"- {task}" for task in contractor_selected_tasks_list]) if contractor_selected_tasks_list else "None specified by contractor."

        # Prompt for final verification and payment validation
        final_verification_prompt = (
            "You are a strict, but reasonable, landscaping project quality assurance auditor. "
            "Your goal is to provide a final decision on whether a contractor's work meets requirements for payment validation. "
            "You must consider the *spirit and intent* of the requested tasks, allowing for common and functionally equivalent material substitutions "
            "unless the original request *explicitly* specified a unique or non-substitutable material. "
            "If a material is substituted, note it, but only mark the task as 'Not Completed' if the substitution fundamentally alters the task's purpose, functionality, or significantly degrades quality/aesthetics in the context of general landscaping. "
            "If there's a minor material substitution that achieves the same purpose (e.g., bricks instead of rocks for a border, unless specific rock type was crucial), consider it 'Completed' but note the substitution. "
            "If the request was for 'rocks' and 'bricks' were used, acknowledge the substitution but if the border is functional and aesthetic, you might consider it 'Completed (with material substitution)' unless explicitly instructed otherwise or there's a clear negative impact."
            "I will provide:\n"
            f"1. Description of the 'before' state: {before_analysis_for_final}\n"
            f"2. All originally requested tasks: {all_requested_tasks_text}\n"
            f"3. Contractor's self-reported accomplishments: {contractor_accomplishments_text if contractor_accomplishments_text else 'N/A'}\n"
            f"4. Specific tasks the contractor claims they completed: {contractor_selected_tasks_str}\n\n"
            "Based on the *current 'after' image* you are analyzing, and all the provided textual context, perform the following steps:\n"
            "A. **VERIFY ALL REQUESTED TASKS:** Go through 'All originally requested tasks' one by one. For each task, visually inspect the 'after' image. State whether it is 'Completed', 'Partially Completed', or 'Not Completed'. "
            "If there's a material substitution, indicate 'Completed (with material substitution)' or 'Partially Completed (with material substitution)' and specify the substitution. "
            "Provide brief visual evidence for your assessment. Use a bulleted list for each task.\n"
            "B. **COMPARE TO CONTRACTOR'S CLAIM:** Briefly comment on whether the contractor's self-reported accomplishments align with your visual verification, specifically noting any claimed tasks that appear incomplete or any unrequested work that was done.\n"
            "C. **PAYMENT VALIDATION DECISION:** Based on your thorough verification of ALL originally requested tasks, and considering the flexibility for material substitution as described, provide a clear decision: 'Meets Requirements for Payment', 'Partially Meets Requirements - Further Action Needed', or 'Does Not Meet Requirements - Payment Withheld'. Justify your decision with specific reasons related to uncompleted, unsatisfactory, or fundamentally altered tasks.\n\n"
            "Present your response clearly, with sections A, B, and C as described."
        )

        print("Sending 'After' image for final report generation to LLaVA-OneVision...")
        final_report_response = client.chat.completions.create(
            model=LLAVA_MODEL_ID,
            messages=build_messages_with_image(final_verification_prompt, after_image_data_url),
            max_tokens=2000,
            temperature=0.5,
        )
        final_report_content = final_report_response.choices[0].message.content
        print("Final Report Generated.")

        return jsonify({"final_report": final_report_content})

    except APIError as e:
        print(f"API Error during final report generation: {e}")
        print(f"API Response Details: {e.response.text if e.response else 'No response text'}")
        return jsonify({"error": f"API Error: {e.status_code} - {e.response.json() if e.response else str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error during final report generation: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


# --- NEW ENDPOINT for Chat Functionality ---
@app.route('/chat_query', methods=['POST'])
def chat_query():
    try:
        data = request.json
        user_question = data['user_question']
        before_image_data_url = data['before_image']
        after_image_data_url = data['after_image'] 
        context = data['context']

        # Determine which model to use based on question type and image availability
        use_llama3 = False
        current_model_id = LLAVA_MODEL_ID
        if not before_image_data_url and not after_image_data_url and TEXT_LLM_MODEL_ID:
            use_llama3 = True
            current_model_id = TEXT_LLM_MODEL_ID
            print("Using Llama3 for text-only chat query.")
        else:
            print("Using LLaVA-OneVision for chat query (image context available).")

        # Reconstruct messages list for the API call
        messages_for_api = []

        # Add previous conversation history
        if context.get('conversation_history'):
            for msg in context['conversation_history']:
                role = "user" if msg['role'] == 'user' else "assistant"
                # Check if content is already in the OpenAI multimodal format (list of dicts)
                # or if it's a simple text string.
                if isinstance(msg.get('content'), list): 
                    messages_for_api.append({"role": role, "content": msg['content']})
                else: 
                    messages_for_api.append({"role": role, "content": msg.get('message', '')})


        # Construct the context for the current user question
        context_text = (
            f"Here is relevant context from the user's landscaping project:\n\n"
            f"--- Initial Project Analysis (Before Image) ---\n{context.get('before_analysis', 'N/A')}\n\n"
            f"--- Original Requested Tasks ---\n{context.get('original_tasks', 'N/A')}\n\n"
            f"--- Contractor's Accomplishments (Statement) ---\n{context.get('contractor_accomplishments', 'N/A')}\n\n"
            f"--- Full Project Report ---\n{context.get('full_report', 'N/A')}\n\n"
        )
        
        # Build the current user message content
        current_user_content = [{"type": "text", "text": context_text + "User's Question: " + user_question}]

        # Add images only if using LLaVA and images are present, respecting 1-image-per-request limit
        if not use_llama3: 
            if after_image_data_url:
                current_user_content.append({"type": "image_url", "image_url": {"url": after_image_data_url}})
                print("Attaching 'After' image to chat query.")
            elif before_image_data_url: 
                current_user_content.append({"type": "image_url", "image_url": {"url": before_image_data_url}})
                print("Attaching 'Before' image to chat query.")
        
        messages_for_api.append({"role": "user", "content": current_user_content})
        
        print(f"Sending chat query to {current_model_id}. Question: {user_question}")
        chat_response = client.chat.completions.create(
            model=current_model_id,
            messages=messages_for_api,
            max_tokens=500,
            temperature=0.5,
        )
        ai_response_content = chat_response.choices[0].message.content
        print(f"AI Chat Response: {ai_response_content}")

        return jsonify({"response": ai_response_content})

    except APIError as e:
        print(f"API Error during chat query: {e}")
        print(f"API Response Details: {e.response.text if e.response else 'No response text'}")
        return jsonify({"error": f"API Error: {e.status_code} - {e.response.json() if e.response else str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error during chat query: {e}")
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
