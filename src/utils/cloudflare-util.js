export function guessCloudflareServiceType(service) {
    if (typeof service === "string") {
        // Likely a secret or plaintext environment variable
        return "string";
    }

    if (service && typeof service.get === "function" && typeof service.put === "function") {
        // KV bindings expose .get and .put
        return "kv";
    }

    if (service && typeof service.get === "function" && typeof service.list === "function" && typeof service.delete === "function") {
        // R2 bindings expose .get, .list, .delete
        return "r2";
    }

    if (service && typeof service.prepare === "function") {
        // D1 databases expose .prepare
        return "d1";
    }

    if (service && typeof service.send === "function") {
        // Queues expose .send
        return "queue";
    }

    if (service && typeof service.idFromName === "function" && typeof service.get === "function") {
        // Durable Object Namespace exposes .idFromName and .get
        return "durable_object_namespace";
    }

    if (service && typeof service.fetch === "function") {
        // Service bindings or HTTP fetchers
        return "service";
    }

    return "unknown";
}