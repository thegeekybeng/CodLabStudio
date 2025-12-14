FROM python:3.11-alpine

# Install build dependencies for potential packages
RUN apk add --no-cache gcc musl-dev linux-headers

# Install debugpy globally
RUN pip install debugpy

# Set working directory
WORKDIR /sessions

# Default command
CMD ["sh", "-c", "sleep infinity"]
