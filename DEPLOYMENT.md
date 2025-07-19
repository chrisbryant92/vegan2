# Deployment Guide

This guide covers different deployment options for the Vegan 2.0 Animal Impact Tracker.

## 🚀 Replit (Recommended for Quick Start)

Replit provides the easiest deployment option with zero configuration.

1. **Import Project**
   - Go to [Replit](https://replit.com)
   - Click "Create Repl" → "Import from GitHub"
   - Enter your repository URL

2. **Set Environment Variables**
   - Open your Repl
   - Go to "Secrets" tab (lock icon in sidebar)
   - Add the following secrets:
     ```
     DATABASE_URL=<your-postgresql-url>
     SESSION_SECRET=<random-secret-key>
     ```

3. **Deploy**
   - Click "Run" button
   - Replit automatically handles building and deployment
   - Your app will be available at `https://your-repl-name.username.repl.co`

## 🌐 Vercel (Frontend + Serverless Functions)

Vercel is excellent for the frontend with serverless functions for the API.

### Setup

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure for Vercel**
   Create `vercel.json`:
   ```json
   {
     "builds": [
       {
         "src": "client/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       },
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/client/dist/$1"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add SESSION_SECRET
   ```

## 🚂 Railway

Railway provides an excellent PostgreSQL + Node.js hosting solution.

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repo

2. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the connection string

3. **Set Environment Variables**
   - Go to your service → "Variables"
   - Add:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `SESSION_SECRET`: Random secret key
     - `NODE_ENV`: production

4. **Deploy**
   - Railway automatically builds and deploys
   - Custom domain available in settings

## 🌊 DigitalOcean App Platform

1. **Create App**
   - Connect your GitHub repository
   - Choose Node.js as runtime

2. **Configure Build**
   - Build command: `npm run build`
   - Run command: `npm start`

3. **Add Database**
   - Add PostgreSQL database component
   - Connect via environment variables

## 🏗️ Self-Hosted (VPS/Dedicated Server)

For full control, deploy on your own server.

### Prerequisites
- Ubuntu/Debian server
- Node.js 18+
- PostgreSQL
- Nginx (recommended)
- PM2 (for process management)

### Setup Steps

1. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install postgresql nginx
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install nodejs
   npm install -g pm2
   ```

2. **Set up PostgreSQL**
   ```bash
   sudo -u postgres createuser --interactive
   sudo -u postgres createdb vegan_impact_tracker
   ```

3. **Clone and Build**
   ```bash
   git clone <your-repo>
   cd vegan-2.0-impact-tracker
   npm install
   npm run build
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Start with PM2**
   ```bash
   pm2 start server/index.js --name "vegan-impact-tracker"
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔧 Production Optimizations

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-user:password@prod-host:5432/prod-db
SESSION_SECRET=very-long-random-string-for-production
```

### Security Headers
Add to your reverse proxy or server configuration:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Database Optimization
- Set up connection pooling
- Configure backup strategy
- Monitor query performance

### Monitoring
Consider adding:
- Application monitoring (DataDog, New Relic)
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot)

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Fails**
   - Check DATABASE_URL format
   - Verify database server is accessible
   - Check firewall settings

2. **Build Fails**
   - Ensure Node.js version compatibility
   - Check for missing dependencies
   - Verify TypeScript compilation

3. **OAuth Not Working**
   - Verify callback URLs in OAuth providers
   - Check client ID/secret configuration
   - Ensure HTTPS in production

4. **File Uploads Fail**
   - Check directory permissions
   - Verify upload size limits
   - Ensure upload directory exists

### Performance Tips

1. **Database**
   - Add indexes for frequently queried columns
   - Use connection pooling
   - Consider read replicas for heavy loads

2. **Frontend**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement proper caching headers

3. **Backend**
   - Use PM2 cluster mode
   - Implement request rate limiting
   - Add response caching where appropriate

## 📞 Support

If you encounter deployment issues:
1. Check the [main README](README.md) for basic setup
2. Review the [Issues](../../issues) page
3. Create a new issue with deployment platform and error details