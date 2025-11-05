# backend-api/Dockerfile

# Use the official .NET SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build

WORKDIR /app

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy the rest of the code
COPY . ./

# Build the application
RUN dotnet publish -c Release -o out

# Use a runtime image
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

# Expose port
EXPOSE 5000

# Run the API
ENTRYPOINT ["dotnet", "YourBackendApi.dll"]
