# Changelog

All notable changes to the Vegan 2.0 Animal Impact Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Profile page with photo upload capability (50MB limit)
- Tag-based leaderboard system with standard country tags
- Display name editing functionality
- Password change system for local accounts
- OAuth foundation for Google and Facebook integration
- Navigation updates with Profile and Leaderboard pages

### Changed
- Updated navigation terminology from "Vegan Conversions" to "Conversions"
- Improved mobile navigation with new Profile and Leaderboard options

### Technical
- Enhanced database schema with profile and OAuth fields
- Implemented Passport.js authentication framework
- Added multer for file upload handling
- Extended storage interface for profile management

## [1.0.0] - 2025-07-17 - Beta Launch

### Added
- Multi-category impact tracking (donations, conversions, media, campaigns, pro bono)
- Sophisticated calculation engines with research-backed impact factors
- User authentication and session management
- Data visualization and progress tracking
- Responsive design for mobile and desktop
- Feedback collection system for continuous improvement
- Database integrity and foreign key relationships
- Consistent terminology and calculations across all pages

### Features
- **Donations Tracking**: Support for one-time and monthly donations with variable impact factors (0.5x to 4.4x animals per dollar)
- **Vegan Conversions**: Time-based calculations using 146 animals/year omnivore baseline
- **Media Sharing**: Reach and persuasiveness-based impact calculations
- **Campaigns**: Action-weighted scoring for different participation types
- **Pro Bono Work**: Impact calculation based on organization effectiveness and hourly value
- **Dashboard**: Comprehensive analytics with interactive charts
- **Leaderboards**: Community engagement and progress comparison

### Technical Implementation
- **Frontend**: React with TypeScript, Wouter routing, Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **State Management**: TanStack Query for server state
- **Build System**: Vite for fast development and optimized builds

### Impact Calculation Updates
- Reduced highest impact charity rate from 4.6 to 4.4 animals per dollar
- Updated omnivore baseline from 146.2 to 146 animals/year
- Proportional adjustments to all diet types for consistency

### User Experience
- Clean, modern interface with accessible design
- Mobile-responsive layout for all screen sizes
- Real-time data synchronization and caching
- Comprehensive form validation and error handling
- Progress tracking against user-defined goals

## [0.1.0] - 2025-07-06 - Initial Development

### Added
- Initial project setup and architecture
- Core database structure
- Basic authentication system
- Foundation for impact tracking categories

---

## Release Notes

### Beta Launch Ready Features
- ✅ Multi-category impact tracking across all major areas
- ✅ Research-backed calculation algorithms
- ✅ Comprehensive user management and authentication
- ✅ Interactive data visualization and analytics
- ✅ Responsive design for all devices
- ✅ Feedback system for continuous improvement
- ✅ Robust database design with data integrity
- ✅ Consistent user experience and terminology

### Upcoming Features
- [ ] Multi-currency donation support
- [ ] Enhanced OAuth integration (Google/Facebook)
- [ ] Advanced campaign analytics
- [ ] PDF export functionality
- [ ] Mobile app version
- [ ] Integration with donation platforms
- [ ] Advanced group management features
- [ ] Internationalization support

### Known Issues
- OAuth providers require configuration with actual API keys
- File upload size limits may need adjustment based on hosting platform
- Session storage configuration may need optimization for high-traffic scenarios

### Migration Notes
When upgrading between versions, always:
1. Backup your database
2. Run database migrations: `npm run db:push`
3. Update environment variables as needed
4. Test core functionality after deployment