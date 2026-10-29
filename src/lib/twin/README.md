# Camp twin demonstrator

Company-only route: `/company/digital-twin`. This is an explicitly simulated camp, not a live digital twin or government integration. The ministry navigation is unchanged.

- One fictional Mina camp with three zones, 1,200 recorded capacity and 970 occupants. These values are scenario assumptions, not regulatory limits or the entire company's population.
- Manual and generated events update the observed camp. Every accepted event records origin, observed/received times, previous value and revision. The history retains 100 events and the duplicate window retains 2,000 event IDs.
- The optional five-second feed changes the current zone occupancy by ten, rotating zones. It is off by default, uses no network/sensors and stops when the page unmounts.
- Counts must be finite nonnegative integers. Wrong field types, duplicate IDs, older observations and future timestamps are rejected. An operational observation can exceed capacity so the actual problem stays visible.
- Proposals clone the current state. Transfers conserve total occupancy. Capacity overflow, per-zone catering deficit, a closed exit or occupied zone with zero workers blocks adoption. Observations older than 60 seconds and changed baseline revisions also block adoption. These are local operational checks, not official compliance verdicts or validated evacuation/crowd simulations.
- A reviewed, safe proposal becomes simulated occupancy events. It never sends field commands or modifies the existing company/evidence stores.
- `projection.ts` separately passes an explicit assumed company-population change into the existing deterministic applicability/verification engine. The company fixture and regulatory weights remain untouched. Camp meal/capacity checks do not become regulatory statuses.
- State is versioned and validated before restoring from this browser's localStorage. It is not shared across users or devices. Storage failure is visible.

## Reproducible checks

Initial state: 970 people, capacity 1,200, no meal deficit. Add 200 to zone C: total 1,170, zone overflow 80 and catering deficit 180; adoption blocked. Move 20 from A to C: total remains 970, no deficits; adoption creates two events. A later event invalidates the proposal. Reload preserves accepted local updates and the log.

## Connecting real operations later

Add authenticated, tenant-scoped event ingestion and shared persistent storage; bind camp/zone identities to a real operator's records; validate timestamps, source authorisation, duplicates and concurrent revisions on the server; calibrate calculations against operational observations. Add a ministry read-only view only after a real access-control model and scope of shared data are defined. The demonstrator does not provide these production guarantees.
