// clients/clientManager.js
const { Client, RemoteAuth } = require('whatsapp-web.js');
//const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');
//const accountsConfig = require('./config'); // Your accounts configuration
const uri = "mongodb+srv://barodsoft:T4OGbW4jfT6tZXad@cluster0.texunwy.mongodb.net/customers?retryWrites=true&w=majority&appName=Cluster0";

// Store active clients
const clients = {};
const qrcodes = {};
const cstatus = {};
//var qrstr='';

async function initializeClients(clientId) {
    // Connect to MongoDB once
    qrcodes[clientId] = '';
    cstatus[clientId] = '';
    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if DB connection fails
    }

    const store = new MongoStore({ mongoose: mongoose });
    
        const client = new Client({
            authStrategy: new RemoteAuth({
                store: store,
                clientId: clientId, // Crucial for multi-session
                backupSyncIntervalMs: 60 * 1000 // Sync session data every minute
            }),
            puppeteer: {headless:true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    //'--disable-dev-shm-usage', // Recommended for Docker/headless environments
                    //'--disable-accelerated-2d-canvas',
                    //'--no-first-run',
                    //'--no-zygote',
                    // '--single-process', // Can sometimes help, but may cause issues on Windows
                ],
                // headless: true, // Set to false for development to see the browser
            }
        });

        client.on('qr', (qr) => {
            //qrstr = qr;
            qrcodes[clientId] = qr;
            cstatus[clientId] = '';
            console.log(`QR RECEIVED for ${clientId}. Scan with your phone:`);
            //qrcode.generate(qr, { small: true });
        });

        client.on('ready', () => {
            qrcodes[clientId] = '';
            cstatus[clientId] = 'ready';
            console.log(`Client ${clientId} is ready!`);
            // You can perform account-specific actions here if needed
        });

        client.on('authenticated', () => {
            qrcodes[clientId] = '';
            cstatus[clientId] = 'authenticated';
            console.log(`Client ${clientId} authenticated!`);
        });

        client.on('auth_failure', (msg) => {
            qrcodes[clientId] = '';
            cstatus[clientId] = 'auth_failure';
            console.error(`Authentication failure for ${clientId}!`, msg);
        });

        client.on('disconnected', (reason) => {
            qrcodes[clientId] = '';
            cstatus[clientId] = 'disconnected';
            console.log(`Client ${clientId} was disconnected`, reason);
            // Handle reconnection logic or notify admin
        });

        // Store the client instance
        clients[clientId] = client;
        //qrcodes[clientId] = qrstr;
        // Initialize the client
        client.initialize();
    
}

function getClient(clientId) {
    return clients[clientId];
}

function getQrCode(clientId) {
    return qrcodes[clientId];
}

function getStatus(clientId) {
    return cstatus[clientId];
}

module.exports = {
    initializeClients,
    getClient,
    getQrCode,
    getStatus,
    qrcodes,
    cstatus,
    clients // Export all clients for direct access if needed
};
