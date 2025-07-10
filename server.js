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

// Test route to check Google credentials
app.get('/test-credentials', (req, res) => {
  const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credentialsLength = process.env.GOOGLE_APPLICATION_CREDENTIALS ? process.env.GOOGLE_APPLICATION_CREDENTIALS.length : 0;
  
  res.json({ 
    hasCredentials,
    credentialsLength,
    message: hasCredentials ? 'Credentials found' : 'No credentials found'
  });
});

// Load service account key
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
/*
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
  const KEYFILEPATH = path.join(__dirname, 'oyster-photo-backend', 'oyster-conservationist-db-5c4b27604473.json');
  if (fs.existsSync(KEYFILEPATH)) {
    auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: SCOPES,
    });
  } else {
    console.error('Service account key file not found:', KEYFILEPATH);
    throw new Error('Google Cloud credentials not configured');
  }
}
const drive = google.drive({ version: 'v3', auth });
*/
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: SCOPES,
});
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
    console.log('File path:', req.file.path);
    console.log('File mimetype:', req.file.mimetype);
    
    // Check if Google credentials are available
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      return res.status(500).json({ success: false, error: 'Google Cloud credentials not configured' });
    }
    
    console.log('Google credentials found, attempting to parse...');
    
    const fileMetadata = {
      name: req.file.originalname,
      parents: [FOLDER_ID],
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };
    
    console.log('Attempting to upload to Google Drive...');
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
    console.error('Upload error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status
    });
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 