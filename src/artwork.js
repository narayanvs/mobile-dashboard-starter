// Artwork is independent of HA entity/area IDs. Each bundled path exists in dist.
export const ROOM_ARTWORK={
 living_room:{icon:'living_room',photo:'myhome-rooms-v1--living-room.png'},
 kitchen:{icon:'kitchen',photo:'myhome-rooms-v1--kitchen.png'},
 dining_room:{icon:'kitchen',photo:'myhome-rooms-v1--kitchen.png'},
 hallway:{icon:'hallway',photo:'myhome-rooms-v3--hallway.png'},
 main_bedroom:{icon:'master_bedroom',photo:'myhome-rooms-v3--master_bedroom.png'},
 kids_bedroom:{icon:'kids_bedroom',photo:'myhome-rooms-v3--kids_bedroom.png'},
 guest_bedroom:{icon:'guest_bedroom',photo:'myhome-rooms-v3--guest_bedroom.png'},
 office:{icon:'office',photo:'myhome-rooms-v3--office.png'},
 bathroom:{icon:'shower_room',photo:'myhome-rooms-v3--shower_room.png'},
 shower:{icon:'shower_room',photo:'myhome-rooms-v3--shower_room.png'},
 ensuite:{icon:'ensuite',photo:'myhome-rooms-v3--ensuite.png'},
 toilet:{icon:'toilet',photo:'myhome-rooms-v3--toilet.png'},
 utility:{icon:'kitchen_store',photo:'myhome-rooms-v3--kitchen_store.png'},
 landing:{icon:'landing',photo:'myhome-rooms-v3--landing.png'},
 garage:{icon:'attic',photo:'myhome-rooms-v3--attic.png'},
 attic:{icon:'attic',photo:'myhome-rooms-v3--attic.png'},
 outdoor:{icon:'outdoor-v1',photo:'myhome-rooms-v1--outdoor-v1.png'},
 storage:{icon:'upstairs_store',photo:'myhome-rooms-v3--upstairs_store.png'},
 hallway_store:{icon:'hallway_store',photo:'myhome-rooms-v3--hallway_store.png'},
 kitchen_store:{icon:'kitchen_store',photo:'myhome-rooms-v3--kitchen_store.png'},
 generic:{icon:'living_room',photo:'myhome-dashboard-banners--house.png'}
};
export const safeLocalImage=value=>typeof value==='string'&&/^\/(?:local\/|media\/|api\/image\/serve\/)/.test(value)&&!value.includes('\\');
export function roomArtworkType(room){
 if(ROOM_ARTWORK[room.artwork])return room.artwork;
 if(ROOM_ARTWORK[room.type])return room.type;
 if(ROOM_ARTWORK[room.id])return room.id;
 const name=String(room.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const rules=[[/ensuite/,'ensuite'],[/toilet|cloakroom/,'toilet'],[/shower|bathroom/,'bathroom'],[/kitchenstore/,'kitchen_store'],[/hallwaystore/,'hallway_store'],[/store|storage|hotpress/,'storage'],[/kitchen/,'kitchen'],[/dining/,'dining_room'],[/living|lounge|sitting/,'living_room'],[/kids|children/,'kids_bedroom'],[/guest|sparebed/,'guest_bedroom'],[/master|mainbed|primarybed|bedroom/,'main_bedroom'],[/office|study/,'office'],[/utility|laundry/,'utility'],[/landing|stairs/,'landing'],[/hall|entrance/,'hallway'],[/attic|loft/,'attic'],[/garage/,'garage'],[/outdoor|garden|outside/,'outdoor']];
 for(const [pattern,type]of rules)if(pattern.test(name))return type;
 const icon=String(room.icon||'');for(const [pattern,type]of [[/shower|bath/,'bathroom'],[/toilet/,'toilet'],[/bed/,'main_bedroom'],[/desk|office|book/,'office'],[/sofa/,'living_room'],[/countertop|stove|fridge/,'kitchen'],[/washing|dryer/,'utility'],[/stairs/,'landing'],[/tree|flower|weather/,'outdoor'],[/garage/,'garage']])if(pattern.test(icon))return type;
 return'generic';
}
export function roomArtwork(room,base){const type=roomArtworkType(room),art=ROOM_ARTWORK[type];return{type,photo:safeLocalImage(room.picture)?room.picture:base+art.photo,icon:safeLocalImage(room.icon_picture)?room.icon_picture:base+'myhome-room-icons-v1--'+art.icon+'.png'};}
