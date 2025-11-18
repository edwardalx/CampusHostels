# backend-api/Dockerfile

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy everything
COPY . .

# Find your .csproj file name
RUN dotnet restore YourBackendApi.csproj

# Publish
RUN dotnet publish YourBackendApi.csproj -c Release -o /app

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app ./

EXPOSE 5000
ENTRYPOINT ["dotnet", "YourBackendApi.dll"]
