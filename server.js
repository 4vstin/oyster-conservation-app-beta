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
// Firebase Configuration Debug Endpoint
// -----------
app_express.get('/debug-firebase', (req, res) => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
    projectId: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
    appId: process.env.FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'
  };
  
  res.json({
    message: 'Firebase Configuration Status',
    config: config,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'Not set',
    projectId: process.env.FIREBASE_PROJECT_ID || 'Not set'
  });
});

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
    console.error('Error code:', err.code);
    console.error('Error stack:', err.stack);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Return more detailed error information
    res.status(500).json({ 
      success: false, 
      error: err.message,
      errorCode: err.code,
      errorDetails: err.message
    });
  }
});

// -----------
// Test Firebase Storage Connection
// -----------
app_express.get('/test-firebase-storage', async (req, res) => {
  try {
    console.log('Testing Firebase Storage connection...');
    
    // Try to list files in the oyster-photos directory
    const listRef = ref(storage, 'oyster-photos/');
    const result = await listAll(listRef);
    
    res.json({ 
      success: true, 
      message: 'Firebase Storage connection successful',
      fileCount: result.items.length,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } catch (err) {
    console.error('Firebase Storage test failed:', err.message);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      errorCode: err.code,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
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