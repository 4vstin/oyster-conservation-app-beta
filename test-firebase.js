// Test script to verify Firebase Storage setup
// Run this locally to test your Firebase setup before deploying

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, listAll } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Check if all required environment variables are set
const requiredVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN', 
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing Firebase environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('\n💡 Please set these in your environment or Render dashboard');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function testFirebaseStorage() {
  try {
    console.log('🔥 Testing Firebase Storage...');
    console.log(`📦 Project: ${firebaseConfig.projectId}`);
    console.log(`🪣 Storage Bucket: ${firebaseConfig.storageBucket}`);

    // Test 1: Check Firebase connection
    console.log('\n🔍 Testing Firebase connection...');
    try {
      // Try to access storage
      const testRef = ref(storage, 'test-connection.txt');
      console.log('✅ Firebase connection successful');
    } catch (error) {
      console.error('❌ Firebase connection failed:', error.message);
      console.log('\n💡 This might mean:');
      console.log('   1. Firebase project doesn\'t exist');
      console.log('   2. Storage is not enabled');
      console.log('   3. Configuration is incorrect');
      return;
    }

    // Test 2: Upload a test file
    console.log('\n📤 Testing file upload...');
    try {
      // Create a test file
      const testContent = 'This is a test file for Firebase Storage';
      const testFilePath = path.join(__dirname, 'test-firebase-upload.txt');
      fs.writeFileSync(testFilePath, testContent);

      const fileName = `test-files/test-${Date.now()}.txt`;
      const storageRef = ref(storage, fileName);
      
      // Read the file
      const fileBuffer = fs.readFileSync(testFilePath);
      
      // Upload to Firebase
      const snapshot = await uploadBytes(storageRef, fileBuffer, {
        contentType: 'text/plain',
        customMetadata: {
          test: 'true',
          uploadedAt: new Date().toISOString()
        }
      });

      console.log(`✅ Successfully uploaded test file: ${fileName}`);

      // Test 3: Get download URL
      console.log('\n🔗 Testing download URL generation...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Download URL generated successfully');
      console.log(`   URL: ${downloadURL.substring(0, 50)}...`);

      // Test 4: List files
      console.log('\n📋 Testing file listing...');
      const listRef = ref(storage, 'test-files/');
      const result = await listAll(listRef);
      
      if (result.items.length > 0) {
        console.log(`✅ Found ${result.items.length} test files`);
        result.items.slice(0, 3).forEach(item => {
          console.log(`   - ${item.name}`);
        });
      } else {
        console.log('📭 No test files found');
      }

      // Test 5: Upload to oyster-photos folder
      console.log('\n📸 Testing oyster-photos upload...');
      const photoFileName = `oyster-photos/test-photo-${Date.now()}.txt`;
      const photoRef = ref(storage, photoFileName);
      
      await uploadBytes(photoRef, fileBuffer, {
        contentType: 'text/plain',
        customMetadata: {
          originalName: 'test-photo.txt',
          uploadedAt: new Date().toISOString()
        }
      });

      console.log(`✅ Successfully uploaded to oyster-photos: ${photoFileName}`);

      // Test 6: List oyster photos
      console.log('\n📸 Listing oyster photos...');
      const photosRef = ref(storage, 'oyster-photos/');
      const photosResult = await listAll(photosRef);
      
      if (photosResult.items.length > 0) {
        console.log(`✅ Found ${photosResult.items.length} oyster photos:`);
        photosResult.items.slice(0, 3).forEach(item => {
          console.log(`   - ${item.name}`);
        });
        if (photosResult.items.length > 3) {
          console.log(`   ... and ${photosResult.items.length - 3} more photos`);
        }
      } else {
        console.log('📭 No oyster photos found (this is normal for a new setup)');
      }

      // Clean up test files
      console.log('\n🧹 Cleaning up test files...');
      fs.unlinkSync(testFilePath);
      console.log('✅ Test files cleaned up');

    } catch (error) {
      console.error('❌ Upload test failed:', error.message);
      console.log('\n💡 This might mean:');
      console.log('   1. Firebase Storage rules are too restrictive');
      console.log('   2. Storage bucket is not accessible');
      console.log('   3. Authentication failed');
      
      if (error.code === 'storage/unauthorized') {
        console.log('\n🔧 Fix: Update Firebase Storage rules to allow uploads:');
        console.log('   Go to Firebase Console → Storage → Rules');
        console.log('   Set rules to allow read/write access');
      }
    }

    console.log('\n🎉 Firebase Storage test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. If all tests passed, your Firebase setup is working');
    console.log('   2. Deploy your updated server code');
    console.log('   3. Test uploading a photo through your application');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    if (error.code === 'app/no-app') {
      console.log('\n🔧 Fix: Check your Firebase configuration');
      console.log('   Make sure all environment variables are set correctly');
    }
  }
}

// Run the test
testFirebaseStorage(); 