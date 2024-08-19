const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'sample.txt');

// Function to append a new line to the log file
function appendToLog() {
  const timestamp = new Date().toISOString();
  const logMessage = `New log entry at ${timestamp}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) throw err;
    console.log(`Appended to log: ${logMessage.trim()}`);
  });
}

// Append to the log file every 5 seconds
setInterval(appendToLog, 2000);
