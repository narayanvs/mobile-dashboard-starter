# Advanced: freeze a customised frontend

Only needed if you edit JavaScript or artwork directly. Normal settings belong in
the visual editor and survive HACS file replacement without these steps.

1. Copy the entire `/config/www/community/mobile-dashboard-starter/` folder to
   `/config/www/mobile-dashboard-starter-frozen/`, including all images.
2. In Settings → Dashboards → Resources, replace this package’s HACS resource
   with a JavaScript module at
   `/local/mobile-dashboard-starter-frozen/mobile-dashboard-starter.js`.
3. Load only this copy; loading both can register conflicting custom elements.
4. Edit your frozen folder. Keep it backed up with the dashboard and entity mappings.

Later HACS downloads will not change this separate folder. It will not receive
fixes automatically, and future Home Assistant changes may require manual repairs.
To try a newer release, use a separate snapshot and review its changes first.
