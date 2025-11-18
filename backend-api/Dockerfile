# backend-api/Dockerfile

# ----------------------------
# Build stage
# ----------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the csproj and restore dependencies
COPY CampusHostels.API/CampusHostels.API.csproj ./CampusHostels.API/
RUN dotnet restore ./CampusHostels.API/CampusHostels.API.csproj

# Copy all source code
COPY . .

# Publish the application
RUN dotnet publish ./CampusHostels.API/CampusHostels.API.csproj -c Release -o /app

# ----------------------------
# Runtime stage
# ----------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

# Expose port
EXPOSE 5000

# Run the API
ENTRYPOINT ["dotnet", "CampusHostels.API.dll"]
