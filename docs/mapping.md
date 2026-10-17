# Entity mapping

For normal setup, use the card’s visual editor; it saves mappings in the HA
dashboard configuration. The optional external mapping file is JSON, not YAML.
Advanced users can copy the example, edit it locally and reload the browser. `schema_version` is `1`. Blank strings are optional and never cause an HA
service call. Use real entity IDs, not friendly names.

## Automatic discovery

`auto_detect` defaults to `true`. Areas can have any name; they come from Home Assistant’s registry;
entity areas can also be inherited from their device. Common room names are
matched to the example layout, and any other HA areas are added using their own
names. No household-specific entity naming convention is required. A field is filled only when one
enabled, visible entity matches. Existing explicit mappings always win.

Temperature discovery excludes sensors belonging to devices with a climate
entity, to avoid selecting a TRV’s built-in reading. Lights must be `light`
entities; switch relays and plug controls are never guessed. Multiple matching
lights or sensors remain unmapped. Appliance discovery matches a named power
sensor/device model or user-defined device name (for example, “Dishwasher”) with
the power device class. A generic plug without identifying metadata cannot reveal
what appliance is connected to it; map that one yourself.

Set `auto_detect` to `false` for strictly manual configuration. Discovery needs
registry access; if your HA user cannot read it, use the mapping file instead.
Discovery never writes to your mapping file, registries or HA configuration.
Forced demo mode skips discovery entirely.

## Rooms

Each room has a unique lowercase `id`, `name`, optional MDI `icon`, and `entities`:
`temperature`, `humidity`, `presence`, `door`, `light`, `light_secondary`, `climate`.
Use external room sensors if available. Light controls accept `light` or `switch`;
advanced controls use the native HA dialog. Climate buttons change the mapped
thermostat target only. They do not control your boiler or create a heating policy.

### Room artwork

Images are independent of entity and area IDs. Discovery chooses a bundled room
style from the area name/icon, or uses a generic fallback. To choose explicitly,
add `"artwork": "kitchen"` (or a common room ID such as `office`, `main_bedroom`,
`bathroom`, `ensuite`, `toilet`, `attic`, `storage` or `outdoor`) to that room.
Optional `picture` and `icon_picture` accept your own local image URLs under
`/local/`, `/media/` or HA’s `/api/image/serve/`. Explicit choices take priority.
Do not rename entities merely to change a room’s illustration.

## Lighting modes

Optional room mappings: `sleep_mode` (input_boolean: on = resting, off = awake),
`manual_hold` (input_boolean: on = set manually), and `mode_script` (script).
The script should toggle that room’s mode and set its manual hold. All three are
required for real mode controls; the package does not create or guess your mode
policy. Completely unmapped mode controls use labelled local demos.

Awake/resting are separate from whether the light is currently on. The four
combinations of automatic/manual and awake/resting have distinct colours and labels.

## Energy

`energy.entities` accepts:

- `solar_power`, `home_power`, `battery_power`, `grid_import_power`,
  `grid_export_power`, `ev_power`, `forecast_power`: **W or kW**.
- `solar_today`, `home_today`, `import_today`, `export_today`, `charged_today`,
  `discharged_today`, `forecast_today`: **Wh or kWh**, daily-reset energy totals.
- `battery_soc`: percentage.

Grid import and export power must be separate, non-negative sensors. The chart
subtracts export from import: **positive = importing**. If your inverter only has
signed net grid power, create separate template sensors in your own HA setup.

Set `energy.battery_positive` to `charging` or `discharging` to match your inverter.
The displayed chart always uses **positive = charging, negative = discharging**.
No inverter brand is required. Unknown units show unavailable, not an assumed value.

`energy.flows` can map daily kWh/Wh readings for `solar_to_battery`, `solar_to_home`,
`solar_to_grid`, `battery_to_home`, `battery_to_grid`, `grid_to_home`,
`grid_to_battery`. Ribbons use only those measured values. Tap a source or
destination to highlight its connections and percentages of its configured total.
Flow totals may be incomplete if only some relationships are mapped.

Live power history uses HA recorder statistics (`mean`, five-minute periods) for
**today**, not raw instantaneous samples. `forecast_power` supplies recorded forecast
power; it does not automatically decode provider-specific future forecast arrays.
The initial starter does not reconstruct weekly/monthly allocations, predict
future power, calculate tariffs or infer missing solar/battery relationships.

## Appliances

Supported `kind`: `washer`, `dryer`, `dishwasher`, `kettle`, `extractor`, `tv`, `pc`,
`desk`, `server`, `router`, `network`, `device`.

Entities: `power` (W/kW), `running` (optional), `started_at` (optional),
`daily_energy`/`monthly_energy` (Wh/kWh), `plug` (optional).

An explicit `running` entity is authoritative. Configure `running_states` if its
active values differ from the defaults. Without one, `running_threshold_w` (default
5 W) decides whether the animation runs. Adjust for your device’s standby draw.
A power threshold indicates activity; it is not a full cycle detector. A missing
or unavailable explicit running state never falls back to a guessed running state.
Optional cycle details: `cycle_energy` (Wh/kWh), `last_duration`, `last_energy`
(Wh/kWh), `progress` (0–100 percent), `finishes_at` (timestamp/ISO datetime),
`remaining_time`, `programme` and `door`. Duration sensors use their reported
seconds/minutes/hours; `duration_unit` (`s`, `min`, `h`, default `min`) supplies
an explicit fallback when the sensor has no unit. `power_max_w` sets the power
bar’s scale and does not change the reading. Today/Month energy buttons use the
mapped daily/monthly counters; no daily or cycle totals are calculated from a
single instantaneous power reading. Tap a configured energy total or history
button to open HA’s native history/details.

Running appliances expand by default; your manual fold choices last while the
card remains mounted. Plug controls open HA’s native dialog; no infrastructure is
switched automatically. Elapsed time requires a valid mapped start timestamp.

## Other sections

```json
{
  "people": [{"name": "Resident 1", "entity": "person.resident_1"}],
  "calendars": [{"name": "Family", "entity": "calendar.family"}]
}
```

These are fragments to merge into the main mapping. Calendar source authentication
belongs to HA; this package needs no credentials. Calendar permissions and write
support come from the integration. Demo events are local illustrations only.

Lab `entities`: `status` (`on` means online), `power`, `cpu`, `memory`, `temperature`.
Car `entities`: `car_soc`, `car_range`, `ev_power`.
Security `entities`: `alarm`, `front_door`, `back_door`, `lock`, and keys starting
with `camera` for camera entities. No recordings, face detection or notification
backend is installed.

## Demo behaviour

- `true`: ignore mappings and show sample readings; device controls are local only.
- `auto`: completely unmapped sections show labelled demos; configured sections
  use real data. Unavailable configured entities remain unavailable.
- `false`: use mappings only, without generated readings.

Weather demo status is independent of energy status. All sample values exist only
inside the frontend; no dummy entity, helper, recorder data or automation is created.

## Additional page details

The Appearance menu floats above the dashboard. Drag its heading to move it aside while previewing changes; its position is remembered in your browser. Close with × or Escape.

Energy includes power metrics, solar outlook, actual versus forecast, household demand and daily destination/appliance breakdowns. Lab includes infrastructure power, server resource rings and a folded overview. Optional energy mapping: `expected_home_power` (W/kW). Lab items accept `storage` (%), `latency`, `clients`, and `download` alongside existing CPU/memory/temperature/power/status fields. Missing readings stay unavailable; demo sections are labelled. Forecast comparisons use recorded power history for today and mapped full-day forecast totals; they do not invent historic forecast data or train a prediction model.

Calendar automatically includes visible HA `calendar.*` entities when automatic discovery is enabled, preserving names/colours you mapped explicitly. It uses the same full calendar frontend as the original dashboard (month/week/day/agenda, filters, event details and supported add/edit/delete actions), backed by HA calendar integrations. Forced demo uses session-only sample events and never writes to real calendars. Set `auto_detect: false` to use only your mapped calendars.

Lab uses the original console layout: power monitoring, collapsed At a glance with Server/Network shortcuts, Server & storage, Home network, Internet speed, DNS protection and recorded power trends. Map lab items by `kind` (`server`, `router`, `network`, `access_point`, `zigbee`, `thread`, `mqtt`, `dns`). Extra optional entity keys include `daily_energy`, `array_status`, `parity_status`, `app_cache`, `array_usage`, `data_cache`, `media_storage`, `cctv_storage`, `missing_disks`, `docker_memory`, `upload`, `blocked_percent` and `queries`. Coordinator/service `status` expects `online`, DNS protection `on`; access points can set `good_state`. Only configure metrics your integrations expose; unmapped groups are omitted in live-only mode.

## Original Energy card layouts

The overview, power chart, household-demand panel and consumption ring reuse the
original dashboard frontend. The starter translates your mappings into local
rendering aliases; sensor-history buttons still open your real mapped entities.
No Sigenergy, Zappi, Solcast or custom learning component is required.

Optional Energy fields: `ev_today`, `ev_status`, `battery_mode`,
`battery_temperature`, `self_sufficiency`, `self_consumption`, `import_cost_today`,
`export_credit_today`, `net_cost_today`, `forecast_remaining`, `forecast_tomorrow`,
`expected_energy_today`, `energy_learning`, `projected_energy_today`,
`energy_anomaly`. Costs and percentages are shown only when supplied. Temperature
and currency retain their real units.

The power chart uses + grid import, − grid export, + battery discharge, − battery
charge and − household use, matching the original chart. Set `battery_positive`
to the sign convention of your integration; the adapter converts it for display.
The overview uses charging/discharging labels rather than signed power.
Sunrise/sunset use HA sun data, with an astronomical approximation from HA’s
location if needed; no coordinates are bundled or written to the mapping.
Forecast curves can use a mapped forecast entity’s compatible `detailedForecast`
attribute (`period_start` / `pv_estimate`) or recorded forecast-power readings.

The consumption ring uses mapped appliance/lab `daily_energy` sensors and the
whole-home daily total. Untracked use is calculated only when every listed meter
is available and their sum does not exceed the home total. Overlaps or different
reset times are reported, not silently offset.

A live demand baseline needs a mapped `expected_energy_today` entity with a
`profile` attribute: hourly objects containing `hour`, `expected`, `actual`, `low`,
`high` and optional `samples`. Without that data, the card reports that no baseline
is configured; the frontend does not invent or train one. Demo baselines are labelled.

## Multiple presence sensors

Rooms can include `presence_entities`, a list of binary sensor IDs. With the main
`entities.presence` field empty, any active sensor marks the room occupied.
Unavailable sensors are not treated as confirmed absence. This is a display-only
aggregation; it does not create helpers or change lighting automations.
The visual editor exposes this list under **Additional presence sensors**.
