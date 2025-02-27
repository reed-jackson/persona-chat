Product Specification: PersonaChat
Overview
Product Name: PersonaChat

Purpose: PersonaChat is a simple desktop messaging-style app designed for product growth teams to create, manage, and interact with user personas. Users can simulate feedback on prospective features or discuss pain points by chatting with personas, each powered by a customizable system prompt. The app mimics an iMessage-for-desktop interface, enabling threaded conversations, bulk messaging, and persona management.

Target Audience: Product growth teams and software developers seeking feedback from simulated personas.

Tech Stack:

Frontend: Next.js (React framework), Radix UI (accessible components), Tabler Icons (icon library).
Backend: Supabase (PostgreSQL database, authentication, real-time features).
AI Integration: Vercel AI SDK (for persona chat functionality).
Deployment: Vercel (hosting and CI/CD).
User Stories
As a product manager, I want to create a new persona with a custom personality and role so I can simulate feedback from a specific type of user.
As a developer, I want to edit a persona’s attributes and system prompt so I can refine their responses over time.
As a researcher, I want to start a messaging thread with a persona to discuss their pain points or get feedback on a feature idea.
As a growth strategist, I want to send a bulk message to multiple personas so I can gather varied feedback efficiently.
As a UX designer, I want a clean, iMessage-like interface so I can easily navigate and manage multiple persona conversations.
As a user, I want to open a new thread with a persona to clear past context and start fresh when needed.
Functional Requirements

1. Persona Management
   Create Persona:
   Form to input persona details: Name, Age, Experience, Personality, Pain Points, Values in Software, and System Prompt (textarea for custom AI behavior).
   Save persona to Supabase database.
   Edit Persona:
   View list of existing personas.
   Select a persona to edit its details and system prompt.
   Updates sync to Supabase and reflect in active threads.
   Delete Persona:
   Option to remove a persona from the list (soft delete in Supabase).
2. Messaging Interface
   iMessage-Style UX:
   Left sidebar: List of personas (clickable to open threads).
   Right panel: Active thread with chat bubbles (user messages on right, persona on left).
   Responsive design mimicking iMessage desktop layout using Radix UI components.
   Thread Management:
   Start a new thread with a persona (clears past context).
   View thread history for the selected persona and thread.
   Tabler Icons for actions (e.g., "New Thread" as a plus icon, "Send" as a paper plane).
3. Chat Functionality
   Persona Chat:
   Messages sent to a persona trigger a response via Vercel AI SDK, using the persona’s system prompt to shape the AI’s tone and perspective.
   Real-time messaging powered by Supabase real-time subscriptions.
   Bulk Messaging:
   Select multiple personas from the sidebar (checkboxes).
   Compose a single message and send it to all selected personas, creating a new thread for each.
   Responses appear in individual threads.
4. Core Features
   New Thread: Button to reset context and start a fresh conversation with a persona.
   Message Input: Text input at the bottom of each thread, with a send button (Tabler Icon: Send).
   Persona List: Sidebar shows all personas with basic info (e.g., name, role); clicking opens the latest thread or starts a new one.
   Non-Functional Requirements
   Performance: App loads in under 2 seconds; chat responses return within 1-2 seconds.
   Scalability: Supports up to 50 personas and 100 threads per user initially, leveraging Supabase’s scalability.
   Usability: Intuitive iMessage-like design using Radix UI primitives for accessibility and consistency.
   Security: Supabase authentication ensures only authorized users access their personas and threads.
   Reliability: Messages and persona data persist across sessions via Supabase PostgreSQL.
   App Structure
   Below is a high-level structure for your Next.js app:

text
Wrap
Copy
persona-chat/
├── app/
│ ├── layout.tsx # Root layout with Radix UI Theme
│ ├── page.tsx # Marketing Home page
│ ├── app/
│ │ └── layout.tsx # App layout
│ │ └── page.tsx # App page (Persona list + chat UI)
│ ├── login/
│ │ └── page.tsx # Login page
│ ├── api/
│ │ └── chat/route.ts # API route for Vercel AI SDK integration
├── components/
│ ├── PersonaList.tsx # Sidebar with persona cards/checkable list
│ ├── ChatThread.tsx # Messaging thread UI
│ ├── PersonaForm.tsx # Form for creating/editing personas
│ ├── BulkMessage.tsx # Modal for bulk messaging
│ └── MessageBubble.tsx # Individual chat bubble component
├── lib/
│ ├── supabase.ts # Supabase client setup
│ ├── ai.ts # Vercel AI SDK setup for persona responses
├── public/ # Static assets (e.g., Tabler Icons)
├── styles/ # Tailwind CSS or global styles
└── README.md # Project docs
Database Schema (Supabase)
Table: personas
Column Type Description
id uuid Primary key (auto-generated)
user_id uuid Foreign key to Supabase auth.users
name text Persona name
age int Persona age
experience text Persona experience
personality text Persona personality
pain_points text Persona pain points
values text Persona software values
system_prompt text Custom AI prompt for persona behavior
created_at timestamp Creation timestamp
updated_at timestamp Last update timestamp
Table: threads
Column Type Description
id uuid Primary key (auto-generated)
user_id uuid Foreign key to Supabase auth.users
persona_id uuid Foreign key to personas table
title text Thread title (e.g., "Feature Feedback")
created_at timestamp Creation timestamp
Table: messages
Column Type Description
id uuid Primary key (auto-generated)
thread_id uuid Foreign key to threads table
sender text "user" or "persona"
content text Message text
created_at timestamp Timestamp of message
API Endpoints
POST /api/chat:
Input: { threadId, message, personaId }
Output: AI-generated persona response via Vercel AI SDK.
Logic: Fetch persona’s system prompt, send message to AI, save response to messages table.
Wireframe Sketch
text
Wrap
Copy
+-------------------+---------------------+
| Persona List | Chat Thread |
| +---------------+ | +-----------------+ |
| | [ ] Alex | | | Alex: Hi! | |
| | [ ] Jamie | | | You: Thoughts?| |
| | [ ] Priya | | +-----------------+ |
| +---------------+ | [Message Input] |
| [New Persona] | [New Thread] |
| [Bulk Message] | |
+-------------------+---------------------+
Left Sidebar: Persona list with checkboxes for bulk messaging, buttons for new persona and bulk message.
Right Panel: Active thread with chat bubbles, input field, and new thread button.
Implementation Notes
Frontend: Use Next.js App Router, Radix UI for components (e.g., Checkbox, Textarea, Button), and Tabler Icons for intuitive UX.
Backend: Supabase handles auth, data storage, and real-time updates (e.g., new messages).
AI: Vercel AI SDK integrates with an AI model (e.g., OpenAI or Anthropic), using the persona’s system prompt to customize responses.
Styling: Leverage Tailwind CSS (included in Next.js) for a clean, iMessage-inspired look.
