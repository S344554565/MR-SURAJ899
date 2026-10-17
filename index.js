const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer setup (File upload ke liye)
const upload = multer({ dest: 'uploads/' });

// Static files aur form data handle karne ke liye
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Live Dashboard (SSE) ke liye clients list
let clients = [];

// Live Logs Endpoint (Frontend isse connect karega)
app.get('/api/live-logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    clients.push(res);

    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

// Logs bhejne ka function
function sendLog(message, type = 'info') {
    const data = JSON.stringify({ message, type, time: new Date().toLocaleTimeString() });
    clients.forEach(client => client.write(`data: ${data}\n\n`));
}

// Main Form Submit Endpoint
app.post('/api/start-bulk', upload.single('fileUpload'), async (req, res) => {
    try {
        // 1. Data Receive karein
        const { hereName, uidGroup, lastName, token, timeDelay } = req.body;
        const file = req.file;

        // Validation
        if (!token || !uidGroup) {
            return res.status(400).json({ error: 'Token aur UID Group zaroori hai!' });
        }

        res.json({ success: true, message: 'Process shuru ho gaya hai...' });

        // 2. Live Dashboard mein logs bhejna shuru karein
        sendLog(`🚀 Process Initiated by ${hereName} ${lastName}`, 'success');
        sendLog(`🎯 Target UID: ${uidGroup}`, 'info');
        sendLog(`⏱️ Time Delay: ${timeDelay} seconds`, 'info');
        
        if (file) {
            sendLog(`📁 File Uploaded: ${file.originalname}`, 'success');
            // Yahan aap file read kar sakte hain (e.g., fs.readFileSync)
        }

        // 3. Simulation: Messages bhejne ka loop
        sendLog(`🔑 Token received (Hidden for security)`, 'warning');
        sendLog(`⚡ Starting bulk process...`, 'info');

        let messageCount = 1;
        
        // Yahan aap apna actual message sending API call logic dalenge
        const intervalId = setInterval(() => {
            if (messageCount > 5) { // Demo ke liye 5 messages ke baad rukega
                clearInterval(intervalId);
                sendLog(`✅ Bulk Process Completed! Total sent: ${messageCount - 1}`, 'success');
                return;
            }

            // Simulate API Call
            sendLog(`[+] Sending message ${messageCount} to UID: ${uidGroup}...`, 'info');
            
            // TODO: Yahan actual API request dalni hai (e.g., axios.post)
            // await axios.post('https://api.example.com/send', { token, uidGroup, message: 'Hello' });

            messageCount++;
        }, parseInt(timeDelay) * 1000 || 3000); // Default 3 sec delay

    } catch (error) {
        sendLog(`❌ Error: ${error.message}`, 'error');
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
