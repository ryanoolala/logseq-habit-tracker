# GitHub Copilot Instructions for Logseq Habit Tracker

## Project Overview

This is a Logseq habit tracker plugin/extension that helps users track and manage their habits within Logseq.

## Technology Stack

- **Language**: JavaScript/TypeScript (Node.js ecosystem)
- **Target Platform**: Logseq plugin
- **License**: MIT

## Development Guidelines

### Code Style

- Follow consistent JavaScript/TypeScript coding standards
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose

### Project Structure

- Keep source files organized in a logical directory structure
- Separate concerns (UI, logic, utilities)
- Place tests alongside the code they test or in a dedicated `test/` directory

### Building and Testing

When build or test scripts are added to `package.json`, always run them to verify changes:
- Build: Check for any build scripts in `package.json`
- Test: Check for test scripts and run them before submitting changes
- Lint: If linting is configured, ensure code passes linting checks

### Dependencies

- Minimize external dependencies
- Keep dependencies up to date
- Document why specific dependencies are needed
- Check for security vulnerabilities before adding new packages

### Logseq Plugin Specific

- Follow Logseq plugin development best practices
- Ensure compatibility with Logseq's API
- Test plugin functionality within Logseq environment
- Document user-facing features and configuration options

### Git Practices

- Write clear, descriptive commit messages
- Keep commits focused on a single logical change
- Don't commit generated files, build artifacts, or dependencies (see `.gitignore`)

### Documentation

- Update README.md when adding new features
- Document configuration options
- Provide examples for common use cases
- Keep inline code documentation current

## Task Guidelines

### Good Tasks for Copilot

- Implementing new habit tracking features
- Adding tests for existing functionality
- Improving code documentation
- Fixing bugs with clear reproduction steps
- Updating dependencies
- Adding configuration options

### Review Requirements

- All changes should maintain backward compatibility unless explicitly intended
- Security considerations for user data handling
- Performance impact on Logseq
- User experience implications

## Resources

- [Logseq Plugin Documentation](https://plugins-doc.logseq.com/)
- [Logseq Plugin Samples](https://github.com/logseq/logseq-plugin-samples)
