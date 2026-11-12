import {readZipArchive} from '../services/archive-service.js';
import {AssetRegistry} from './asset-registry.js';
import {ASSET_PACK_LIMITS,MAX_MANIFEST_BYTES,validateAssetPackManifest} from './asset-pack-validator.js';
const DECODER=new TextDecoder('utf-8',{fatal:true});
export class AssetPackService {
    constructor({registry=new AssetRegistry(),loader=null,worldForgeVersion='1.0.0'}={}){this.registry=registry;this.loader=loader;this.worldForgeVersion=worldForgeVersion;}
    inspectPack(input){
        const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
        if(!bytes.length||bytes.byteLength>ASSET_PACK_LIMITS.packBytes)throw new Error('Asset Pack is empty or exceeds the 100 MB limit.');
        const files=readZipArchive(bytes,{maxEntries:ASSET_PACK_LIMITS.entries,maxUncompressedSize:ASSET_PACK_LIMITS.packBytes});
        const manifestBytes=files.get('pack.json');
        if(!manifestBytes||manifestBytes.byteLength>MAX_MANIFEST_BYTES)throw new Error('Asset Pack is missing pack.json or its manifest exceeds 1 MB.');
        let parsed;
        try{parsed=JSON.parse(DECODER.decode(manifestBytes));}catch(error){throw new Error(`Asset Pack manifest is not valid UTF-8 JSON: ${error.message}`);}
        const manifest=validateAssetPackManifest(parsed,{worldForgeVersion:this.worldForgeVersion,files});
        if(this.registry.getPack(manifest.id))throw new Error(`Asset Pack "${manifest.id}" is already installed. Remove it before importing a replacement.`);
        return {manifest,files,inspectedAt:new Date().toISOString()};
    }
    installPack(input){const inspected=this.inspectPack(input);return this.registry.registerPack({...inspected,enabled:true,source:'import'});}
    uninstallPack(packId){
        if(!this.registry.getPack(packId))return false;
        this.loader?.invalidatePack(packId);
        return this.registry.unregisterPack(packId);
    }
    setPackEnabled(packId,enabled){
        const result=this.registry.setPackEnabled(packId,enabled);
        if(!result)this.loader?.invalidatePack(packId);
        return result;
    }
}
