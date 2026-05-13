# Use official Microsoft Playwright image with all dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.43.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm ci --only=dev

# Copy test directories
COPY Pages/ ./Pages/
COPY tests/ ./tests/

# Copy playwright config
COPY playwright.config.js ./

# Ensure non-root user runs container (security best practice)
RUN useradd -m pwuser && chown -R pwuser:pwuser /app
USER pwuser

# Default command: run the chaos bot load test
CMD ["npx", "playwright", "test", "tests/chaos_bot_pom.spec.js"]
