FROM gcc:14-bookworm

# Work inside /app
WORKDIR /app

# Create a non-root user named "runner"
RUN useradd -m -u 1000 -s /bin/bash runner

# Copy default starter source and execution script
COPY main.cpp run.sh ./

# Fix line endings if created on Windows, make executable, and set ownership
RUN sed -i 's/\r$//' run.sh && \
    chmod +x run.sh && \
    chown -R runner:runner /app

# Switch to non-root user
USER runner

# Run the compilation and execution script
ENTRYPOINT ["/app/run.sh"]
