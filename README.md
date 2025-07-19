# Vegan 2.0 - Animal Impact Tracker

A comprehensive web application for tracking and measuring your positive impact on animal welfare through donations, conversions, media sharing, and advocacy campaigns.

## 🌟 Features

- **Multi-Category Impact Tracking**: Track donations, vegan conversions, media sharing, campaigns, and pro bono work
- **Advanced Analytics**: Sophisticated calculation engines with research-backed impact factors
- **Profile Management**: Upload photos, set display names, manage tags for group leaderboards
- **Tag-Based Leaderboards**: Join groups with standard country tags (UK, USA, Canada, etc.) or custom tags
- **Data Visualization**: Interactive charts and progress tracking with Recharts
- **Responsive Design**: Beautiful UI that works on mobile, tablet, and desktop
- **Authentication**: Secure user accounts with optional OAuth support (Google/Facebook)
- **Feedback System**: Built-in feedback collection for continuous improvement

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vegan-2.0-impact-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database
   SESSION_SECRET=your-super-secret-session-key
   
   # Optional OAuth credentials (for Google/Facebook login)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 🛠️ Technology Stack

### Frontend
- **React** with TypeScript
- **Wouter** for routing
- **Tailwind CSS** + **shadcn/ui** for styling
- **TanStack Query** for state management
- **React Hook Form** + **Zod** for forms
- **Recharts** for data visualization

### Backend
- **Node.js** + **Express.js**
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **PostgreSQL** for data storage

### Build & Development
- **Vite** for fast development and building
- **tsx** for TypeScript execution
- **Drizzle Kit** for database migrations

## 📊 Impact Calculation System

The app uses research-backed factors to calculate animal impact:

- **Donations**: Variable impact (0.5x to 4.4x animals per dollar) based on organization effectiveness
- **Vegan Conversions**: Time-based calculations using 146 animals/year omnivore baseline
- **Media Sharing**: Reach and persuasiveness-based impact calculations
- **Campaigns**: Action-weighted scoring for different types of participation
- **Pro Bono Work**: Impact based on organization effectiveness and hourly contribution value

## 🗂️ Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                # Backend Express application
│   ├── auth.ts           # Authentication setup
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── oauth.ts          # OAuth configuration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── uploads/              # File upload directory
```

## 🚀 Deployment

### Using Replit (Recommended)
1. Import this repository into Replit
2. Set environment variables in Replit Secrets
3. Click "Run" - Replit handles everything automatically

### Using Other Platforms

For deployment on platforms like Vercel, Netlify, or Railway:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up environment variables** on your platform

3. **Deploy both frontend and backend**
   - Frontend: Deploy the `client/dist` folder
   - Backend: Deploy the server files with Node.js runtime

## 🔧 Configuration

### Database Setup
The app uses PostgreSQL with Drizzle ORM. Schema is defined in `shared/schema.ts`.

To modify the database:
1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes

### OAuth Setup (Optional)
To enable Google/Facebook login:

1. Create OAuth apps in Google/Facebook developer consoles
2. Add credentials to environment variables
3. Set redirect URLs to `{your-domain}/api/auth/google/callback` and `{your-domain}/api/auth/facebook/callback`

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Data Endpoints
- `GET /api/donations` - Get user donations
- `POST /api/donations` - Create donation
- `GET /api/vegan-conversions` - Get conversions
- `POST /api/vegan-conversions` - Create conversion
- `GET /api/media-shared` - Get media items
- `POST /api/media-shared` - Create media item
- `GET /api/campaigns` - Get campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/pro-bono` - Get pro bono work
- `POST /api/pro-bono` - Create pro bono work

### Profile & Social
- `PATCH /api/profile` - Update profile
- `POST /api/upload-profile-photo` - Upload photo
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/leaderboard/tag/:tag` - Get tag leaderboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## 🔮 Roadmap

- [ ] Multi-currency donation tracking
- [ ] Advanced campaign analytics
- [ ] Export functionality (PDF reports)
- [ ] Mobile app version
- [ ] Integration with donation platforms
- [ ] Advanced group management features

---

Built with ❤️ for animal advocates worldwide