const MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
export class AssetLoader {
    constructor(registry,{maxCacheEntries=200}={}){
        if(!registry||typeof registry.getAssetFile!=='function')throw new Error('AssetLoader requires an AssetRegistry.');
        this.registry=registry;this.maxCacheEntries=Math.max(1,maxCacheEntries);this.cache=new Map();
    }
    getCacheKey(packId,assetId){const pack=this.registry.getPack(packId);return pack?`${packId}::${pack.manifest.version}::${assetId}`:null;}
    load(packId,assetId){
        const asset=this.registry.getAsset(packId,assetId);
        if(!asset)throw new Error(`Asset "${packId}::${assetId}" is missing or its Pack is disabled.`);
        const key=this.getCacheKey(packId,assetId);
        if(this.cache.has(key)){const hit=this.cache.get(key);this.cache.delete(key);this.cache.set(key,hit);return hit;}
        const bytes=this.registry.getAssetFile(packId,assetId);
        if(!bytes)throw new Error(`Asset file for "${key}" is unavailable.`);
        const ext=asset.file.split('.').pop().toLowerCase();const mimeType=asset.mimeType||MIME[ext];
        if(!mimeType||!mimeType.startsWith('image/'))throw new Error(`Asset "${key}" has an unsupported MIME type.`);
        const blob=new Blob([bytes],{type:mimeType});
        const loaded={key,packId,packVersion:asset.packVersion,assetId,name:asset.name,mimeType,blob,url:URL.createObjectURL(blob)};
        this.cache.set(key,loaded);this.evictOverflow();return loaded;
    }
    evictOverflow(){while(this.cache.size>this.maxCacheEntries){const [key,item]=this.cache.entries().next().value;URL.revokeObjectURL(item.url);this.cache.delete(key);}}
    invalidatePack(packId){for(const [key,item] of this.cache){if(item.packId===packId){URL.revokeObjectURL(item.url);this.cache.delete(key);}}}
    clear(){for(const item of this.cache.values())URL.revokeObjectURL(item.url);this.cache.clear();}
}
