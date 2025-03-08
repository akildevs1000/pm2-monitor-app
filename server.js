const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();
const PORT = 6644;
const SEND_MESSAGE_URL = "https://wa.mytime2cloud.com/send-message";
const CLIENT_ID = "AE00027_1741180197755";
const RECIPIENT = "923108559858";

app.use(express.json());

// Endpoint to list stopped PM2 processes
app.get('/pm2/stopped', (req, res) => {
    exec('pm2 jlist', (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: error.message });
        if (stderr) return res.status(500).json({ error: stderr });

        try {
            const processes = JSON.parse(stdout);
            const stoppedProcesses = processes.filter(proc => proc.pm2_env.status === 'stopped');
            res.json(stoppedProcesses.map(proc => ({ id: proc.pm_id, name: proc.name, status: proc.pm2_env.status })));
        } catch (parseError) {
            res.status(500).json({ error: "Error parsing PM2 JSON output" });
        }
    });
});

// Endpoint to restart a stopped PM2 process using GET request
app.get('/pm2/restart/:id', (req, res) => {
    const processId = req.params.id;

    exec(`pm2 restart ${processId}`, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: error.message });
        if (stderr) return res.status(500).json({ error: stderr });

        res.json({ message: `Process ${processId} restarted successfully` });
    });
});

// Function to send stopped processes list via API in message format
const sendStoppedProcesses = async () => {
    exec('pm2 jlist', async (error, stdout, stderr) => {
        if (error || stderr) return;
        
        try {
            const processes = JSON.parse(stdout);
            const stoppedProcesses = processes.filter(proc => proc.pm2_env.status === 'stopped');
            
            if (stoppedProcesses.length > 0) {
                let messageText = "Dear Admin,\n\nFollowing Processes are stopped.\n\n";
                stoppedProcesses.forEach(proc => {
                    messageText += `Process: id:${proc.pm_id}, name:${proc.name}\n`;
                });
                
                messageText += "\nTo restart any of the stopped processes, click the link below:\n";
                messageText += "https://server.mytime2cloud.com/pm2/restart/PROCESS_ID\n";


                messageText += "\nTo get list of the stopped processes, click the link below:\n";
                messageText += "https://server.mytime2cloud.com/pm2/stopped\n";

                
                
                const data = {
                    clientId: CLIENT_ID,
                    recipient: RECIPIENT,
                    text: messageText
                };
                console.log("🚀 ~ exec ~ data:", data)
                
                await axios.post(SEND_MESSAGE_URL, data);
            }
        } catch (parseError) {
            console.error("Error parsing PM2 JSON output:", parseError);
        }
    });
};


// Send stopped processes immediately and then every 15 minutes
sendStoppedProcesses();
setInterval(sendStoppedProcesses, 60 * 60 * 1000);

app.listen(PORT, '139.59.69.241', () => {
    console.log(`Server is running on http://139.59.69.241:${PORT}`);
});
