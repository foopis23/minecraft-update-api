# Minecraft Server Versions API

This is a simple API that allows you to keep your server up to date with the latest server jar

## Documentation
- [API Documentation](https://minecraft-update-api-production.up.railway.app/docs)

## Usages

```bash
#!/bin/bash
# update.sh

# stop the server somehow...

# Download Latest Release as "server.jar"
curl -L -X 'GET' \
  'https://minecraft-update-api-production.up.railway.app/vanilla/latest/release' \
  -o 'server.jar'

# start the server somehow...
```

## Running the API
```bash
bun run start
```

## Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/xDMYoi?referralCode=ShtSlb)
