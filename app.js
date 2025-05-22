// PlushPal - Headless OpenAI Realtime API client for Raspberry Pi
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import wrtc from 'wrtc';
import record from 'node-record-lpcm16';
import player from 'play-sound';
import https from 'https';

// Extract RTCPeerConnection from wrtc
const { RTCPeerConnection } = wrtc;

// Load environment variables
dotenv.config();

// Initialize readline interface for CLI control
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Audio settings
const SAMPLE_RATE = 48000;
const AUDIO_DEVICE = 'plughw:1,0'; // WM8960 sound card
const soundPlayer = player({
  player: 'aplay', // Use ALSA's aplay command
  device: AUDIO_DEVICE // Specify the WM8960 sound card
});

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp directory for audio files if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// WebRTC variables
let peerConnection = null;
let dataChannel = null;
let recording = null;
let conversationActive = false;

// Get an ephemeral key from OpenAI
async function getEphemeralKey() {
  console.log('Getting ephemeral key from OpenAI...');
  
  const data = JSON.stringify({
    model: "gpt-4o-realtime-preview-2024-12-17",
    voice: "verse",
  });
  
  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/realtime/sessions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Length': data.length
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData.client_secret.value);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Initialize WebRTC connection
async function initWebRTC(ephemeralKey) {
  console.log('Initializing WebRTC connection...');
  
  try {
    // Create peer connection
    peerConnection = new RTCPeerConnection();
    
    // Add connection state change listener
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state: ${peerConnection.connectionState}`);
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);
    };
    
    // Setup audio output
    peerConnection.ontrack = (e) => {
      console.log('Received audio track from OpenAI');
      
      // Create a MediaRecorder to capture the audio data
      try {
        // When we get audio from OpenAI, we need to save it to a file and play it
        const mediaStream = new MediaStream([e.track]);
        const tempFile = path.join(tempDir, `response-${Date.now()}.wav`);
        
        // Play a test sound to verify audio playback is working
        console.log('Attempting to play audio via aplay...');
        soundPlayer.play('/usr/share/sounds/alsa/Front_Center.wav', (err) => {
          if (err) {
            console.error('Error playing test sound:', err);
          } else {
            console.log('Test sound played successfully');
          }
        });
        
        // TODO: For full implementation, we need to:
        // 1. Record the audio track to a file
        // 2. Play the file as it's being recorded or when complete
        console.log('Audio handling needs further implementation');
      } catch (error) {
        console.error('Error handling audio track:', error);
      }
    };
    
    // Setup data channel
    dataChannel = peerConnection.createDataChannel('oai-events');
    dataChannel.addEventListener('message', (e) => {
      const event = JSON.parse(e.data);
      console.log('Received event:', event.type);
      
      // Handle events from OpenAI
      if (event.type === 'audio.chunk') {
        handleAudioChunk(event);
      }
    });
    
    // Create and set local description
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });
    await peerConnection.setLocalDescription(offer);
    
    // Connect to OpenAI Realtime API
    const baseUrl = 'https://api.openai.com/v1/realtime';
    const model = 'gpt-4o-realtime-preview-2024-12-17';
    
    const response = await fetch(`${baseUrl}?model=${model}`, {
      method: 'POST',
      body: peerConnection.localDescription.sdp,
      headers: {
        'Authorization': `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const answerSdp = await response.text();
    const answer = {
      type: 'answer',
      sdp: answerSdp
    };
    
    await peerConnection.setRemoteDescription(answer);
    console.log('Connected to OpenAI Realtime API');
    
    return true;
  } catch (error) {
    console.error('WebRTC initialization error:', error);
    return false;
  }
}

// Start recording from microphone
function startRecording() {
  console.log('Starting microphone recording...');
  
  recording = record.record({
    sampleRate: SAMPLE_RATE,
    device: AUDIO_DEVICE,
    channels: 1,
    recorder: 'arecord', // Use ALSA's arecord instead of SoX
    audioType: 'wav'
  });
  
  recording.stream()
    .on('data', (chunk) => {
      // Send audio data to WebRTC
      if (peerConnection && peerConnection.connectionState === 'connected') {
        // In a full implementation, we would:
        // 1. Convert the raw PCM to the right format for WebRTC
        // 2. Add it to the audio track
        console.log('Audio data captured');
      }
    })
    .on('error', (err) => {
      console.error('Recording error:', err);
    });
    
  console.log('Recording started');
}

// Stop recording
function stopRecording() {
  if (recording) {
    recording.stop();
    recording = null;
    console.log('Recording stopped');
  }
}

// Start conversation
function startConversation() {
  if (dataChannel && dataChannel.readyState === 'open') {
    const event = {
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: 'Hello, how can I help you today?'
      }
    };
    
    dataChannel.send(JSON.stringify(event));
    console.log('Started conversation');
    startRecording();
    conversationActive = true;
  } else {
    console.log('Data channel not ready. Cannot start conversation.');
  }
}

// Stop conversation
function stopConversation() {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify({ type: 'response.stop' }));
    console.log('Stopped conversation');
    stopRecording();
    conversationActive = false;
  }
}

// Handle audio chunks from OpenAI
function handleAudioChunk(event) {
  try {
    if (event.audio && event.audio.data) {
      // Decode base64 audio data
      const audioData = Buffer.from(event.audio.data, 'base64');
      
      // Save to temporary file
      const tempFile = path.join(tempDir, `chunk-${Date.now()}.wav`);
      fs.writeFileSync(tempFile, audioData);
      
      // Play the audio file
      console.log('Playing audio chunk...');
      soundPlayer.play(tempFile, (err) => {
        if (err) {
          console.error('Error playing audio chunk:', err);
        } else {
          // Remove the file after playing
          fs.unlinkSync(tempFile);
        }
      });
    }
  } catch (error) {
    console.error('Error handling audio chunk:', error);
  }
}

// Cleanup function for program exit
function cleanup() {
  console.log('Cleaning up...');
  stopRecording();
  if (peerConnection) {
    peerConnection.close();
  }
  rl.close();
  process.exit(0);
}

// Main function
async function main() {
  console.log('Starting PlushPal...');
  console.log('Press Ctrl+C to exit');
  
  try {
    // Get ephemeral key from OpenAI
    const ephemeralKey = await getEphemeralKey();
    console.log('Got ephemeral key');
    
    // Initialize WebRTC
    const success = await initWebRTC(ephemeralKey);
    
    if (success) {
      console.log('\nPlushPal is ready!');
      console.log('Press Enter to start/stop a conversation');
      
      rl.on('line', () => {
        if (!conversationActive) {
          startConversation();
        } else {
          stopConversation();
        }
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    } else {
      console.error('Failed to initialize WebRTC');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Start the application
main(); 