# PlushPal

A headless Node.js application that allows voice conversations with OpenAI's Realtime API using WebRTC on a Raspberry Pi with WM8960 Hi-Fi Sound Card HAT.

## Features

- Real-time audio streaming using WebRTC
- Two-way audio communication with OpenAI
- Runs on Raspberry Pi (tested on Pi Zero 2 W)
- Works with WM8960 Hi-Fi Sound Card HAT
- Simple CLI control

## Prerequisites

- Raspberry Pi (Zero 2 W or newer)
- WM8960 Hi-Fi Sound Card HAT properly configured
- Node.js (v14 or higher)
- OpenAI API key with access to Realtime API

## Hardware Setup

1. Connect the WM8960 Hi-Fi Sound Card HAT to your Raspberry Pi
2. Ensure the HAT is properly configured with ALSA
3. Connect a speaker to the HAT's audio output
4. Connect a microphone to the HAT's audio input

## Software Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/PlushPal.git
cd PlushPal
```

2. Install dependencies:
```bash
npm install
```

3. Set up your OpenAI API key:
```bash
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

## Running the Application

Start the application:
```bash
npm start
```

## Usage

1. Press Enter to start a conversation
2. Speak into the microphone
3. The AI's responses will play through the speaker
4. Press Enter again to stop the conversation
5. Press Ctrl+C to exit the application

## Technical Details

- Backend: Node.js with WebRTC
- Audio: ALSA with WM8960 HAT
- API: OpenAI Realtime API with WebRTC
- Real-time communication: WebRTC data channels and media streams

## Troubleshooting

If you encounter issues with audio:
1. Check that your WM8960 HAT is properly detected with `aplay -l` and `arecord -l`
2. Test direct recording/playback with `arecord` and `aplay`
3. Verify volume levels with `alsamixer -c 1`

## License

MIT
