# ExamFlow AI 🎓✨

**ExamFlow AI** is an intelligent, adaptive exam study planner designed to take the stress out of exam preparation. Tailored (currently) for Mumbai University Computer Engineering Semester 6, it uses AI to parse your exam timetable and automatically generates an optimized, day-by-day study schedule complete with risk assessments and readiness tracking.

---

## 🌟 Key Features

### 1. AI-Powered Timetable Parsing
Upload a photo, screenshot, PDF, or Word Document of your exam schedule. 
- **Images**: Processes locally in your browser using **Tesseract.js** to extract raw text without uploading images to a server.
- **Documents**: Parses PDFs and DOCX files securely using `pdf-parse` and `mammoth`.
- **Intelligent Extraction**: Sends the noisy extracted text to the **Groq API (LLaMA 3)** to accurately identify subject codes and exam dates, with a robust Regex fallback mechanism.

### 2. Smart Planning Engine
A custom-built TypeScript scheduling engine that does the heavy lifting:
- Calculates study block durations based on your daily availability and syllabus size.
- Prioritizes modules based on user-defined difficulty ratings and exam proximity.
- Automatically inserts dedicated "Revision" and "Mock Test" blocks right before exam days.

### 3. Adaptive Risk & Readiness Tracking
The system continuously evaluates your progress:
- **Risk Assessment**: Flags subjects as "Critical" or "High Risk" if you fall behind schedule relative to the exam date.
- **Readiness Score**: Calculates a percentage of your preparedness based on completed modules and confidence levels.
- **AI Insights**: Generates actionable, context-aware advice (e.g., "Only 2 days between SPCC and CSS exams. Study focus will shift immediately.")

### 4. Interactive Dashboard & Calendar
- **Dashboard**: Features dynamic progress rings, statistical charts (Recharts), and a quick overview of your study status.
- **Calendar Visualization**: Uses **FullCalendar** to beautifully visualize your study blocks, color-coded by subject and priority (Urgent, Medium, Low).
- **Glassmorphism UI**: A premium, modern dark-mode aesthetic with smooth animations using Framer Motion and Tailwind CSS v4.

---

## 🏗️ Architecture & Tech Stack

ExamFlow AI is built with performance, privacy, and modern web standards in mind.

### **Frontend**
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Components**: Modified Shadcn UI + Base UI components
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with local storage persistence — no external database required!)
- **Icons**: Lucide React

### **Backend & AI Engine**
- **Next.js API Routes**: Serverless functions handling secure processing.
- **OCR Engine**: `tesseract.js` (Client-side), `pdf-parse`, `mammoth` (Server-side).
- **LLM Provider**: [Groq](https://groq.com/) for lightning-fast JSON extraction using the `llama-3.3-70b-versatile` model.
- **Core Logic**: Pure TypeScript scheduling engine located in `src/lib/engine`.

---

## 📂 Project Structure

```text
examflow-ai/
├── src/
│   ├── app/
│   │   ├── api/                 # Next.js API Routes (OCR, extraction)
│   │   ├── dashboard/           # Dashboard & Calendar Pages
│   │   ├── globals.css          # Global Tailwind and Glassmorphism styles
│   │   └── page.tsx             # Landing/Onboarding Page
│   ├── components/
│   │   ├── calendar/            # FullCalendar integration & Modals
│   │   ├── dashboard/           # Charts, Risk Panels, Progress Trackers
│   │   ├── layout/              # Sidebar, Headers, Navigation
│   │   ├── onboarding/          # Step-by-Step setup wizard
│   │   └── ui/                  # Reusable UI components (Buttons, Dialogs)
│   ├── lib/
│   │   ├── ai/                  # Groq configuration and Tesseract wrapper
│   │   ├── data/                # Hardcoded syllabus data
│   │   ├── engine/              # The brain: Planning, Scheduling, Risk logic
│   │   └── store/               # Zustand state management
```

---

## 🧠 How The Logic Works

1. **Onboarding Pipeline**:
   - The user inputs their available study hours and rates the difficulty of each subject.
   - The user uploads a timetable. Tesseract/pdf-parse extracts text -> Groq parses the dates.
2. **Scheduling Engine (`schedule-builder.ts`)**:
   - Calculates the total "weight" of all modules based on difficulty.
   - Distributes available study hours leading up to each exam proportional to module weights.
   - Schedules blocks chronologically, prioritizing modules of the closest exam.
3. **Execution & State**:
   - The schedule is saved to the browser's local storage via Zustand.
   - As the user marks blocks as "Complete" on the calendar, the state updates instantly, recalculating Readiness and Risk scores.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- A free [Groq API Key](https://console.groq.com/keys)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd examflow-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and add your Groq API Key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 License
This project is for educational purposes. 

Happy Studying! 📚🚀
