# Use a recent Node.js version to reduce deprecation warnings
FROM node:20-alpine

# Create a working directory
WORKDIR /app

# Copy package.json, package-lock.json, and tsconfig.json
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY ./src ./src

# Build TypeScript -> JavaScript
RUN npm run build

# Expose the port for the Express server
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
