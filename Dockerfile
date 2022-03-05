FROM node:14-alpine3.12 as frontend-build

# Set the working directory for the app
WORKDIR /usr/src/app
# Copy the package.json for the frontend dependencies
COPY frontend/package.json package.json
# Install the frontend dependencies
RUN npm install
# Copy the front end source code
COPY frontend .
# Build the frontend
RUN npm run build

FROM golang:1.18rc1-alpine3.15 as backend-build
# Set the working directory for the app
WORKDIR /usr/src/app
# Copy the built frontend output into the
COPY --from=frontend-build /usr/src/app/dist ./public
# Copy over the source code for the backend
COPY backend .
# Install git with the apk package manager (used by the golang dependencies)
RUN apk add git
# Run go build and build the application to the file "quizler"
RUN go build -o quizler

# Set the address environment variable to be any address
ENV QUIZLER_ADDRESS="0.0.0.0"
# Set the port to port 8080
ENV QUIZLER_PORT=8080
# Expose the port
EXPOSE ${QUIZLER_PORT}

# Execute the server
CMD ["./quizler"]
