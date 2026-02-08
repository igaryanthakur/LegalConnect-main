# LegalConnect - Legal Aid Platform

LegalConnect is a comprehensive legal access platform designed to connect people with affordable legal services and resources. The platform includes features for finding pro bono lawyers, accessing legal resources, participating in community forums, and getting assistance from an AI legal assistant.

## 🌐 Live Demo

Visit the live application at [https://legal-connect-main-frontend.vercel.app/](https://legal-connect-main-frontend.vercel.app/)

## ✨ Features

- **Lawyer Directory**: Find and connect with pro bono lawyers and affordable legal services
- **Resource Library**: Access guides, documents, and educational materials on various legal topics
- **Community Forums**: Join discussions, share experiences, and learn from others facing similar legal issues
- **AI Legal Assistant**: Get instant answers to common legal questions through AI-powered assistance

## ✅ Recent Updates

- **Payment Integration**: Razorpay checkout with order creation and payment verification on the backend
- **Required Payment Env Vars**: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` must be set in backend deployment
- **AI Assistant Key**: `GEMINI_API_KEY` is used for AI legal assistant responses

## 🏗️ Architecture

LegalConnect uses a modern web stack:

- **Frontend**: Vanilla JavaScript with a component-based architecture
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.IO for live updates in community forums
- **Authentication**: JWT-based authentication system
- **File Storage**: ImageKit for profile images and document storage

## 🛠️ Technology Stack

### Frontend

- JavaScript (ES6+)
- CSS3 with custom variables for theming
- Socket.IO Client for WebSocket connections
- Axios for API requests
- Vite as the build tool and development server

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO for real-time communication
- JWT for authentication
- Multer for file uploads
- ImageKit for cloud storage
- CORS for cross-origin resource sharing

## 📋 Project Structure

## 🌱 Database Seeding

The project includes comprehensive seed scripts to populate the database with demo data for testing and development:

### Available Seed Scripts

1. **seedDemoLawyers.js** - Creates 10 verified lawyers with:
   - Complete profiles (education, bar number, languages)
   - Realistic consultation fees (₹0 - ₹3,500)
   - Weekly availability schedules
   - Practice areas and service types
   - Office addresses with coordinates

2. **seedDemoUsers.js** - Creates 10 demo users/clients with:
   - Different professional backgrounds
   - Location information
   - Bio descriptions
   - Contact details

3. **seedConsultations.js** - Creates 25 consultations with:
   - Mixed statuses: pending, accepted, completed, rejected, cancelled
   - Paid and unpaid consultations
   - Various consultation types: video, phone, in-person
   - Realistic case scenarios and notes
   - Proper lawyer-client ObjectId references
   - Payment details for paid consultations

4. **seedReviews.js** - Adds reviews for all completed consultations with:
   - Realistic ratings (1-5 stars) with weighted distribution
   - Varied review comments matching the rating
   - Automatic average rating calculation for each lawyer
   - Reviews linked to actual clients who had consultations

5. **seedAll.js** - Master script that runs all seed scripts in sequence

### Running Seed Scripts

```bash
# Seed everything at once (recommended)
cd Backend
node scripts/seedAll.js

# Or run individual scripts
node scripts/seedDemoLawyers.js
node scripts/seedDemoUsers.js
node scripts/seedConsultations.js
node scripts/seedReviews.js
```

### Demo Data Summary

After seeding, your database will contain:

- **10 Lawyers**: With varied specializations and fee structures
- **10 Users**: Representing different client profiles
- **25 Consultations**: Covering all possible consultation states for comprehensive testing
- **Reviews**: Authentic reviews for all completed consultations with realistic ratings

This demo data allows you to:

- Test lawyer search and filtering
- Explore consultation booking flows
- Test payment integration with paid/unpaid states
- View lawyer and user dashboards with real data
- Test consultation management (accept, reject, complete)
- View lawyer ratings and reviews from actual clients
