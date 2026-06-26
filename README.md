# AI-POS (Artificial Intelligence Personal Operating System)

A premium, full-stack AI chatbot platform inspired by ChatGPT, Claude, and Gemini.

## Features
- **Modern UI**: Built with Next.js 15, Tailwind CSS, and Framer Motion.
- **Multi-Model Support**: Switch between GPT-4o, Claude 3.5, and Gemini 1.5.
- **Auth**: Secure authentication with Google, GitHub, and Email via Auth.js.
- **Persistence**: Chat history stored in PostgreSQL via Prisma.
- **Streaming**: Real-time AI responses using Vercel AI SDK.
- **Dark Mode**: Beautiful, AI-native dark-first design.
- **Responsive**: Fully optimized for mobile, tablet, and desktop.

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui, Zustand, TanStack Query.
- **Backend**: Next.js Server Actions, API Routes, Prisma, PostgreSQL, Redis.
- **AI**: Vercel AI SDK, OpenAI, Anthropic, Google.

## Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd ai-pos
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Copy `.env.example` to `.env` and fill in your credentials.
```bash
cp .env.example .env
```

### 4. Start local services (Optional)
If you have Docker installed:
```bash
docker-compose up -d
```

### 5. Setup the database
```bash
npx prisma migrate dev
```

### 6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Status
- [x] Base Layout & Sidebar
- [x] Chat Interface & Streaming
- [x] Multi-model selection
- [x] Search Modal (Cmd+K)
- [x] Settings Panel
- [x] Authentication Setup
- [ ] File Uploads (In Progress)
- [ ] Voice Input (Planned)
