# GMAT Container Tasks

## Per-service

Replace `web` with `x11` for native GUI.

```
task build:web        Build image
task rebuild:web      Rebuild image (no cache)
task up:web           Start service  (aliases: start:web, run:web)
task down:web         Stop service   (aliases: stop:web)
task logs:web         Follow logs
task clean:web        Remove container and image
task message:web      Show gmat-web connection info
```

## All services

```
task build            Build all images
task rebuild          Rebuild all images (no cache)
task up               Start all services  (aliases: start, run)
task down             Stop all services   (aliases: stop)
task clean            Remove all containers, images, and networks
task message          Show connection info for all services
```

## Utility

```
task check:x11        Verify X11 server is running
task message:x11      Show gmat-x11 display info
task help             Show this help
```
