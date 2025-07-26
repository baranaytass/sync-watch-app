# Coding Rules & Standards

## Language Standards

### English-Only Code Policy
**All code-related content must be written in English:**

- ✅ Code (variables, functions, classes, etc.)
- ✅ Comments and documentation
- ✅ Console logs (both development and test logs)
- ✅ Error messages in code
- ✅ Test descriptions and assertions
- ✅ Git commit messages
- ✅ File names and directory names
- ✅ Configuration files and scripts

### Communication
- **Chat/Discussion**: Turkish is allowed for team communication
- **Code & Documentation**: English only

## Technical Standards

### TypeScript & Code Style
- **TypeScript for all files** - No JavaScript allowed
- Always provide explicit types for function parameters and return values
- Use interfaces for object types, types for unions
- Avoid `any` type, use `unknown` instead when needed
- Prefer async/await over promises
- Use const/let, never var
- Prefer arrow functions and template literals
- Use destructuring for objects and arrays

### Vue 3 Best Practices
- Use Composition API with `<script setup>`
- Prefer `ref()` for primitives, `reactive()` for objects
- Use `computed()` for derived state
- Implement proper cleanup with `onUnmounted()`
- Use `defineEmits()` and `defineProps()` with TypeScript

### Backend Standards (Fastify)
- Use async route handlers with proper error handling
- Implement Fastify schemas for validation
- Structure: controllers → services → models
- Use dependency injection for services
- Implement proper logging with context

### WebSocket Implementation
- Implement connection/disconnection handling
- Use proper event naming conventions
- Implement reconnection logic on client
- Validate WebSocket messages

### Security & Performance
- Validate all inputs and use parameterized queries
- Implement proper authentication and HTTPS in production
- Use lazy loading for routes and proper caching strategies
- Optimize database queries with proper indexing

### Testing Standards
- Write unit tests for business logic
- Mock external dependencies and test error scenarios
- Use descriptive test names in English
- Ensure all tests pass before commits

### Build Requirements
- **ALWAYS run build after any code changes**
- Ensure TypeScript compilation passes without errors
- Fix all build warnings before completing development
- Never commit code that doesn't build successfully

## Git Standards
- **ALL commit messages MUST be in English** - Critical for consistency
- Use conventional commit format: `type(scope): description`
- Common types: feat, fix, docs, style, refactor, test, chore
- Use imperative mood: "Add feature" not "Added feature"
- Reference issues/PRs when applicable