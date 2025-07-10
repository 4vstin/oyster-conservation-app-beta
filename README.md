# Oyster Conservationist Data Collection

A web application for collecting oyster data with optional photo upload functionality.

## Setup Instructions

### Frontend
The frontend consists of static HTML, CSS, and JavaScript files that can be served from any web server.

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd oyster-photo-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Google Cloud credentials:
   - Place your Google Cloud service account JSON key file in the backend directory
   - Update the `KEYFILEPATH` in `index.js` to match your key file name
   - Ensure the Google Drive API is enabled in your Google Cloud Console
   - Share the target Google Drive folder with your service account email

4. Start the backend server:
   ```bash
   node index.js
   ```

The backend is deployed on Render and the frontend is hosted on GitHub Pages.

**Frontend URL:** `https://yourusername.github.io`
**Backend URL:** `https://your-app-name.onrender.com`

## Features
- Oyster size data collection
- Shell spat count data collection
- Optional photo upload to Google Drive
- Email receipts
- Data validation and error handling

## File Structure
```
├── main.html              # Main application page
├── oyster-js.js           # Frontend JavaScript
├── oyster-styles.css      # Styling
├── oyster-photo-backend/  # Backend server
│   ├── index.js           # Express server
│   ├── package.json       # Dependencies
│   └── uploads/           # Temporary file storage
└── README.md              # This file
``` 