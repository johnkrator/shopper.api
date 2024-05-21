# Use a Node base image
FROM node:latest

# Set the working directory
WORKDIR /usr/src/app/dist

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Start the application
CMD ["npm", "start"]