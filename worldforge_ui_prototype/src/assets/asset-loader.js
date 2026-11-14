import { verifySnapshotIntegrity } from '../services/project-asset-snapshot-service.js';

const MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
export class AssetLoader {
    constructor(registry,{maxCacheEntries=200}={}){
        if(!registry||typeof registry.getAssetFile!=='function')throw new Error('AssetLoader requires an AssetRegistry.');
        this.registry=registry;this.maxCacheEntries=Math.max(1,maxCacheEntries);this.cache=new Map();this.listeners=new Set();this.projectSnapshots=new Map();
    }
    subscribe(listener){
        if(typeof listener!=='function')throw new Error('AssetLoader subscriber must be a function.');
        this.listeners.add(listener);
        return ()=>this.listeners.delete(listener);
    }
    notify(event){
        for(const listener of this.listeners){
            try{listener(event);}catch(error){queueMicrotask(()=>{throw error;});}
        }
    }
    getCacheKey(packId,assetId){const pack=this.registry.getPack(packId);return pack?`${packId}::${pack.manifest.version}::${assetId}`:null;}
    setProjectSnapshots(snapshots = []) {
        this.projectSnapshots = new Map();
        for (const snapshot of snapshots) {
            if (!snapshot || typeof snapshot.packId !== 'string' || typeof snapshot.assetId !== 'string') continue;
            verifySnapshotIntegrity(snapshot, `Project asset snapshot "${snapshot.packId}::${snapshot.assetId}"`);
            this.projectSnapshots.set(snapshot.packId + '::' + (snapshot.packVersion || 'latest') + '::' + snapshot.assetId, snapshot);
            this.projectSnapshots.set(snapshot.packId + '::latest::' + snapshot.assetId, snapshot);
        }
        this.clear();
    }
    load(packId,assetId,requiredVersion=null){
        const asset=this.registry.getAsset(packId,assetId);
        const pack=this.registry.getPack(packId);
        if(asset && pack && (!requiredVersion || pack.manifest.version === requiredVersion)){
            const key=this.getCacheKey(packId,assetId);
            if(this.cache.has(key)){const hit=this.cache.get(key);this.cache.delete(key);this.cache.set(key,hit);return hit;}
            const bytes=this.registry.getAssetFile(packId,assetId);
            if(!bytes)throw new Error('Asset file for "'+key+'" is unavailable.');
            const ext=asset.file.split('.').pop().toLowerCase();const mimeType=asset.mimeType||MIME[ext];
            if(!mimeType||!mimeType.startsWith('image/'))throw new Error('Asset "'+key+'" has an unsupported MIME type.');
            const blob=new Blob([bytes],{type:mimeType});
            const loaded={key,packId,packVersion:asset.packVersion,assetId,name:asset.name,mimeType,blob,url:URL.createObjectURL(blob),source:'pack'};
            this.cache.set(key,loaded);this.evictOverflow();return loaded;
        }
        const lookup=packId+'::'+(requiredVersion || 'latest')+'::'+assetId;
        const snapshot=this.projectSnapshots.get(lookup);
        if(!snapshot || (requiredVersion && snapshot.packVersion!==requiredVersion)) {
            throw new Error('Asset "'+packId+'::'+assetId+'" is missing or its Pack is disabled; no compatible project snapshot is available.');
        }
        const key='snapshot::'+packId+'::'+snapshot.packVersion+'::'+assetId;
        if(this.cache.has(key))return this.cache.get(key);
        const bytes = verifySnapshotIntegrity(snapshot, `Embedded asset snapshot "${packId}::${assetId}"`);
        const blob=new Blob([bytes],{type:snapshot.mimeType});
        const loaded={key,packId,packVersion:snapshot.packVersion,assetId,name:snapshot.name,mimeType:snapshot.mimeType,blob,url:URL.createObjectURL(blob),source:'project-snapshot'};
        this.cache.set(key,loaded);this.evictOverflow();return loaded;
    }
    evictOverflow(){while(this.cache.size>this.maxCacheEntries){const [key,item]=this.cache.entries().next().value;URL.revokeObjectURL(item.url);this.cache.delete(key);}}
    invalidatePack(packId){
        let invalidated=0;
        for(const [key,item] of this.cache){if(item.packId===packId){URL.revokeObjectURL(item.url);this.cache.delete(key);invalidated+=1;}}
        this.notify({type:'pack-invalidated',packId,invalidated});
        return invalidated;
    }
    clear(){
        const invalidated=this.cache.size;
        for(const item of this.cache.values())URL.revokeObjectURL(item.url);
        this.cache.clear();
        this.notify({type:'cleared',invalidated});
    }
}
