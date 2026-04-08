# Use the official n8n image as the base
FROM n8nio/n8n:latest

# Switch to root to install extra packages if needed
USER root

# Install PostgreSQL client (useful for debugging Supabase connections)
RUN apk add --no-cache postgresql-client

# Switch back to the node user used by n8n
USER node

# n8n listens on port 5678 by default
EXPOSE 5678

# Health-check so Cloud Run knows when the instance is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5678/healthz || exit 1
