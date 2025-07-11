// 1) Load built-ins and libs before using them
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { google } = require('googleapis');

// 1. Load credentials from base64 env var or fallback to local file
let creds;
if (process.env.GOOGLE_CREDENTIALS_B64) {
  try {
    const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, 'base64').toString('utf8');
    creds = JSON.parse(decoded);
    console.log('Loaded Google credentials from base64 env var.');
    console.log('  client_email    =', creds.client_email);
    console.log('  private_key_id  =', creds.private_key_id);
  } catch (e) {
    console.error('FAILED to decode/parse GOOGLE_CREDENTIALS_B64:', e.message);
    process.exit(1);
  }
} else {
  // Fallback to local file for development
  const keyFile = path.join(__dirname, 'oyster-photo-backend', 'oyster-conservationist-db-5c4b27604473.json');
  if (fs.existsSync(keyFile)) {
    try {
      const raw = fs.readFileSync(keyFile, 'utf8');
      creds = JSON.parse(raw);
      console.log('Loaded Google credentials from local file.');
      console.log('  client_email    =', creds.client_email);
      console.log('  private_key_id  =', creds.private_key_id);
    } catch (e) {
      console.error('FAILED to read/parse local file:', e.message);
      process.exit(1);
    }
  } else {
    console.error('No Google credentials found in environment or local file');
    process.exit(1);
  }
}

// 2. Initialize Google Auth
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const authClient = new google.auth.JWT(
  creds.client_email,
  null,
  creds.private_key,
  SCOPES
);
const drive = google.drive({ version: 'v3', auth: authClient });

// 3. Setup Express
const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());

// Health check
app.get('/', (req, res) => res.json({ message: 'Server running' }));

// Upload endpoint
app.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    console.log('File:', req.file.originalname);

    const fileMetadata = { name: req.file.originalname, parents: ['1uV-o_WXok8Pl5KUhH5P3H1RkRj5ur_JH'] };
    const media = { mimeType: req.file.mimetype, body: fs.createReadStream(req.file.path) };

    console.log('Uploading to Drive...');
    const driveRes = await drive.files.create({ resource: fileMetadata, media, fields: 'id' });

    fs.unlinkSync(req.file.path);
    console.log('Uploaded:', driveRes.data.id);
    res.json({ success: true, fileId: driveRes.data.id });
  } catch (err) {
    console.error('Upload error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
