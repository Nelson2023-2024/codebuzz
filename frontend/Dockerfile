FROM node:20

WORKDIR /var/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies using npm
RUN npm install

# Copy application code
COPY . .

# Expose port 5173 for Vite dev server (Vite's default port)
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]