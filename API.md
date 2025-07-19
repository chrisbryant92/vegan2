# API Documentation

This document describes the REST API endpoints for the Vegan 2.0 Animal Impact Tracker.

## Base URL

```
http://localhost:5000/api  (development)
https://your-domain.com/api  (production)
```

## Authentication

Most endpoints require authentication. The API uses session-based authentication with cookies.

### Authentication Endpoints

#### Register New User
```http
POST /api/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "name": "John Doe",
    "displayName": "John",
    "tags": ["UK", "Professional"]
  }
}
```

#### Logout
```http
POST /api/logout
```

#### Get Current User
```http
GET /api/user
```

**Response:**
```json
{
  "id": 1,
  "username": "user@example.com",
  "name": "John Doe",
  "displayName": "John",
  "profilePhoto": "/uploads/profiles/1_123456789.jpg",
  "tags": ["UK", "Professional"],
  "email": "user@example.com"
}
```

## OAuth Endpoints

#### Google OAuth
```http
GET /api/auth/google
```
Redirects to Google OAuth consent screen.

```http
GET /api/auth/google/callback
```
OAuth callback endpoint (handled automatically).

#### Facebook OAuth
```http
GET /api/auth/facebook
```
Redirects to Facebook OAuth consent screen.

```http
GET /api/auth/facebook/callback
```
OAuth callback endpoint (handled automatically).

## Profile Management

#### Update Profile
```http
PATCH /api/profile
Content-Type: application/json

{
  "displayName": "Johnny",
  "tags": ["UK", "Student", "Activist"]
}
```

#### Change Password
```http
PATCH /api/change-password
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### Upload Profile Photo
```http
POST /api/upload-profile-photo
Content-Type: multipart/form-data

photo: <file> (max 50MB)
```

**Response:**
```json
{
  "message": "Photo uploaded successfully",
  "photoUrl": "/uploads/profiles/1_123456789.jpg"
}
```

## Donations

#### Get User Donations
```http
GET /api/donations
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "organization": "Against Malaria Foundation",
    "amount": 100,
    "currency": "USD",
    "isMonthly": false,
    "dateStarted": "2025-01-15T00:00:00.000Z",
    "dateEnded": null,
    "organizationImpact": "High",
    "animalsSaved": 352,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

#### Create Donation
```http
POST /api/donations
Content-Type: application/json

{
  "organization": "The Humane League",
  "amount": 50,
  "currency": "USD",
  "isMonthly": true,
  "dateStarted": "2025-01-01T00:00:00.000Z",
  "organizationImpact": "Highest"
}
```

#### Update Donation
```http
PUT /api/donations/:id
Content-Type: application/json

{
  "amount": 75,
  "dateEnded": "2025-12-31T00:00:00.000Z"
}
```

#### Delete Donation
```http
DELETE /api/donations/:id
```

## Vegan Conversions

#### Get User Conversions
```http
GET /api/vegan-conversions
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "personName": "Alice Smith",
    "dateStarted": "2024-06-01T00:00:00.000Z",
    "dateEnded": null,
    "dietBefore": "omnivore",
    "dietAfter": "vegetarian",
    "influence": 75,
    "animalsSaved": 294,
    "notes": "Convinced through documentary recommendation",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

#### Create Conversion
```http
POST /api/vegan-conversions
Content-Type: application/json

{
  "personName": "Bob Johnson",
  "dateStarted": "2025-01-01T00:00:00.000Z",
  "dietBefore": "omnivore",
  "dietAfter": "vegan",
  "influence": 50,
  "notes": "Gradual transition over 6 months"
}
```

## Media Shared

#### Get User Media Items
```http
GET /api/media-shared
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Dominion Documentary Share",
    "oneOffPieces": 5,
    "postsPerMonth": 0,
    "interactions": 250,
    "dateStarted": "2024-01-01T00:00:00.000Z",
    "dateEnded": "2024-01-31T00:00:00.000Z",
    "animalsSaved": 45,
    "description": "Shared documentary with friends and family",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

#### Create Media Item
```http
POST /api/media-shared
Content-Type: application/json

{
  "title": "Instagram Vegan Posts",
  "oneOffPieces": 0,
  "postsPerMonth": 8,
  "interactions": 150,
  "dateStarted": "2025-01-01T00:00:00.000Z",
  "description": "Regular vegan lifestyle content"
}
```

## Campaigns

#### Get User Campaigns
```http
GET /api/campaigns
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "Corporate Cage-Free Campaign",
    "emails": 12,
    "socialMediaActions": 8,
    "letters": 3,
    "leaflets": 0,
    "rallies": 1,
    "otherActions": 2,
    "totalActions": 26,
    "animals_saved": 145,
    "notes": "Targeted major restaurant chains",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
]
```

#### Create Campaign
```http
POST /api/campaigns
Content-Type: application/json

{
  "name": "Factory Farm Investigation Share",
  "emails": 5,
  "socialMediaActions": 15,
  "letters": 0,
  "leaflets": 100,
  "rallies": 0,
  "otherActions": 3
}
```

## Pro Bono Work

#### Get User Pro Bono Work
```http
GET /api/pro-bono
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "organization": "Good Food Institute",
    "role": "Software Development",
    "dateStarted": "2024-06-01T00:00:00.000Z",
    "dateEnded": "2024-08-31T00:00:00.000Z",
    "hoursPerDay": 4,
    "daysPerWeek": 3,
    "organizationImpact": "Highest",
    "hourlyValue": 75,
    "rateType": "pro_bono",
    "description": "Developed impact calculator tool",
    "animalsSaved": 1250,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

#### Create Pro Bono Work
```http
POST /api/pro-bono
Content-Type: application/json

{
  "organization": "Mercy For Animals",
  "role": "Video Editing",
  "dateStarted": "2025-01-01T00:00:00.000Z",
  "hoursPerDay": 2,
  "daysPerWeek": 5,
  "organizationImpact": "High",
  "hourlyValue": 50,
  "rateType": "pro_bono",
  "description": "Editing undercover investigation videos"
}
```

## Analytics & Statistics

#### Get User Statistics
```http
GET /api/stats
```

**Response:**
```json
{
  "totalAnimalsSaved": 2847,
  "donationsCount": 8,
  "donationsAnimalsSaved": 1250,
  "veganCount": 3,
  "veganAnimalsSaved": 892,
  "mediaCount": 5,
  "mediaAnimalsSaved": 234,
  "campaignsCount": 4,
  "campaignsAnimalsSaved": 321,
  "proBonoCount": 2,
  "proBonoAnimalsSaved": 150
}
```

## Leaderboards

#### Get Global Leaderboard
```http
GET /api/leaderboard
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "user1@example.com",
    "name": "John Doe",
    "displayName": "Johnny",
    "tags": ["UK", "Professional"],
    "totalAnimalsSaved": 5420,
    "donationsAnimalsSaved": 2100,
    "veganAnimalsSaved": 1800,
    "mediaAnimalsSaved": 420,
    "campaignsAnimalsSaved": 890,
    "proBonoAnimalsSaved": 210
  }
]
```

#### Get Tag-Based Leaderboard
```http
GET /api/leaderboard/tag/:tag
```

Example: `GET /api/leaderboard/tag/UK`

**Response:**
```json
[
  {
    "id": 1,
    "username": "user1@example.com",
    "name": "John Doe",
    "displayName": "Johnny",
    "tags": ["UK", "Professional"],
    "hasTag": true,
    "totalAnimalsSaved": 5420,
    "donationsAnimalsSaved": 2100,
    "veganAnimalsSaved": 1800,
    "mediaAnimalsSaved": 420,
    "campaignsAnimalsSaved": 890,
    "proBonoAnimalsSaved": 210
  }
]
```

## Feedback

#### Submit Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "type": "suggestion",
  "message": "It would be great to have multi-currency support",
  "page": "/donations"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

#### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are subject to rate limiting:
- 100 requests per minute per IP for GET requests
- 20 requests per minute per IP for POST/PUT/DELETE requests
- File upload endpoints: 5 requests per minute per user

## Data Validation

All POST and PUT endpoints validate input data using Zod schemas. Common validation rules:

- **Amounts**: Must be positive numbers
- **Dates**: Must be valid ISO date strings
- **Percentages**: Must be between 0 and 100
- **Text fields**: Maximum length limits applied
- **File uploads**: Size and type restrictions enforced

## Pagination

List endpoints support pagination:

```http
GET /api/donations?page=1&limit=20
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```