# NEVU for Plex
Fixing Plex's old and simple UI.

**PerPlexed is now Nevu!**

[**Docker Hub**](https://hub.docker.com/r/ipmake/nevu)

*Click image for video*
[![Nevu1](assets/screenshot1.png)](https://www.youtube.com/watch?v=PuTOw3Wg9oY)
![Nevu2](assets/screenshot2.png)
[More Screenshots](https://github.com/Ipmake/Nevu/tree/main/assets)

## Description

Nevu is a complete redesign of Plex's UI using the Plex media server's API. It comes with its own web server. As the keen eye may notice, the UI is heavily inspired by Netflix's UI. It is currently only developed for desktops and laptops. It is not optimized for mobile or TV use.

Nevu currently supports Movie and TV Show libraries. You can also play media via the interface.

Mind that this project is still in development and may be unstable.


## Features
- Modern, Netflix-like UI
- Seamless Plex integration
- Play media
- Browse libraries
- Search for media
- Watch Together (Nevu Sync)
- Get Recommendations
- Fully integrated Watchlist
- Simple and easy to use
- Pro-User features (like special shortcuts etc.)

## Installation

### Docker

The easiest way to run Nevu is to use Docker. You can use the following command to run Nevu in a Docker container:

```bash
docker volume create nevu_data
docker run --name nevu -p 3000:3000 -v nevu_data:/data -e PLEX_SERVER=http://your-plex-server:32400 ipmake/nevu
```

### Docker Compose

Alternatively, you can use Docker Compose to run Nevu. Create a `docker-compose.yml` file with the following content:

```yaml
services:
    nevu:
        image: ipmake/nevu
        container_name: nevu
        ports:
            - "3000:3000"
        volumes:
            - nevu_data:/data
        environment:
            - PLEX_SERVER=http://your-plex-server:32400

volumes:
    nevu_data:
```

Then run:

```bash
docker-compose up -d
```

### Environment Variables
| Name                     | Type       | Required | Description                                                                 |
|--------------------------|------------|----------|-----------------------------------------------------------------------------|
| `PLEX_SERVER`            | string     | Yes      | The URL of the Plex server that the backend will proxy to (CAN BE LOCAL)    |
| `DISABLE_TLS_VERIFY`     | true/false | No       | If set to true, the proxy will not check any https ssl certificates         |
| `DISABLE_NEVU_SYNC`      | true/false | No       | If set to true, Nevu sync (watch together) will be disabled                 |
| `DISABLE_REQUEST_LOGGING`| true/false | No       | If set to true, the server will not log any requests                        |



## Contributing
Pull requests are welcome for any feature or a bug fix. For major changes, please open an issue first to discuss what you would like to change.

## Development

To develop you need 2 terminals for the front and the backend of Nevu

```bash
# Terminal 1
cd frontend
npm start

# Terminal 2
cd backend
PLEX_SERVER=http://plex-server:32400 npm start
```
