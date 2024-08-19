const express = require('express');
const KeyService = require('./KeyService');

const app = express();
const keyService = new KeyService();

// Middleware to clean up expired keys periodically
setInterval(() => keyService.cleanupExpiredKeys(), 60000); // Every minute

// POST /keys - Generate a new key
app.post('/keys', (req, res) => {
    const keyId = keyService.createKey();
    res.status(201).send({ keyId });
});

// GET /keys - Retrieve an available key
app.get('/keys', (req, res) => {
    const keyId = keyService.getAvailableKey();
    if (keyId) {
        res.status(200).send({ keyId });
    } else {
        res.status(404).send({ message: 'No available keys' });
    }
});

// GET /keys/:id - Get key information
// app.get('/keys/:id', (req, res) => {
//     const keyInfo = keyService.getKeyInfo(req.params.id);
//     if (keyInfo) {
//         res.status(200).send(keyInfo);
//     } else {
//         res.status(404).send({ message: 'Key not found' });
//     }
// });
app.get('/keys/:id', (req, res) => {
    const keyInfo = keyService.getKeyInfo(req.params.id);
    if (keyInfo) {
        // Filter out only the required fields
        const response = {
            isBlocked: keyInfo.blocked,
            blockedAt: keyInfo.blockedAt,
            createdAt: keyInfo.createdAt
        };
        res.status(200).send(response);
    } else {
        res.status(404).send({ message: 'Key not found' });
    }
});


// DELETE /keys/:id - Delete a key
app.delete('/keys/:id', (req, res) => {
    const success = keyService.deleteKey(req.params.id);
    if (success) {
        res.status(200).send({ message: 'Key deleted' });
    } else {
        res.status(404).send({ message: 'Key not found' });
    }
});

// PUT /keys/:id - Unblock a key
app.put('/keys/:id', (req, res) => {
    const success = keyService.unblockKey(req.params.id);
    if (success) {
        res.status(200).send({ message: 'Key unblocked' });
    } else {
        res.status(404).send({ message: 'Key not found or not blocked' });
    }
});

// PUT /keepalive/:id - Keep the key alive
app.put('/keepalive/:id', (req, res) => {
    const success = keyService.keepAliveKey(req.params.id);
    if (success) {
        res.status(200).send({ message: 'Key keep-alive successful' });
    } else {
        res.status(404).send({ message: 'Key not found or expired' });
    }
});


app.get('/allkeys', (req, res) => {
    const allKeys = keyService.getAllKeys();
    res.status(200).send(allKeys);
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
