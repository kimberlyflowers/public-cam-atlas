# Public Cam Atlas

A production-ready, map-first directory of intentionally public camera feeds. Adapters currently use official Caltrans and TxDOT/DriveTexas public camera services and continuous HLS streams.

## Safety boundary

This project only ingests cameras deliberately published by public agencies or operators for public viewing. It does not scan IP ranges, guess credentials, bypass access controls, or index accidentally exposed cameras. Every network proxy uses an explicit hostname allowlist.

## Features

- Normalized camera schema covering identity, operator, coordinates, source provenance, stream format, status, and check time
- Adapter interface for independent source integrations
- More than 1,900 continuous Caltrans and 3,400 DriveTexas HLS feeds with native/Hls.js fallback
- MJPEG and timed image-refresh support for future adapters and graceful fallback
- Server-side source and image proxying to avoid browser CORS/mixed-content failures
- Map, text search, status filters, camera cards, detail player, and source links
- Per-camera allowlisted availability checks with timeout handling
- Responsive desktop and mobile layouts

## Source adapter

`src/lib/adapters/caltrans.ts` consumes Caltrans' public ArcGIS CCTV layer. Camera metadata and images remain hosted by Caltrans; this app does not redistribute an offline copy. The service identifies its content as Copyright © 2020 State of California. Review the operator's current terms before adding commercial reuse or bulk archival.

`src/lib/adapters/drivetexas.ts` reads the same public, unauthenticated camera table used by the official DriveTexas map. Streams remain hosted by TxDOT's video delivery provider, are displayed live, and are never recorded or archived by this app.

Add another source by implementing the `CameraAdapter` interface in `src/lib/camera.ts`, normalizing its records, and explicitly adding its public media hostnames to the proxy allowlists.

## Local development

```bash
npm install
npm run dev
```

Production check:

```bash
npm run lint
npm run build
```

## Official references

- [Caltrans CCTV ArcGIS service](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/CCTV/MapServer/layers)
- [Caltrans QuickMap camera viewer](https://cwwp2.dot.ca.gov/vm/iframemap.htm)
- [DriveTexas official map](https://drivetexas.org/)
- [TxDOT live camera directory](https://www.txdot.gov/discover/live-traffic-cameras.html)
- [511 Wisconsin API documentation](https://511wi.gov/developers/doc) — suitable for a future adapter after obtaining a developer key and accepting its agreement

## License

Application code is MIT licensed. Third-party camera metadata, imagery, tiles, and streams remain subject to their respective operators' terms and attributions.
