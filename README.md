# Harvest Time Off

Create Harvest duration entries for a date range from the command line or OMP. The CLI defaults to 7 hours per local business day, resolves an active project/task assignment by name, and never writes until you omit `--dry-run`.

```bash
HARVEST_ACCESS_TOKEN='…' \
HARVEST_ACCOUNT_ID='…' \
HARVEST_HOLIDAY_REGIONS=ca_yt \
harvest-time-off 2026-08-17 2026-08-28 \
  --project 'Time Off - Marlen' \
  --task 'Vacation / PTO' \
  --notes 'regular time off' \
  --dry-run
```

`--holiday-region` may be repeated to override `HARVEST_HOLIDAY_REGIONS`. Regions use the [Holidays](https://github.com/holidays/holidays) identifiers, such as `ca_yt`; observed statutory holidays are excluded. The CLI uses `business_time` for weekday/workday calculation.

## OMP

The linked OMP extension registers the approval-gated `harvest_time_off` tool. Its settings are:

- `defaultHours`: hours per business day when a tool call omits `hours`; defaults to `7`.
- `holidayRegions`: comma-separated Holidays regions. Leave empty only when `HARVEST_HOLIDAY_REGIONS` is already set in OMP's environment.
- `command`: direct path to the `harvest-time-off` executable.

The tool requires approval before it mutates Harvest.
