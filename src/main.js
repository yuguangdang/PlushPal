import "./style.css";

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusDiv = document.getElementById("status");

let peerConnection = null;
let dataChannel = null;

async function init() {
  try {
    // 从服务器获取 ephemeral key
    const tokenResponse = await fetch("http://localhost:3000/session");
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${tokenResponse.status}`);
    }
    const tokenData = await tokenResponse.json();
    const EPHEMERAL_KEY = tokenData.client_secret.value;

    // 创建 WebRTC 连接
    peerConnection = new RTCPeerConnection();

    // 设置音频元素播放模型返回的音频
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    peerConnection.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };

    // 设置数据通道
    dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannel.addEventListener("message", (e) => {
      const event = JSON.parse(e.data);
      console.log("Received event:", event);
      updateStatus(`Received: ${event.type}`);
    });

    // 获取麦克风权限并添加音轨
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection.addTrack(stream.getTracks()[0], stream);

    // 创建并设置本地描述
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // 连接到 OpenAI Realtime API
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";

    try {
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`HTTP error! status: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await peerConnection.setRemoteDescription(answer);
      updateStatus("Connected to OpenAI Realtime API");
      startBtn.disabled = false;
    } catch (error) {
      updateStatus(`Connection error: ${error.message}`);
      console.error("Connection error:", error);
    }
  } catch (error) {
    updateStatus(`Initialization error: ${error.message}`);
    console.error("Initialization error:", error);
  }
}

function updateStatus(message) {
  statusDiv.textContent = message;
  console.log(message);
}

startBtn.addEventListener("click", async () => {
  try {
    if (dataChannel && dataChannel.readyState === "open") {
      const event = {
        type: "response.create",
        response: {
          modalities: ["text", "audio"],
          instructions: "Hello, how can I help you today?",
        },
      };
      dataChannel.send(JSON.stringify(event));
      updateStatus("Started conversation");
      startBtn.disabled = true;
      stopBtn.disabled = false;
    }
  } catch (error) {
    updateStatus(`Error starting conversation: ${error.message}`);
  }
});

stopBtn.addEventListener("click", () => {
  try {
    if (dataChannel && dataChannel.readyState === "open") {
      dataChannel.send(JSON.stringify({ type: "response.stop" }));
      updateStatus("Stopped conversation");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  } catch (error) {
    updateStatus(`Error stopping conversation: ${error.message}`);
  }
});

// 初始化应用
init();
