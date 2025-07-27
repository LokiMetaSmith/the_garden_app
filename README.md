# AR Garden Planner

A professional garden scanning and planning solution using AR, photogrammetry, and AI-powered plant identification.

## Features

- **3D Garden Scanning:** Use your device's camera or LiDAR to create a 3D model of your garden.
- **AI Plant Identification:** Identify plants using the Plant.id API.
- **Interactive 3D Model:** Visualize your garden and plant locations in 3D.
- **Professional Reports:** Generate detailed PDF reports for contractor quotes.
- **Contractor Matching:** Connect with qualified landscapers and contractors.
# The Garden App: AI Landscaping Project Verifier

This application leverages a powerful multimodal AI model (`llava-onevision` via the NRP API) to analyze "before" and "after" images of a landscaping project, describe the current state, and verify the completion of requested tasks. It generates a comprehensive report, including a list of tasks still pending, which can be crucial for contractor payment verification.

## Features

* **"Before" Image Analysis:** Get a detailed AI-generated description of the initial landscaping state, including lawn condition, garden beds, bare areas, and potential project suggestions.
* **"After" Image Verification:** Upload a post-project image and provide a list of requested tasks. The AI will compare the "before" and "after" states to verify task completion.
* **Comprehensive Report Generation:** Receive a structured report summarizing the analysis, task verification, and a clear list of uncompleted tasks.
* **Contractor Payment Verification:** Easily identify outstanding work before approving payments.

## Technologies Used

* **Backend:** Python (Flask)
* **Frontend:** HTML, CSS, JavaScript
* **AI Model:** LLaVA-OneVision (accessed via an OpenAI-compatible API endpoint provided by NRP Nautilus)
* **Libraries:** `Flask`, `Pillow`, `openai` (Python client for API interaction)

## Setup Instructions

Follow these steps to get the application running on your local machine.

### 1. Clone the Repository

First, clone the `the_garden_app` repository to your local machine:

```bash
git clone [https://github.com/LokiMetaSmith/the_garden_app.git](https://github.com/LokiMetaSmith/the_garden_app.git)
cd the_garden_app
## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [pnpm](https://pnpm.io/) (or use npm/yarn)
- Modern browser (for web features)

### Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/your-username/the_garden_app.git
cd the_garden_app
pnpm install
```

### Running the Development Server

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Building for Production

```sh
pnpm build
pnpm start
```

### Testing

_Unit tests are not yet implemented._  
(Add instructions here if you add tests, e.g. `pnpm test`)

## Project Structure

- `app/` — Main Next.js app, components, and pages
- `components/` — Shared UI components
- `hooks/` — Custom React hooks
- `lib/` — Utility functions
- `public/` — Static assets
- `styles/` — Global styles

## Usage

1. **Scan your garden** using the "Garden Scanning" tab.
2. **Identify plants** with the "Plant Identification" tab.
3. **View your garden** in 3D or 2D.
4. **Generate reports** or **find contractors** for your project.

## License

MIT

---

_Replace any placeholder URLs or add more details
