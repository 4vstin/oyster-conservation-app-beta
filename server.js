// ===============================
// Oyster Photo Upload Backend API (Firebase Storage Version)
// ===============================
// This version uses Firebase Storage - completely free tier available
// No billing setup required, generous free limits

const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, listAll } = require('firebase/storage');

// -----------
// Firebase Configuration
// -----------
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// -----------
// Express App Setup
// -----------
const upload = multer({ dest: 'uploads/' });
const app_express = express();
app_express.use(cors());

// -----------
// Health Check Endpoint
// -----------
app_express.get('/', (req, res) => res.json({ message: 'Server running (Firebase Storage version)' }));

// -----------
// Photo Upload Endpoint
// -----------
app_express.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    console.log('File:', req.file.originalname);

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `oyster-photos/${timestamp}-${req.file.originalname}`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, fileName);
    
    // Read the file
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Upload to Firebase Storage
    console.log('Uploading to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: req.file.mimetype,
      customMetadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString()
      }
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Remove the temporary file
    fs.unlinkSync(req.file.path);
    
    console.log('Uploaded to Firebase:', fileName);
    res.json({ 
      success: true, 
      fileName: fileName,
      downloadURL: downloadURL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    console.error('Error details:', err);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------
// List Files Endpoint (Optional)
// -----------
app_express.get('/list-photos', async (req, res) => {
  try {
    const listRef = ref(storage, 'oyster-photos/');
    const result = await listAll(listRef);
    
    const fileList = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          downloadURL: url
        };
      })
    );
    
    res.json({ success: true, files: fileList });
  } catch (err) {
    console.error('List error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------
// Start Server
// -----------
const PORT = process.env.PORT || 3001;
app_express.listen(PORT, () => console.log(`Listening on port ${PORT} (Firebase Storage version)`)); 