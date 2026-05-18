# GMAT Container Tasks

- [Quick start](#quick-start)
- [Per-service](#per-service)
- [All services](#all-services)
- [CI (local testing with act)](#ci-local-testing-with-act)
- [Utility](#utility)

## Quick start

```
docker run -d -p 127.0.0.1:15801:80 --platform linux/amd64 --name gmat-vnc \
  ghcr.io/haisamido/gmat-ui/gmat-vnc:latest
```

Open http://localhost:15801/vnc.html

To stop and remove:

```
docker stop gmat-vnc && docker rm gmat-vnc
```

Or with Task:

```
task build:vnc        Build the VNC image
task up:vnc           Start the VNC service
                      Open http://localhost:15801/vnc.html
```

## Per-service

Replace `web` with `vnc`, `x11`, or `console`.

```
task build:web        Build image
task rebuild:web      Rebuild image (no cache)
task up:web           Start service  (aliases: start:web, run:web)
task down:web         Stop service   (aliases: stop:web)
task logs:web         Follow logs
task clean:web        Remove container and image
```

| Service | Access |
|---------|--------|
| web     | http://localhost:8989 |
| vnc     | http://localhost:15801/vnc.html |
| x11     | X11 forwarding (requires XQuartz on macOS) [not fully functional yet]|
| console | `task logs:console` |

## All services

```
task build            Build all images
task rebuild          Rebuild all images (no cache)
task up               Start all services  (aliases: start, run)
task down             Stop all services   (aliases: stop)
task clean            Remove all containers, images, and networks
```

## CI (local testing with act)

```
task ci:web           Run CI for web target
task ci:vnc           Run CI for vnc target
task ci:dry-run       Dry-run all CI builds
```

## Utility

```
task check:x11        Verify X11 server is running
task help             Show this help
```
