const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'sample.txt'); // Path to your log file
const PORT = 8080; // Port for WebSocket server

// Create a WebSocket server
const server = new WebSocket.Server({ port: PORT });

// Initialize file position
let filePosition = 0;

// Handle incoming WebSocket connections
server.on('connection', (ws) => {
    // Send the last 10 lines of the log file to the client
    sendLast10Lines(ws);

    // Watch for changes in the log file
    fs.watch(LOG_FILE, (eventType) => {
        if (eventType === 'change') {
            // Send new lines to the client when the file is updated
            sendNewLines(ws);
        }
    });
});

// Function to send the last 10 lines of the log file to the client
function sendLast10Lines(ws) {
    const CHUNK_SIZE = 64 * 1024; // Define the chunk size (64KB)
    const stats = fs.statSync(LOG_FILE); // Get file statistics
    let buffer = Buffer.alloc(CHUNK_SIZE); // Allocate buffer for reading
    let lines = []; // Store the last 10 lines

    // Open the file in read-only mode
    let fd = fs.openSync(LOG_FILE, 'r');
    let position = stats.size; // Start reading from the end of the file

    // Read backwards until we have at least 10 lines
    while (lines.length < 10 && position > 0) {
        const readSize = Math.min(CHUNK_SIZE, position); // Adjust read size
        position -= readSize;

        // Read chunk from file
        fs.readSync(fd, buffer, 0, readSize, position);
        const content = buffer.toString('utf8', 0, readSize);

        // Add lines to the beginning of the array
        lines = content.split('\n').concat(lines);
    }

    fs.closeSync(fd); // Close the file after reading

    // Send the last 10 lines to the client
    lines = lines.slice(-10).join('\n');
    ws.send(lines);
}

// Function to send new lines of the log file to the client
function sendNewLines(ws) {
    const stats = fs.statSync(LOG_FILE); // Get the latest file statistics

    // Check if the file has grown since the last read
    if (stats.size > filePosition) {
        // Create a stream to read new data
        const readStream = fs.createReadStream(LOG_FILE, { start: filePosition });
        let newData = '';

        // Accumulate new data as it is read
        readStream.on('data', (chunk) => {
            newData += chunk.toString();
        });

        // When the stream ends, send new data to the client
        readStream.on('end', () => {
            ws.send(newData); // Send new data to the client
            filePosition = stats.size; // Update the file position
        });
    }
}

console.log(`WebSocket server is listening on ws://localhost:${PORT}`);