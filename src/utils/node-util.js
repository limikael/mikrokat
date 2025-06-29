import path from "node:path";
import fs, {promises as fsp} from "node:fs";
import mime from 'mime/lite';
import {readPackageUp} from 'read-package-up';
import { spawn } from 'node:child_process';
import {DeclaredError, objectifyArgs, ResolvablePromise} from "../utils/js-util.js";
import findNodeModules from "find-node-modules";

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

export function findNodeBin(...args) {
    let {cwd, name, includeProcessCwd}=objectifyArgs(args,["cwd","name","includeProcessCwd"]);

    if (includeProcessCwd===undefined)
        includeProcessCwd=true;

    let dirs=findNodeModules({cwd: cwd, relative: false});
    if (includeProcessCwd)
        dirs=[...dirs,...findNodeModules({cwd: process.cwd(), relative: false})];

    for (let dir of dirs) {
        let fn=path.join(dir,".bin",name);
        if (fs.existsSync(fn))
            return fn;
    }

    throw new Error("Can't find binary: "+name);
}

class CommandJob {
    constructor() {
        this.stdoutBuffer=""
        this.stderrBuffer="";
        this.exitPromise=new ResolvablePromise();
    }

    async wait() {
        return await this.exitPromise;
    }

    async stop() {
        this.child.kill();
        return await this.exitPromise;
    }
}

export function startCommand(cmd, args, options = {}) {
    let commandJob=new CommandJob();

    if (options.nodeCwd)
        cmd=findNodeBin({cwd: options.nodeCwd, name: cmd});

    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
            stdio: ['inherit', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '1' },
            ...options
        });

        commandJob.child=child;

        let buffer = '';

        child.stdout.on('data', (data) => {
            process.stdout.write(data);   // show live in terminal
            commandJob.stdoutBuffer += data.toString();
            if (options.waitForOutput && commandJob.stdoutBuffer.includes(options.waitForOutput)) {
                resolve(commandJob);
            }
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(data); // show errors live in terminal
            commandJob.stderrBuffer += data.toString();
            if (options.waitForOutput && commandJob.stderrBuffer.includes(options.waitForOutput)) {
                resolve(commandJob);
            }
        });

        child.on('exit', (code) => {
            if (options.hasOwnProperty("expect") &&
                    code!=options.expect)
                commandJob.exitPromise.reject(new Error("Expected return code "+options.expect+", but got "+code));

            else
                commandJob.exitPromise.resolve(code);

            resolve(commandJob);
        });

        child.on('error', (err) => {
            commandJob.exitPromise.reject(err);
            resolve(commandJob);
        });
    });
}
