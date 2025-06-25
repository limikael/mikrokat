import path from "node:path";
import fs, {promises as fsp} from "node:fs";
import mime from 'mime/lite';
import {readPackageUp} from 'read-package-up';
import {DeclaredError} from "../utils/js-util.js";

export async function createStaticResponse({request, cwd}) {
    let url=new URL(request.url);
    let assetAbs=path.join(cwd,url.pathname);
    if (fs.existsSync(assetAbs) &&
            fs.statSync(assetAbs).isFile()) {

        let stat=fs.statSync(assetAbs);        

        let headers=new Headers();
        headers.set("content-type",mime.getType(assetAbs.slice(assetAbs.lastIndexOf(".")+1)));
        headers.set("content-length",stat.size);

        let body=createStreamBody(fs.createReadStream(assetAbs));

        return new Response(body,{headers});
    }
}

export function createStreamBody(stream) {
    const body = new ReadableStream({
        start(controller) {
            stream.on('data', (chunk) => {
                controller.enqueue(chunk)
            })
            stream.on('end', () => {
                controller.close()
            })
        },

        cancel() {
            stream.destroy()
        },
    })
    return body
}

export function serverListenPromise(server, port) {
    return new Promise((resolve, reject) => {
        const onError = (err) => {
            server.off('listening', onListening);
            reject(err);
        };

        const onListening = () => {
            server.off('error', onError);
            resolve();
        };

        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port);
    });
}

export function serverClosePromise(server) {
    return new Promise((resolve, reject) => {
        server.close((err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });

        // Immediately destroy all connections
        if (typeof server.closeAllConnections === 'function') {
            server.closeAllConnections();
        }
    });
}

export async function getPackageVersion(cwd) {
    let pkgInfo=await readPackageUp({cwd});
    return pkgInfo.packageJson.version;
}

export async function getEffectiveCwd(cwd, {allowUninitialized}={}) {
    let packageInfo=await readPackageUp({cwd: cwd});
    if (!packageInfo) {
        if (!allowUninitialized)
            throw new DeclaredError("No package.json found.");

        return cwd;
    }

    return path.dirname(packageInfo.path);
}