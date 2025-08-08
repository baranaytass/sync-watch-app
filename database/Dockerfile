FROM postgres:15-alpine

# Environment variables
ENV POSTGRES_DB=videosync
ENV POSTGRES_USER=videosync_user
ENV POSTGRES_PASSWORD=videosync_pass

# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/

# Expose port
EXPOSE 5432

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U videosync_user -d videosync || exit 1