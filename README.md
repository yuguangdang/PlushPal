# OpenAI WebRTC Audio Chat

A simple web application that demonstrates real-time audio conversation with OpenAI's Realtime API using WebRTC. This application allows users to have voice conversations with OpenAI's language models.

## Features

- Real-time audio streaming using WebRTC
- Two-way audio communication
- Simple and intuitive UI
- Support for both light and dark themes
- Real-time status updates

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key with access to Realtime API
- Modern web browser with WebRTC support

## Setup

1. Clone the repository:
```bash
git clone https://github.com/notedit/openai-webrtc-play.git
cd openai-webrtc-play
```

2. Install dependencies:
```bash
npm install
```

3. Set up your OpenAI API key:
```bash
export OPENAI_API_KEY=your_api_key_here
```

## Running the Application

1. Start the backend server:
```bash
npm run server
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## Usage

1. When the page loads, it will automatically initialize the WebRTC connection
2. Click "Start Recording" to begin a conversation
3. Speak into your microphone
4. The AI's responses will play through your speakers
5. Click "Stop Recording" to end the conversation

## Technical Details

- Frontend: Vanilla JavaScript with Vite
- Backend: Node.js with Express
- API: OpenAI Realtime API with WebRTC
- Real-time communication: WebRTC data channels and media streams

## Security Notes

- The application uses ephemeral API keys for secure client-side connections
- The main OpenAI API key is only used server-side
- All communication is handled through secure WebRTC channels

## Development

The project uses Vite for development and building. Available commands:

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run server   # Start backend server
```

## License

MIT
