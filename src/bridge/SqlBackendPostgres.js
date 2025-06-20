import SqlBackend from "./SqlBackend.js";

export default class SqlBackendPostgres extends SqlBackend {
    constructor(client) {
        super();
        this.client = client;
    }

    async query(sql, params = []) {
        const result = await this.client.query(sql, params);

        return {
            results: result,
            changes: result.rowCount ?? 0,
            last_insert_id: null
        };
    }
}
