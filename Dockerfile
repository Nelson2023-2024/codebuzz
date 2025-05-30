FROM node:20

WORKDIR /var/app

# Copy package files first for better caching

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

CMD ["yarn", "run", "dev"]