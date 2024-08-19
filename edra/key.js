const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// In-memory data structures for the example
let keysStore = {}; // Key: { createdAt, isBlocked, blockedAt }
let blockedKeys = {}; // Key: Expiration timestamp
let expirationQueue = []; // Min-heap to manage expiration times

// Helper functions to manage priority queue (min-heap)
function heapify() {
    expirationQueue.sort((a, b) => a.expirationTime - b.expirationTime);
}

function addToExpirationQueue(key, expirationTime) {
    expirationQueue.push({ key, expirationTime });
    heapify();
}

function removeFromExpirationQueue(key) {
    expirationQueue = expirationQueue.filter(item => item.key !== key);
    heapify();
}

// Endpoint to generate new API keys
app.post('/keys', (req, res) => {
    const key = uuidv4();
    const createdAt = Date.now();
    keysStore[key] = { createdAt, isBlocked: false, blockedAt: null };
    addToExpirationQueue(key, createdAt + 5 * 60 * 1000); // 5 minutes expiration
    res.status(201).send({ key });
});

// Endpoint to retrieve an available key
app.get('/keys', (req, res) => {
    for (const key in keysStore) {
        if (!keysStore[key].isBlocked) {
            keysStore[key].isBlocked = true;
            keysStore[key].blockedAt = Date.now();
            blockedKeys[key] = Date.now() + 60 * 1000; // 60 seconds block expiration
            res.status(200).send({ key });
            return;
        }
    }
    res.status(404).send({});
});

// Endpoint to get information about a specific key
app.get('/keys/:id', (req, res) => {
    const key = req.params.id;
    if (keysStore[key]) {
        res.status(200).send(keysStore[key]);
    } else {
        res.status(404).send({});
    }
});

// Endpoint to unblock a key
app.put('/keys/:id', (req, res) => {
    const key = req.params.id;
    if (keysStore[key] && keysStore[key].isBlocked) {
        keysStore[key].isBlocked = false;
        keysStore[key].blockedAt = null;
        delete blockedKeys[key];
        res.status(200).send({});
    } else {
        res.status(404).send({});
    }
});

// Endpoint to delete a key
app.delete('/keys/:id', (req, res) => {
    const key = req.params.id;
    if (keysStore[key]) {
        delete keysStore[key];
        removeFromExpirationQueue(key);
        res.status(200).send({});
    } else {
        res.status(404).send({});
    }
});

// Endpoint for key keep-alive functionality
app.put('/keepalive/:id', (req, res) => {
    const key = req.params.id;
    if (keysStore[key]) {
        const newExpirationTime = Date.now() + 5 * 60 * 1000; // Extend for another 5 minutes
        removeFromExpirationQueue(key);
        addToExpirationQueue(key, newExpirationTime);
        res.status(200).send({});
    } else {
        res.status(404).send({});
    }
});

// Background job to handle expiration and automatic key release
setInterval(() => {
    const currentTime = Date.now();
    while (expirationQueue.length > 0 && expirationQueue[0].expirationTime <= currentTime) {
        const { key } = expirationQueue.shift();
        if (keysStore[key] && !blockedKeys[key]) {
            delete keysStore[key]; // Delete expired key
        } else if (blockedKeys[key] && blockedKeys[key] <= currentTime) {
            keysStore[key].isBlocked = false; // Auto-release blocked key after 60 seconds
            delete blockedKeys[key];
        }
    }
}, 1000); // Check every second

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
