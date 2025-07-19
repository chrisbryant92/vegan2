# Contributing to Vegan 2.0 - Animal Impact Tracker

Thank you for your interest in contributing to this project! This application helps animal advocates track and measure their impact, and your contributions can help make it even better.

## 🌱 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/vegan-2.0-impact-tracker.git
   cd vegan-2.0-impact-tracker
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

4. **Initialize Database**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages
Follow conventional commit format:
```
type(scope): description

feat(donations): add multi-currency support
fix(auth): resolve session timeout issue
docs(readme): update installation instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🏗️ Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── auth.ts           # Authentication
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database layer
│   └── oauth.ts          # OAuth setup
├── shared/               # Shared types
│   └── schema.ts         # Database schema
└── uploads/              # File uploads
```

## 🎯 Areas for Contribution

### High Priority
- [ ] Multi-currency donation tracking
- [ ] Enhanced campaign analytics
- [ ] Mobile responsiveness improvements
- [ ] Performance optimizations
- [ ] Test coverage expansion

### Medium Priority
- [ ] Export functionality (PDF reports)
- [ ] Advanced group management
- [ ] Integration with donation platforms
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)

### Low Priority
- [ ] Dark mode enhancements
- [ ] Advanced data visualizations
- [ ] Email notifications
- [ ] Social sharing features

## 📝 Coding Standards

### TypeScript
- Use strict type checking
- Define interfaces for all data structures
- Prefer type safety over `any`

### React
- Use functional components with hooks
- Implement proper error boundaries
- Follow component composition patterns

### Backend
- Use async/await over callbacks
- Implement proper error handling
- Add input validation for all endpoints

### Styling
- Use Tailwind CSS utility classes
- Follow shadcn/ui patterns
- Ensure mobile responsiveness

### Database
- Use Drizzle ORM for all queries
- Add proper indexes for performance
- Follow foreign key relationships

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Write unit tests for utility functions
- Add integration tests for API endpoints
- Include component tests for complex UI logic

### Test Structure
```typescript
describe('Component/Function Name', () => {
  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## 🗃️ Database Changes

### Schema Modifications
1. Update `shared/schema.ts`
2. Run `npm run db:push` for development
3. Test thoroughly before committing
4. Document breaking changes

### Migration Guidelines
- Always provide backwards compatibility when possible
- Document data migration requirements
- Test migrations on realistic data sets

## 🎨 UI/UX Guidelines

### Design Principles
- Clean, minimalist interface
- Accessibility-first approach
- Mobile-responsive design
- Consistent component usage

### Component Guidelines
- Use shadcn/ui components when available
- Implement proper loading states
- Add meaningful error messages
- Follow established spacing patterns

## 🔍 Code Review Process

### Before Submitting PR
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Lint checks pass
- [ ] Manual testing completed
- [ ] Documentation updated if needed

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Additional Notes
```

### Review Guidelines
- Review for code quality and patterns
- Check for security implications
- Verify performance impact
- Ensure documentation accuracy

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Reproduce the bug consistently
3. Test in different browsers/devices
4. Gather relevant error messages

### Bug Report Template
```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
```

## ✨ Feature Requests

### Feature Request Template
```markdown
**Feature Description**
Clear description of the feature

**Problem Solved**
What problem does this solve?

**Proposed Solution**
How should this be implemented?

**Alternatives Considered**
Other approaches considered

**Additional Context**
Any other relevant information
```

## 📚 Documentation

### Documentation Guidelines
- Use clear, simple language
- Include code examples
- Add screenshots for UI features
- Keep documentation up to date

### Areas Needing Documentation
- API endpoint documentation
- Component usage examples
- Deployment guides
- Configuration options

## 🚀 Release Process

### Version Numbering
Follow semantic versioning (semver):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backwards compatible)
- Patch: Bug fixes

### Release Checklist
- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Tag release in git
- [ ] Deploy to production
- [ ] Announce release

## 💬 Communication

### Channels
- GitHub Issues for bugs and features
- GitHub Discussions for questions
- Pull Request comments for code review

### Guidelines
- Be respectful and constructive
- Provide specific feedback
- Ask questions when unclear
- Help others when possible

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in project documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to animal welfare through technology! 🐾