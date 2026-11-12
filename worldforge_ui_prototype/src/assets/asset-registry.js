function assetKey(packId,assetId){return `${packId}::${assetId}`;}
export class AssetRegistry {
    constructor(){this.packs=new Map();this.assets=new Map();}
    registerPack(pack){
        if(!pack||!pack.manifest||!(pack.files instanceof Map))throw new Error('Cannot register an invalid Asset Pack.');
        const {id,version,assets}=pack.manifest;
        if(this.packs.has(id))throw new Error(`Asset Pack "${id}" is already registered.`);
        const registered={...pack,enabled:pack.enabled!==false};
        this.packs.set(id,registered);
        for(const asset of assets){
            const key=assetKey(id,asset.id);
            this.assets.set(key,{...asset,key,packId:id,packVersion:version,packName:pack.manifest.name,enabled:registered.enabled});
        }
        return registered;
    }
    unregisterPack(packId){
        const pack=this.packs.get(packId);if(!pack)return false;
        this.packs.delete(packId);
        for(const asset of pack.manifest.assets)this.assets.delete(assetKey(packId,asset.id));
        return true;
    }
    setPackEnabled(packId,enabled){
        const pack=this.packs.get(packId);if(!pack)throw new Error(`Asset Pack "${packId}" is not registered.`);
        pack.enabled=Boolean(enabled);
        for(const asset of pack.manifest.assets){const entry=this.assets.get(assetKey(packId,asset.id));if(entry)entry.enabled=pack.enabled;}
        return pack.enabled;
    }
    getPack(packId){return this.packs.get(packId)||null;}
    getAsset(packId,assetId,{includeDisabled=false}={}){
        const asset=this.assets.get(assetKey(packId,assetId));return asset&&(includeDisabled||asset.enabled)?asset:null;
    }
    getAssetFile(packId,assetId){
        const asset=this.getAsset(packId,assetId,{includeDisabled:true});const pack=this.getPack(packId);
        return asset&&pack?pack.files.get(asset.file)||null:null;
    }
    listPacks(){return [...this.packs.values()].map(pack=>({id:pack.manifest.id,name:pack.manifest.name,version:pack.manifest.version,author:pack.manifest.author,assetCount:pack.manifest.assets.length,enabled:pack.enabled}));}
    listAssets({packId=null,category=null,query='',tags=[]}={}){
        const q=query.trim().toLocaleLowerCase();const required=tags.map(tag=>tag.toLocaleLowerCase());
        return [...this.assets.values()].filter(asset=>{
            if(!asset.enabled||(packId&&asset.packId!==packId)||(category&&asset.category!==category))return false;
            const text=[asset.name,asset.id,asset.packName,...(asset.tags||[])].join(' ').toLocaleLowerCase();
            if(q&&!text.includes(q))return false;
            const own=(asset.tags||[]).map(tag=>tag.toLocaleLowerCase());return required.every(tag=>own.includes(tag));
        });
    }
}
export {assetKey};
