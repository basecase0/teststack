const { v4: uuidv4 } = require('uuid');
const PriorityQueue = require('js-priority-queue');

class KeyService {
    constructor() {
        this.keys = new Map(); // Hash Map to store key data
        this.blockedKeys = new Set(); // Set to manage blocked keys
        this.expiryQueue = new PriorityQueue({ comparator: (a, b) => a.expiry - b.expiry }); // Min-Heap for key expiry
        this.blockTimeout = 60000; // 60 seconds block timeout
    }

    // createKey() {
    //     const id = uuidv4();
    //     const createdAt = Date.now();
    //     const expiry = createdAt + 5 * 60 * 1000; // 5 minutes expiry
    //     const keyData = { id, createdAt, expiry, blocked: false };
    //     this.keys.set(id, keyData);
    //     this.expiryQueue.queue(keyData);
    //     return id;
    // }
    createKey() {
        const id = uuidv4(); // Generate a unique key ID
        const createdAt = Date.now(); // Get current timestamp
        const expiry = createdAt + 5 * 60 * 1000; // Expiry time is 5 minutes from creation
        const keyData = { id, createdAt, expiry, isBlocked: false, blockedAt: null }; // Include blockedAt property
        this.keys.set(id, keyData); // Add key data to Hash Map
        this.expiryQueue.queue(keyData); // Add key to the Priority Queue (Min-Heap)
        return id; // Return the generated key ID
    }
    
    // getAvailableKey() {
    //     while (this.expiryQueue.length > 0) {
    //         const topKey = this.expiryQueue.peek();
    //         if (topKey.expiry < Date.now()) {
    //             this.expiryQueue.dequeue(); // Remove expired key
    //             this.keys.delete(topKey.id);
    //             continue;
    //         }
    //         if (!this.blockedKeys.has(topKey.id)) {
    //             // this.blockedKeys.add(topKey.id);
    //             // topKey.blocked = true;
    //             this.blockKey(topKey)
    //             return topKey.id;
    //         }
    //         this.expiryQueue.dequeue();
    //     }
    //     return null;
    // }
    getAvailableKey() {
        for (let [keyId, keyData] of this.keys.entries()) {
            // Check if the key has expired
            if (keyData.expiry < Date.now()) {
                this.keys.delete(keyId); // Delete expired key from the keys map
                continue; // Move to the next key
            }
    
            // Check if the key is not blocked
            if (!this.blockedKeys.has(keyId)) {
                this.blockKey(keyData); // Block the key
                return keyId; // Return the valid key ID
            }
        }
    
        // If no valid key is found, return null
        return null;
    }
    

    blockKey(keyData) {
        keyData.blocked = true; // Mark the key as blocked
        keyData.blockedAt = Date.now(); // Record the blocked time
        this.blockedKeys.add(keyData.id); // Add key to the blocked set
        
        // Schedule auto-release after 60 seconds if not unblocked
        setTimeout(() => {
            if (this.blockedKeys.has(keyData.id)) {
                this.unblockKey(keyData.id); // Automatically unblock the key
            }
        }, this.blockTimeout); // Block timeout is 60 seconds
    }
    

    unblockKey(id) {
        if (this.blockedKeys.has(id)) {
            this.blockedKeys.delete(id);
            const keyData = this.keys.get(id);
            if (keyData){
                keyData.blockedAt = null;
                keyData.blocked = false;
            }
            return true;
        }
        return false;
    }

    deleteKey(id) {
        this.blockedKeys.delete(id);
        const keyData = this.keys.get(id);
        if (keyData) {
            this.keys.delete(id);
            return true;
        }
        return false;
    }

    getKeyInfo(id) {
        return this.keys.get(id) || null;
    }

    keepAliveKey(id) {
        const keyData = this.keys.get(id);
        if (keyData && keyData.expiry >= Date.now()) {
            keyData.expiry = Date.now() + 5 * 60 * 1000; // Extend expiry by 5 minutes
            this.expiryQueue.queue(keyData); // Reinsert with updated expiry
            return true;
        }
        return false;
    }

    cleanupExpiredKeys() {
        const now = Date.now();
        while (this.expiryQueue.length > 0 && this.expiryQueue.peek().expiry < now) {
            const expiredKey = this.expiryQueue.dequeue();
            this.keys.delete(expiredKey.id);
            this.blockedKeys.delete(expiredKey.id);
        }
    }

    getAllKeys() {
        const keysArray = [];
        for (let [keyId, keyData] of this.keys.entries()) {
            if(keyData.expiry>Date.now()){
                keysArray.push({
                    id: keyId,
                    isBlocked: keyData.blocked,
                    blockedAt: keyData.blockedAt,
                    createdAt: keyData.createdAt,
                    expiry: keyData.expiry
                });
            }
        }
        return keysArray;
    }
    
}

module.exports = KeyService;