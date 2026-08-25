FROM gcc:14-bookworm

# Install Node.js 20 LTS for the microservice API
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Work inside /app
WORKDIR /app

# Create a dedicated non-root runner user
RUN useradd -m -u 10001 -s /bin/bash runner

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY server.js ./

# Set permissions
RUN chown -R runner:runner /app && \
    chmod 1777 /tmp

# Switch to unprivileged runner user
USER runner

# Default port (Render injects PORT at runtime)
ENV PORT=5050
EXPOSE 5050

# Start server
CMD ["node", "server.js"]
