// const { Client, RemoteAuth } = require('whatsapp-web.js');
// const { MongoStore } = require('wwebjs-mongo');
// const mongoose = require('mongoose');

// //const express = require('express');
// //const app = express();
// //const port = process.env.port || 3001;
    
// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://barodsoft:T4OGbW4jfT6tZXad@cluster0.texunwy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//     // Connect to MongoDB
// mongoose.connect(uri).then(() => {
//         // Initialize MongoStore with Mongoose
//         const store = new MongoStore({ mongoose: mongoose });
    
//         // Initialize the WhatsApp client with RemoteAuth strategy
//         const client = new Client({
//           puppeteer: {headless:false, 
//             args: [
//                 '--no-sandbox', 
//                 '--disable-setuid-sandbox',
//             ]},
//           authStrategy: new RemoteAuth({
//             store: store,
//             backupSyncIntervalMs: 300000 // Optional: Sync interval in milliseconds
//           })
//         });
    
//         // Client event handlers
//         client.on('qr', qr => {
//           // Display QR code to the user for scanning
//           console.log('QR RECEIVED', qr);
//         });
    
//         client.on('ready', () => {
//           console.log('Client is ready!');
//         });
    
//         client.on('message', msg => {
//           console.log('Message received', msg.body);
//         });

//         client.on('remote_session_saved', () => {
//             console.log('Session saved to MongoDB!');
//         });
        
//         // Initialize the client
//         client.initialize();

//         //app.listen(port, () => {
//         //  console.log(`API running at http://localhost:${port}`);
//         //});
//       })
//       .catch(err => {
//         console.error('MongoDB connection error:', err);
// });

//require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const app = express();
const port = process.env.port || 3001;
const clientManager = require('./clientManager');

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

//var sId ='';

async function main(clientId) {
    await clientManager.initializeClients(clientId);

    //console.log('All message sending attempts completed!');
}

//main('user1').catch(console.error);

// Get Qr Code
app.post('/qrcode', async (req, res) => {
    const q = req.body;
    //console.log(q.sessionId);
    var qrstr = await clientManager.getQrCode(q.sessionId);

    res.json({ qrcodedata : qrstr});
});

// Get client status
app.post('/status', async (req, res) => {
    const q = req.body;
    var cstatus = await clientManager.getStatus(q.sessionId);
    res.json({ status: cstatus});
});


// Get Qr Code
// app.post('/start', async (req, res) => {
//     const q = req.body;
//     //sId=q.sessionId;
//     //console.log(sId);
//     await main(q.sessionId).catch(console.error);
//     res.json({ status: true});
// });

// Send a text message
app.post('/send-message', async (req, res) => {
    const q = req.body;
    //const { number, message } = req.body;
    //console.log(q.sessionId);
    const client = clientManager.getClient(q.sessionId);

    if (!q.sessionId || !q.number || !q.message) {
        return res.status(400).json({ status: false, message: 'Missing sessionid, number or message' });
    }

    client.getState().then((data)=>{
        //console.log(data)
        if (data != 'CONNECTED') {
            return res.json({status: false, message:'Whatsapp not CONNECTED'})
        }
    })

    const chatId = q.number.endsWith('@c.us') ? q.number : `${q.number}@c.us`;
    //const client = clientManager.getClient(q.sessionId);
    try {
        await client.sendMessage(chatId, q.message);
        res.json({ status: true, message: 'Message sent!' });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Error sending message', error });
    }
});

// Send a media file (base64 format)
app.post('/send-media', async (req, res) => {    
    const q = req.body;
    //const { number, message } = req.body;
    //console.log(q.sessionId);
    const client = clientManager.getClient(q.sessionId);

    if (!q.sessionId || !q.number || !q.message) {
        return res.status(400).json({ status: false, message: 'Missing sessionid, number or message' });
    }

    client.getState().then((data)=>{
        //console.log(data)
        if (data != 'CONNECTED') {
            return res.json({status: false, message:'Whatsapp not CONNECTED'})
        }
    })

    const chatId = q.number.endsWith('@c.us') ? q.number : `${q.number}@c.us`;
    try {
        const media = new MessageMedia(q.mimetype, q.data, q.filename);
        await client.sendMessage(chatId, media);
        res.json({ status: true, message: 'Media sent!' });
    } 
    catch (error) {
        res.status(500).json({ status: false, message: 'Error sending media', error });
        await client.destroy();
    }

});

// Check client status
app.post('/start', (req, res) => {
    const q = req.body;
    //const { number, message } = req.body;
    //console.log(q.sessionId);
    const client = clientManager.getClient(q.sessionId);

    client.getState().then((data)=>{
        //console.log(data)
        res.json({status: data})
    })
});


app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
});
