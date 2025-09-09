# ReIDentify Backend

Express.js backend API for the ReIDentify student ID card management system.

## Features

- RESTful API for student ID card request management
- MongoDB integration with multiple databases
- Faculty authentication validation
- Request status management (pending, approved, rejected)
- CORS enabled for frontend integration

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **CORS** for cross-origin requests

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally on default port 27017)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running locally

3. Start the server:
```bash
node server.js
```

The server will start on [http://localhost:5000](http://localhost:5000)

## Database Structure

The backend connects to two MongoDB databases:

### 1. `studentidreq` Database
- **idcards** - Pending ID card requests
- **rejectedidcards** - Rejected requests
- **facultynumbers** - Valid faculty IDs
- **acchistoryid** - Approved request history
- **rejhistoryids** - Rejected request history

### 2. `printidreq` Database
- **printids** - Approved requests ready for printing

## API Endpoints

### Request Management
- `GET /api/pending` - Get all pending requests
- `GET /api/approved` - Get all approved requests (from printids)
- `GET /api/rejected` - Get all rejected requests
- `PATCH /api/requests/:id/status` - Update request status (approve/reject)

### History
- `GET /api/acchistoryid` - Get approved request history
- `GET /api/rejhistoryids` - Get rejected request history

### Authentication
- `GET /api/check-faculty/:id` - Validate faculty ID

## Request Flow

1. **Pending Request**: Stored in `idcards` collection
2. **Approval**: Moved to `printids` collection, removed from `idcards`
3. **Rejection**: Moved to `rejectedidcards` collection, removed from `idcards`

## Data Models

### ID Card Request
```javascript
{
  _id: ObjectId,
  registerNumber: String,
  name: String,
  dob: String,
  department: String,
  year: String,
  section: String,
  libraryCode: String,
  reason: String,
  photoUrl: String,
  status: String // 'pending', 'approved', 'rejected'
}
```

### Faculty Number
```javascript
{
  facNumber: String (unique)
}
```

## Error Handling

The API includes proper error handling for:
- Invalid request IDs
- Database connection issues
- Missing required fields
- Faculty ID validation

## CORS Configuration

CORS is enabled for all origins to allow frontend integration during development.