import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
import { Server } from "socket.io";
import http from "http";
import path from "path";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("Client connected!");

  let audioBuffer = [];

  // Receive audio data in chunks
  socket.on("audio-data", (data) => {
    const binary = atob(data);
    const arrayBuffer = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    audioBuffer.push(Buffer.from(arrayBuffer));
  });

  // Save the audio file and transcribe it when recording stops
  socket.on("stop-recording", async () => {
    const audioFilePath = path.join(__dirname, "recorded_audio.ogg");

    // Write audio data to a file
    fs.writeFileSync(audioFilePath, Buffer.concat(audioBuffer));
    console.log("Audio file saved:", audioFilePath);

    try {
      // Transcribe using Gemini API
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: "audio/ogg",
            fileUri: `file://${audioFilePath}`,
          },
        },
        { text: "Generate a transcript of the speech." },
      ]);

      const transcription = result.response.text();
      console.log("Transcription:", transcription);

      // Send transcription back to the bot
      socket.emit("transcription", transcription);
    } catch (error) {
      console.error("Error during transcription:", error);
      socket.emit("transcription-error", "Transcription failed!");
    }

    // Clear audio buffer
    audioBuffer = [];
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected!");
  });
});

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
