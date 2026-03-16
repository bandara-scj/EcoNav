import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const distPath = path.join(__dirname, 'dist');

// Serve static files EXCEPT index.html
app.use(express.static(distPath, { index: false }));

// Serve index.html with injected env variables
app.get('*', (req, res) => {
  try {
    let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    // Inject script before </head>
    const script = `<script>window.__ENV__ = { GEMINI_API_KEY: "${apiKey}" };</script>`;
    html = html.replace('</head>', `${script}</head>`);
    
    res.send(html);
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).send('Server Error');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
