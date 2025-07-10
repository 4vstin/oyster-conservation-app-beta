const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());

// Test route to verify server is running
app.get('/', (req, res) => {
  res.json({ message: 'Oyster photo upload server is running!' });
});

// Load service account key
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let auth;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Use environment variable for Railway deployment
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: SCOPES,
  });
} else {
  // Use local file for development
  const KEYFILEPATH = path.join(__dirname, 'oyster-conservationist-db-5c4b27604473.json');
  auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
}
const drive = google.drive({ version: 'v3', auth });

// Your Google Drive folder ID
const FOLDER_ID = '1uV-o_WXok8Pl5KUhH5P3H1RkRj5ur_JH';

app.post('/upload-photo', upload.single('photo'), async (req, res) => {
  console.log('Received upload request');
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    console.log('File received:', req.file.originalname);
    
    const fileMetadata = {
      name: req.file.originalname,
      parents: [FOLDER_ID],
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    // Remove file from server after upload
    fs.unlinkSync(req.file.path);
    console.log('File uploaded successfully:', file.data.id);
    res.json({ success: true, fileId: file.data.id });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
