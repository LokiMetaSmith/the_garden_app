# app.py
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import base64
import os
from openai import OpenAI, APIError
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "https://cotterslist.com"])

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
CHAT_LLM_MODEL_ID = "llama3" # Dedicated LLM for chat and synthesis

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
        # MODIFIED: Receive array of after images
        after_image_data_urls = data['after_images'] 
        requested_tasks_text = data['requested_tasks']
        contractor_accomplishments_text = data.get('contractor_accomplishments', '')

        # --- Phase 1: Describe the "Before" Image (uses LLaVA) ---
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

        # --- Phase 2: Analyze EACH "After" Image individually with LLaVA ---
        individual_after_image_analyses = []
        for i, after_img_url in enumerate(after_image_data_urls):
            individual_analysis_prompt = (
                f"You are a meticulous landscape inspector. "
                f"This is 'After Image {i+1}' from a project. "
                f"Here is a description of the 'before' (initial) state:\n{before_analysis}\n\n"
                f"Here are the requested tasks:\n{requested_tasks_text}\n\n"
                f"If applicable, here are the contractor's claimed accomplishments:\n{contractor_accomplishments_text if contractor_accomplishments_text else 'None provided.'}\n\n"
                f"Describe the visual content of 'After Image {i+1}' specifically regarding "
                f"the requested tasks and any changes observed compared to the 'before' state. "
                f"Highlight areas that appear completed or incomplete from this specific angle/view."
            )
            print(f"Sending 'After Image {i+1}' for individual LLaVA analysis...")
            after_response_llava = client.chat.completions.create(
                model=LLAVA_MODEL_ID,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": individual_analysis_prompt},
                            {"type": "image_url", "image_url": {"url": after_img_url}},
                        ],
                    }
                ],
                max_tokens=700, # Limit individual analysis to save tokens for final synthesis
                temperature=0.5, # Keep it descriptive, less creative
            )
            individual_after_image_analyses.append(f"--- After Image {i+1} Analysis ---\n" + after_response_llava.choices[0].message.content)
            print(f"Analysis for 'After Image {i+1}' complete.")
        
        # --- Phase 3: Synthesize All Analyses into Final Verification (using CHAT_LLM_MODEL_ID) ---
        synthesis_prompt = (
            "You are the lead project manager. You have received detailed reports about a landscaping project. "
            "Your task is to synthesize all provided information into a final, comprehensive verification report. "
            "Based on the 'before' analysis, the original requested tasks, the contractor's claims, "
            "and the individual analyses of multiple 'after' images, provide a definitive status for each task. "
            "If a task is *not* completed, describe precisely what is still missing. "
            "If a task is completed, briefly describe the evidence supporting it, summarizing across all relevant 'after' image analyses. "
            "Present your findings in a clear, concise, bulleted checklist format, one bullet point per task.\n\n"
            f"Here is the 'before' image analysis:\n{before_analysis}\n\n"
            f"Here are the original requested tasks:\n{requested_tasks_text}\n\n"
        )
        if contractor_accomplishments_text:
            synthesis_prompt += f"Contractor's Claimed Accomplishments:\n{contractor_accomplishments_text}\n\n"
        
        synthesis_prompt += (
            "Individual 'After' Image Analyses from LLaVA:\n" +
            "\n\n".join(individual_after_image_analyses) +
            "\n\nNow, generate the final task verification report:"
        )

        print("Sending all analyses for final synthesis to Llama3...")
        synthesis_response = client.chat.completions.create(
            model=CHAT_LLM_MODEL_ID, # Use Llama3 for synthesis
            messages=[
                {"role": "system", "content": "You are a highly analytical project manager, excellent at synthesizing information and providing clear, actionable verification reports."},
                {"role": "user", "content": synthesis_prompt},
            ],
            max_tokens=1500, # Allow ample space for the full report
            temperature=0.2, # Keep synthesis factual and less creative
        )
        task_verification_report_raw = synthesis_response.choices[0].message.content
        print("Final Synthesis Complete.")

        # --- Phase 4: Assemble Final Report for Display and Download ---
        final_report_sections = []
        final_report_sections.append("--- Landscaping Project Report ---\n")
        final_report_sections.append(f"**Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S CDT')}**\n")
        final_report_sections.append("\n### 1. Before Image Analysis (Current State)\n")
        final_report_sections.append(before_analysis)

        final_report_sections.append("\n### 2. Individual After Image Analyses (From LLaVA)\n")
        final_report_sections.append("\n\n".join(individual_after_image_analyses)) # Add individual LLaVA outputs

        final_report_sections.append("\n### 3. Requested Tasks Verification (Synthesized by Llama3)\n") # Label change
        final_report_sections.append(f"Original Requested Tasks:\n{requested_tasks_text}\n")
        
        if contractor_accomplishments_text:
            final_report_sections.append(f"\nContractor's Claimed Accomplishments:\n{contractor_accomplishments_text}\n")

        final_report_sections.append("\nVerification Report:\n")
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
            final_report_sections.append("\n### 4. Tasks Left to Be Completed (Before Contractor Payment)\n") # Label change
            final_report_sections.append("The following tasks require further attention based on the synthesized report:\n")
            for task in uncompleted_tasks_for_payment:
                final_report_sections.append(f"- {task}\n")
            final_report_sections.append("\n*Please refer to the 'Requested Tasks Verification' section above for detailed reasons for non-completion.*")
        else:
            final_report_sections.append("\n### 4. All Requested Tasks Appear Completed!\n") # Label change
            final_report_sections.append("Based on the provided images and tasks, all specified work seems to be finished. The contractor is good to go for payment verification.\n")

        full_report_text = "".join(final_report_sections)
        print("Full Report Generated.")

        return jsonify({
            "report": full_report_text,
            "before_analysis_text": before_analysis,
            "original_tasks_text": requested_tasks_text,
            "contractor_accomplishments_text": contractor_accomplishments_text
        })

    except APIError as e:
        print(f"API Error during landscaping analysis: {e}")
        # Log the full response content for debugging
        if e.response:
            print(f"API Error Response Body: {e.response.text}")
        return jsonify({"error": f"API Error: {e.status_code} - {e.response.json() if e.response else str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error during landscaping analysis: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# --- Chat/Question Answering Endpoint (remains mostly the same, now uses LLaVA for visual Qs, Llama3 for text Qs) ---
@app.route('/ask_question', methods=['POST'])
def ask_question():
    try:
        data = request.json
        user_question = data['question']
        before_image_data_url = data.get('before_image_data_url')
        after_image_data_urls = data.get('after_image_data_urls', []) # MODIFIED: now an array
        before_analysis_text = data.get('before_analysis_text')
        original_tasks_text = data.get('original_tasks_text')
        contractor_accomplishments_text = data.get('contractor_accomplishments_text')
        chat_history = data.get('chat_history', [])

        # Heuristic for routing: if question contains keywords and images are available,
        # pick one image for LLaVA. Otherwise, use Llama3 (text-only).
        
        image_to_send_url_for_llava = None
        model_to_use = CHAT_LLM_MODEL_ID # Default to Llama3
        
        question_lower = user_question.lower()
        keywords_for_visual_query = ["image", "photo", "picture", "show", "tell me about this", "what's in", "visible", "see"]
        
        # Check if question explicitly mentions "before" or "after" image
        if any(keyword in question_lower for keyword in keywords_for_visual_query):
            if "before image" in question_lower and before_image_data_url:
                image_to_send_url_for_llava = before_image_data_url
                model_to_use = LLAVA_MODEL_ID
                print("Detected visual query for 'before' image, routing to LLaVA.")
            elif "after image" in question_lower and after_image_data_urls: # Check if after images are provided
                # For chat, we'll send the FIRST after image if multiple, for simplicity with LLaVA's 1-image limit.
                image_to_send_url_for_llava = after_image_data_urls[0]
                model_to_use = LLAVA_MODEL_ID
                print("Detected visual query for 'after' image, routing to LLaVA (first after image).")
            elif after_image_data_urls and not before_image_data_url: # If only after images are available and general visual query
                 image_to_send_url_for_llava = after_image_data_urls[0]
                 model_to_use = LLAVA_MODEL_ID
                 print("Detected general visual query (defaulting to first 'after' image), routing to LLaVA.")
            elif before_image_data_url and not after_image_data_urls: # If only before image available and general visual query
                 image_to_send_url_for_llava = before_image_data_url
                 model_to_use = LLAVA_MODEL_ID
                 print("Detected general visual query (defaulting to 'before' image), routing to LLaVA.")


        # Construct messages for the chosen LLM
        messages_for_llm = []

        # Add initial system/context message (summarizing the project)
        context_message = (
            "You are an AI assistant for landscaping project management, providing helpful and informative answers. "
            "You have access to context about a landscaping project. "
        )
        if before_analysis_text:
            context_message += f"\n\nProject Context - Before Analysis:\n{before_analysis_text}"
        if original_tasks_text:
            context_message += f"\n\nProject Context - Original Requested Tasks:\n{original_tasks_text}"
        if contractor_accomplishments_text:
            context_message += f"\n\nProject Context - Contractor's Claimed Accomplishments:\n{contractor_accomplishments_text}"
        
        messages_for_llm.append({"role": "system", "content": context_message})

        # Add previous chat history
        for msg in chat_history:
            messages_for_llm.append({"role": msg['role'], "content": msg['content']})

        # Add the current user question. Content structure depends on model.
        if model_to_use == LLAVA_MODEL_ID and image_to_send_url_for_llava:
            user_content_for_llava = [{"type": "text", "text": user_question}]
            user_content_for_llava.append({"type": "image_url", "image_url": {"url": image_to_send_url_for_llava}})
            messages_for_llm.append({"role": "user", "content": user_content_for_llava})
        else:
            # For Llama3 (text-only), or if no specific image for LLaVA
            messages_for_llm.append({"role": "user", "content": user_question})


        print(f"Sending chat question to {model_to_use}: {user_question}")
        chat_response = client.chat.completions.create(
            model=model_to_use,
            messages=messages_for_llm,
            max_tokens=500,
            temperature=0.7,
        )
        ai_answer = chat_response.choices[0].message.content
        print(f"Chat response received from {model_to_use}.")

        return jsonify({"answer": ai_answer})

    except APIError as e:
        print(f"API Error during chat: {e}")
        if e.response:
            print(f"API Error Response Body: {e.response.text}")
        return jsonify({"error": f"API Error: {e.status_code} - {e.response.json() if e.response else str(e)}"}), 500
    except Exception as e:
        print(f"Unexpected error during chat: {e}")
        return jsonify({"error": f"An unexpected error occurred during chat: {str(e)}"}), 500

if __name__ == '__main__':
    if not os.getenv("NRP_API_KEY"):
        print("Error: NRP_API_KEY environment variable not set.")
        print("Please set it before running the Flask app, e.g.:")
        print("export NRP_API_KEY='your_api_key_here' (Linux/macOS)")
        print("set NRP_API_KEY=your_api_key_here (Windows Cmd)")
        print("$env:NRP_API_KEY='your_api_key_here' (Windows PowerShell)")
        exit(1)
    
    app.run(debug=True, host='0.0.0.0')
