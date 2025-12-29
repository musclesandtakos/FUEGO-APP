# FUEGO-APP
fuego version 14

## AI Chatbot Application

A Next.js AI chatbot application built with AI Elements UI components and the Vercel AI SDK.

## Features

- 🎨 Modern UI with AI Elements components
- 💬 Conversation interface with message history
- 📎 File attachment support
- 🔍 Web search integration toggle
- 🤖 Multiple AI model selection
- ♻️ Message retry and copy functionality
- 📱 Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure AI Provider (Important!)

The application is set up with the UI structure but needs an AI provider to be functional. To enable AI functionality:

a. Install an AI provider package (e.g., OpenAI):
```bash
npm install @ai-sdk/openai
```

b. Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_api_key_here
```

c. Update `app/api/chat/route.ts` to use the provider:
```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model, webSearch } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'), // or any other model
    messages: messages,
    system: 'You are a helpful assistant that can answer questions and help with tasks',
  });

  return result.toDataStreamResponse();
}
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build the application for production:
```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main chatbot page
├── components/
│   ├── ai-elements/
│   │   ├── conversation.tsx       # Conversation container
│   │   ├── message.tsx            # Message components
│   │   ├── prompt-input.tsx       # Input components
│   │   ├── sources.tsx            # Sources display
│   │   ├── reasoning.tsx          # Reasoning display
│   │   └── loader.tsx             # Loading indicator
│   └── ui/
│       └── button.tsx             # Button component
└── lib/
    └── utils.ts                   # Utility functions
```

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vercel AI SDK** - AI integration
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons

