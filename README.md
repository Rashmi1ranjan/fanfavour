
## Start project with Docker

### Docker installation

Go to the official website of Docker and install: https://docs.docker.com/engine/install/ubuntu/

Wiki reference to setup the Docker: https://wiki.rayoinfotech.com/doku.php?id=docker-implementation

### Steps to run project using Docker

You can start the project with Docker using the repository-level Docker Compose file (recommended for full dev environment)

Using docker compose (recommended)

From the repository root run the development compose file. This will build images and start services defined in `docker-compose.yml`:

```bash
# recommended (modern Docker CLI)
docker compose up --build

# to run in background
docker compose up --build -d

# stop and remove containers
docker compose down
```

Notes

- If your setup needs additional environment variables, ensure `.env` or the compose config includes them.
- Use `docker compose logs -f` or `docker logs -f <container>` to stream logs while developing.
