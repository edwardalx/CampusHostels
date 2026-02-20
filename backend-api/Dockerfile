# ----------------------------
# Build stage
# ----------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Reduce .NET network flakiness
ENV DOTNET_SYSTEM_NET_HTTP_USESOCKETSHTTPHANDLER=0

# Copy only csproj first (better layer caching)
COPY CampusHostels.API/CampusHostels.API.csproj ./CampusHostels.API/

# Restore with safer settings
RUN dotnet restore ./CampusHostels.API/CampusHostels.API.csproj \
    --disable-parallel \
    --verbosity minimal

# Copy everything else
COPY . .

# Publish
RUN dotnet publish ./CampusHostels.API/CampusHostels.API.csproj \
    -c Release \
    -o /app \
    --no-restore

# ----------------------------
# Runtime stage
# ----------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=build /app ./

EXPOSE 5000
ENTRYPOINT ["dotnet", "CampusHostels.API.dll"]