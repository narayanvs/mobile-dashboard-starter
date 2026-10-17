from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
rooms={'living_room':('Living room','mdi:sofa-outline'),'kitchen':('Kitchen','mdi:countertop-outline'),'dining_room':('Dining room','mdi:silverware-fork-knife'),'hallway':('Hallway','mdi:door-open'),'main_bedroom':('Main bedroom','mdi:bed-king-outline'),'kids_bedroom':('Kids bedroom','mdi:bed-single-outline'),'guest_bedroom':('Guest bedroom','mdi:bed-outline'),'office':('Office','mdi:desk'),'bathroom':('Bathroom','mdi:shower'),'utility':('Utility room','mdi:washing-machine'),'landing':('Landing','mdi:stairs'),'garage':('Garage','mdi:garage'),'outdoor':('Outdoor','mdi:tree-outline')}
c={'schema_version':1,'auto_detect':True,'title':'Our home','demo':'auto','weather':'','sun':'sun.sun','rooms':[{'id':id,'name':name,'icon':icon,'entities':dict.fromkeys(['temperature','humidity','presence','door','light','light_secondary','climate','sleep_mode','manual_hold','mode_script'],'')} for id,(name,icon) in rooms.items()],'energy':{'battery_positive':'charging','entities':dict.fromkeys(['solar_power','home_power','battery_power','battery_soc','grid_import_power','grid_export_power','solar_today','home_today','import_today','export_today','charged_today','discharged_today','forecast_today','forecast_power','ev_power'],'') ,'flows':dict.fromkeys(['solar_to_battery','solar_to_home','solar_to_grid','battery_to_home','battery_to_grid','grid_to_battery','grid_to_home'],'')},'people':[],'appliances':[{'id':id,'name':name,'kind':kind,'running_threshold_w':5,'power_max_w':{'kettle':3000,'extractor':300,'tv':500,'pc':1200,'desk':1000}.get(kind,2500),'duration_unit':'min','running_states':['on','run','running','washing','drying','playing'],'entities':dict.fromkeys(['power','running','started_at','daily_energy','monthly_energy','cycle_energy','last_duration','last_energy','progress','finishes_at','remaining_time','programme','door','plug'],'')} for id,name,kind in [('washer','Washing machine','washer'),('dryer','Dryer','dryer'),('dishwasher','Dishwasher','dishwasher'),('kettle','Kettle','kettle'),('extractor','Extractor','extractor'),('tv','TV','tv'),('gaming_pc','Gaming PC','pc'),('desk','Office desk','desk')]],'lab':[{'id':id,'name':name,'kind':kind,'entities':dict.fromkeys(['status','power','cpu','memory','temperature'],'')} for id,name,kind in [('server','Home server','server'),('router','Router','router'),('network','Network switch','network')]],'security':{'entities':dict.fromkeys(['alarm','front_door','back_door','lock','camera_front'],'')},'car':{'name':'Our car','entities':dict.fromkeys(['car_soc','car_range','ev_power'],'')},'calendars':[]}
(R/'examples/entity-mapping.example.json').write_text(json.dumps(c,indent=2)+'\n')
(R/'examples/dashboard.yaml').write_text('''title: Mobile Dashboard
views:
  - title: Home
    path: home
    type: sections
    max_columns: 1
    sections:
      - type: grid
        cards:
          - type: custom:mobile-dashboard-starter
            config_version: 1
            mapping:
              schema_version: 1
              demo: auto
            page: home
            grid_options:
              columns: full
              rows: auto
''')
(R/'examples/demo-dashboard.yaml').write_text('''title: Mobile Dashboard Demo
views:
  - title: Demo
    path: home
    type: sections
    max_columns: 1
    sections:
      - type: grid
        cards:
          - type: custom:mobile-dashboard-starter
            page: home
            mapping:
              schema_version: 1
              demo: true
            grid_options:
              columns: full
              rows: auto
''')
print('Wrote entity mapping and two dashboard examples')
