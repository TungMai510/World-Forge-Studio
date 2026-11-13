export function normalizeImageObject(object) {
    if (!object || typeof object !== 'object' || Array.isArray(object)) throw new Error('Image object must be an object.');
    const { assetRef } = object;
    if (!assetRef || typeof assetRef !== 'object' || Array.isArray(assetRef) ||
        typeof assetRef.packId !== 'string' || !assetRef.packId.trim() ||
        typeof assetRef.assetId !== 'string' || !assetRef.assetId.trim()) {
        throw new Error('Image object requires a valid Asset Pack and asset reference.');
    }
    const { x, y, width, height } = object;
    const rotation = object.rotation === undefined ? 0 : object.rotation;
    const opacity = object.opacity === undefined ? 1 : object.opacity;
    const fit = object.fit === undefined ? 'contain' : object.fit;
    if (![x, y, width, height, rotation, opacity].every(Number.isFinite) ||
        width <= 0 || height <= 0 || width > 8192 || height > 8192 ||
        Math.abs(rotation) > 36000 || opacity < 0 || opacity > 1) {
        throw new Error('Image object geometry, rotation or opacity is invalid.');
    }
    if (!['contain', 'cover', 'fill'].includes(fit)) throw new Error('Image object fit must be contain, cover or fill.');
    const normalizedRef = { packId: assetRef.packId.trim(), assetId: assetRef.assetId.trim() };
    if (assetRef.packVersion !== undefined) {
        if (typeof assetRef.packVersion !== 'string' || !assetRef.packVersion.trim()) {
            throw new Error('Image asset packVersion must be a non-empty string when provided.');
        }
        normalizedRef.packVersion = assetRef.packVersion.trim();
    }
    return { ...object, schemaVersion: 1, assetRef: normalizedRef, x, y, width, height,
        rotation: ((rotation % 360) + 360) % 360, opacity, fit };
}

export function getImageObjectCorners(object) {
    const centerX = object.x + object.width / 2, centerY = object.y + object.height / 2;
    const angle = (object.rotation || 0) * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
    return [[-object.width/2,-object.height/2],[object.width/2,-object.height/2],
        [object.width/2,object.height/2],[-object.width/2,object.height/2]].map(([dx,dy])=>({
        x:centerX+dx*cos-dy*sin,y:centerY+dx*sin+dy*cos
    }));
}
export function getImageObjectBounds(object) {
    const corners=getImageObjectCorners(object),xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);
    const minX=Math.min(...xs),minY=Math.min(...ys);
    return {x:minX,y:minY,width:Math.max(...xs)-minX,height:Math.max(...ys)-minY};
}
export function hitTestImageObject(object,point,tolerance=0) {
    const centerX=object.x+object.width/2,centerY=object.y+object.height/2;
    const angle=-(object.rotation||0)*Math.PI/180,dx=point.x-centerX,dy=point.y-centerY;
    const localX=dx*Math.cos(angle)-dy*Math.sin(angle),localY=dx*Math.sin(angle)+dy*Math.cos(angle);
    return Math.abs(localX)<=object.width/2+tolerance&&Math.abs(localY)<=object.height/2+tolerance;
}

export class ImageObjectRenderer {
    constructor({assetLoader=null,onInvalidate=()=>{},onError=()=>{},createImage=()=>new Image()}={}) {
        this.assetLoader=null;this.onInvalidate=onInvalidate;this.onError=onError;this.createImage=createImage;
        this.images=new Map();this.unsubscribeAssetLoader=null;
        if(assetLoader)this.setAssetLoader(assetLoader);
    }
    setAssetLoader(assetLoader) {
        if(!assetLoader||typeof assetLoader.load!=='function')throw new Error('ImageObjectRenderer requires a valid AssetLoader.');
        this.unsubscribeAssetLoader?.();this.unsubscribeAssetLoader=null;
        this.clear();this.assetLoader=assetLoader;
        if(typeof assetLoader.subscribe==='function'){
            this.unsubscribeAssetLoader=assetLoader.subscribe(event=>{
                if(event.type==='cleared')this.clear();
                else if(event.type==='pack-invalidated')this.invalidatePack(event.packId);
            });
        }
        this.onInvalidate();
    }
    invalidatePack(packId) {
        const prefix=`${packId}::`;
        for(const [key,entry] of this.images){
            if(!key.startsWith(prefix))continue;
            this.images.delete(key);
            if(entry.status==='loading')entry.rejectPending?.(new Error(`Image asset "${key}" was invalidated while loading.`));
            entry.status='invalidated';
        }
    }
    ensureImage(object) {
        if(!this.assetLoader)return Promise.reject(new Error('Image rendering requires an AssetLoader.'));
        const {packId,assetId}=object.assetRef;
        const key=`${packId}::${object.assetRef.packVersion||'latest'}::${assetId}`;
        const cached=this.images.get(key);if(cached)return cached.promise;
        const entry={status:'loading',image:null,promise:null,rejectPending:null};
        entry.promise=new Promise((resolve,reject)=>{
            let settled=false;
            entry.rejectPending=error=>{if(!settled){settled=true;reject(error);}};
            try{
                const loaded=this.assetLoader.load(packId,assetId,object.assetRef.packVersion || null);
                if(object.assetRef.packVersion&&loaded.packVersion!==object.assetRef.packVersion){
                    throw new Error(`Image asset "${packId}::${assetId}" requires Pack version "${object.assetRef.packVersion}", but "${loaded.packVersion||'unknown'}" is loaded.`);
                }
                const image=this.createImage();
                entry.image=image;
                image.onload=()=>{
                    if(settled)return;
                    if(this.images.get(key)!==entry){settled=true;reject(new Error(`Image asset "${key}" was invalidated while loading.`));return;}
                    settled=true;entry.status='ready';this.onInvalidate();resolve(image);
                };
                image.onerror=()=>{
                    if(settled)return;
                    settled=true;entry.status='error';
                    const error=new Error(`Unable to decode image asset "${packId}::${assetId}".`);
                    this.onError(error);this.onInvalidate();reject(error);
                };
                image.src=loaded.url;
                if(image.complete&&image.naturalWidth>0&&!settled){
                    settled=true;entry.status='ready';this.onInvalidate();resolve(image);
                }
            }catch(error){
                if(!settled){settled=true;entry.status='error';this.onError(error);reject(error);}
            }
        });
        entry.promise.catch(()=>{});this.images.set(key,entry);return entry.promise;
    }
    getImage(object) {
        if(!this.assetLoader)return null;
        const {packId,assetId}=object.assetRef,key=`${packId}::${object.assetRef.packVersion||'latest'}::${assetId}`;
        const cached=this.images.get(key);
        if(cached)return cached.status==='ready'?cached.image:null;
        this.ensureImage(object).catch(()=>{});return null;
    }
    async preload(objects) {
        await Promise.all(objects.filter(object=>object.type==='image').map(object=>this.ensureImage(object)));
    }
    draw(context,object) {
        const image=this.getImage(object);
        context.save();
        const centerX=object.x+object.width/2,centerY=object.y+object.height/2;
        context.translate(centerX,centerY);context.rotate((object.rotation||0)*Math.PI/180);
        context.globalAlpha*=object.opacity===undefined?1:object.opacity;
        const x=-object.width/2,y=-object.height/2;
        if(image){
            const sourceWidth=image.naturalWidth||image.width,sourceHeight=image.naturalHeight||image.height;
            if(object.fit==='fill'||!sourceWidth||!sourceHeight)context.drawImage(image,x,y,object.width,object.height);
            else{
                const scale=object.fit==='cover'?Math.max(object.width/sourceWidth,object.height/sourceHeight):
                    Math.min(object.width/sourceWidth,object.height/sourceHeight);
                const drawWidth=sourceWidth*scale,drawHeight=sourceHeight*scale;
                if(object.fit==='cover'){context.beginPath();context.rect(x,y,object.width,object.height);context.clip();}
                context.drawImage(image,-drawWidth/2,-drawHeight/2,drawWidth,drawHeight);
            }
        }else{
            context.fillStyle='rgba(120, 100, 70, 0.16)';context.strokeStyle='#9b8060';context.lineWidth=2;
            context.fillRect(x,y,object.width,object.height);context.strokeRect(x,y,object.width,object.height);
            context.beginPath();context.moveTo(x,y);context.lineTo(-x,-y);
            context.moveTo(x+object.width,y);context.lineTo(-x,-y);context.stroke();
        }
        context.restore();
    }
    clear() {
        for(const entry of this.images.values()){
            if(entry.status==='loading')entry.rejectPending?.(new Error('Image renderer cache was cleared while loading.'));
            entry.status='invalidated';
        }
        this.images.clear();
    }
    destroy(){this.unsubscribeAssetLoader?.();this.unsubscribeAssetLoader=null;this.clear();this.assetLoader=null;}
}
