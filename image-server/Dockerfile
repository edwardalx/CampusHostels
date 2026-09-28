# image-server/Dockerfile

# ----------------------------
# Build stage
# ----------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the csproj and restore dependencies
COPY ImageServer.csproj ./
RUN dotnet restore ./ImageServer.csproj

# Copy all source code
COPY . .

# Publish the application
RUN dotnet publish ./ImageServer.csproj -c Release -o /app

# ----------------------------
# Runtime stage
# ----------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

ENV ASPNETCORE_URLS=http://0.0.0.0:80
EXPOSE 80

ENTRYPOINT ["dotnet", "ImageServer.dll"]
