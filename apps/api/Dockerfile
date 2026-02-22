FROM node:20-alpine

WORKDIR /app

# Create package.json
RUN echo "{ \"type\": \"module\" }" > package.json

# Install dependencies
RUN npm install express cors tsx

# Copy server
COPY apps/api/src/server.ts ./

ENV PORT=3000
EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
