const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const isWindows = os.platform() === 'win32';

function startBrowser(browser, url) {
    let command;

    if (isWindows) {
        if (browser === 'chrome') {
            command = `start chrome ${url}`;
        } else if (browser === 'firefox') {
            command = `start firefox ${url}`;
        } else {
            return false;
        }
        exec(command, (error, stdout, stderr) => {
            if (error) console.error(`Error starting browser: ${error.message}`);
            if (stderr) console.error(`Browser stderr: ${stderr}`);
        });
    } else {
        if (browser === 'chrome') {
            command = 'google-chrome';
        } else if (browser === 'firefox') {
            command = 'firefox';
        } else {
            return false;
        }
        const process = spawn(command, [url]);
        process.on('error', (err) => {
            console.error(`Failed to start browser: ${err.message}`);
        });
    }
    return true;
}

function stopBrowser(browser) {
    let command;

    if (isWindows) {
        if (browser === 'chrome') {
            command = 'taskkill /IM chrome.exe /F';
        } else if (browser === 'firefox') {
            command = 'taskkill /IM firefox.exe /F';
        } else {
            return false;
        }
    } else {
        if (browser === 'chrome') {
            command = 'pkill chrome';
        } else if (browser === 'firefox') {
            command = 'pkill firefox';
        } else {
            return false;
        }
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping browser: ${error.message}`);
            return false;
        }
        if (stderr) {
            console.error(`Browser stderr: ${stderr}`);
        }
    });
    return true;
}

function cleanupBrowserData(browser) {
    let profilePath;
    if (browser === 'chrome') {
        profilePath = isWindows ? path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data')
            : path.join(os.homedir(), '.config', 'google-chrome');
    } else if (browser === 'firefox') {
        profilePath = isWindows ? path.join(os.homedir(), 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'Profiles')
            : path.join(os.homedir(), '.mozilla', 'firefox');
    } else {
        return false;
    }

    try {
        if (fs.existsSync(profilePath)) {
            fs.rmSync(profilePath, { recursive: true, force: true });
            return true;
        }
    } catch (err) {
        console.error(`Error cleaning up ${browser}:`, err);
        return false;
    }
    return false;
}

// Routes
app.get('/start', (req, res) => {
    const { browser, url } = req.query;
    if (!browser || !url) {
        return res.status(400).json({ status: 'failed', reason: 'missing parameters' });
    }

    if (startBrowser(browser, url)) {
        return res.json({ status: 'started', browser, url });
    }
    return res.status(400).json({ status: 'failed', reason: 'invalid browser' });
});

app.get('/stop', (req, res) => {
    const { browser } = req.query;
    if (!browser) {
        return res.status(400).json({ status: 'failed', reason: 'missing parameters' });
    }

    if (stopBrowser(browser)) {
        return res.json({ status: 'stopped', browser });
    }
    return res.status(400).json({ status: 'failed', reason: 'could not stop the browser or invalid browser' });
});

app.get('/cleanup', (req, res) => {
    const { browser } = req.query;
    if (!browser) {
        return res.status(400).json({ status: 'failed', reason: 'missing parameters' });
    }

    if (cleanupBrowserData(browser)) {
        return res.json({ status: 'cleaned', browser });
    }
    return res.status(400).json({ status: 'failed', reason: 'cleanup failed or invalid browser' });
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
