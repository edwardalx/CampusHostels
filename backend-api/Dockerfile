# ----------------------------
# Build Stage
# ----------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy everything
COPY . .

# Restore and publish
RUN dotnet restore
RUN dotnet publish -c Release -o /app

# ----------------------------
# Runtime Stage
# ----------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app .

EXPOSE 5000

ENTRYPOINT ["dotnet", "BackendApi.dll"]
