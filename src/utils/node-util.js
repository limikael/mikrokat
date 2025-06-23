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
