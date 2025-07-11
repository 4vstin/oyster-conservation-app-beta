// 1) Load built-ins and libs before using them
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { google } = require('googleapis');

// 2) Debug: check if credentials are available
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log('GOOGLE_APPLICATION_CREDENTIALS exists? =', !!credentialsJson);
console.log('Credentials length =', credentialsJson ? credentialsJson.length : 0);

// 3) Parse service-account JSON
let creds;
if (credentialsJson) {
  try {
    creds = JSON.parse(credentialsJson);
    console.log('  client_email    =', creds.client_email);
    console.log('  private_key_id  =', creds.private_key_id);
  } catch(e) {
    console.error('  FAILED to parse JSON:', e.message);
    console.error('  This means the environment variable is not valid JSON');
    process.exit(1);
  }
} else {
  // Fallback to local file for development
  const keyFile = path.join(__dirname, 'oyster-photo-backend', 'oyster-conservationist-db-5c4b27604473.json');
  console.log('Trying local file:', keyFile);
  console.log('  exists? =', fs.existsSync(keyFile));
  
  if (fs.existsSync(keyFile)) {
    try {
      const raw = fs.readFileSync(keyFile, 'utf8');
      creds = JSON.parse(raw);
      console.log('  client_email    =', creds.client_email);
      console.log('  private_key_id  =', creds.private_key_id);
    } catch(e) {
      console.error('  FAILED to read/parse local file:', e.message);
      process.exit(1);
    }
  } else {
    console.error('No Google credentials found in environment or local file');
    process.exit(1);
  }
}

// 4) Initialize JWT auth directly
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const authClient = new google.auth.JWT(
  creds.client_email,
  null,
  creds.private_key,
  SCOPES
);
const drive = google.drive({ version: 'v3', auth: authClient });

// 5) Setup Express
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
