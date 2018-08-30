# Saga

Backend for [Vega](https://github.com/vegapublish/vega)

# About the name

Saga is an abbreviation of Sagittarus A\* which is the radio source likely to be the supermassive black hole at the center of the milky way galaxy ♐

# Getting started

## Prerequisites
- MongoDB v3.x or newer
- Node.js v8.x or newer
- npm v6.x or newer

To setup a new instance of `saga`, start by cloning this repo with:
```
git clone https://github.com/VegaPublish/saga.git
```

## Configure oauth for root user claiming
As a part of the initial setup, a root user needs to be added to the system.
In order to claim the root user, a oauth config file must be created in `./config/oauth.json` (take a look at `./config/oauth.fallback.json` for an example.

## First setup
Once oauth is configured you can proceed with first time setup. Before you continue, make sure the server is running in the background with `npm run start`.
`npm run setup`. This will guide you through the process of claiming a root user and setting up the default venue.

## Adding a new journal or conference (a.k.a. _venue_)
After first setup, you can create new venues by running `npm run create-venue`. This will guide you through the necessary steps.

## Running the server
`npm run start`

# Config options
### List of possible environment variables:

- `SAGA_HTTP_PORT`: The port to run the backend on (default `4000`)
- `SAGA_HTTP_HOST`: Which HTTP host to run on: (default `127.0.0.1`)
- `SAGA_LOG_LEVEL`: The loglevel to use (passed on to `pino` which is used for logging) (default `info`)
- `SAGA_SESSION_NAME`: Session name (default `sagaSession`)
- `SAGA_SESSION_SECRET`: Session secret
- `SAGA_SESSION_TTL_MS`: Session cookie TTL 
- `SAGA_AUTH_PROVIDERS_CONFIG_PATH`: Path to oauth provider config (default `./config/oauth.json`)
- `SAGA_DATA_MAX_INPUT_BYTE`: Payload size limit for posted data (default 2MB)  
- `SAGA_ASSETS_MAX_INPUT_BYTE`: Size limit for uploaded assets (default 15MB) 
- `SAGA_ASSETS_FS_BASE_PATH`: The base path of assets stored on disk (default `./data/assets/`)
- `SAGA_CORS_MAX_AGE`: Configures the Access-Control-Max-Age CORS header (default `600` ms) 
- `SAGA_CORS_ORIGIN`: A comma delimited string with all the allowed CORS origins.
- `SAGA_CORS_EXPOSED_HEADER`: Configures the Access-Control-Expose-Headers CORS headers. This will be added in addition to `Content-Type`, `Content-Length` and `ETag`
- `SAGA_MONGODB_URL`: URL to MongoDB instance (default `mongodb://localhost:27017`)
