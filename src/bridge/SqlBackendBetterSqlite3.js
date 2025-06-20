import SqlBackend from "./SqlBackend.js";

export default class SqlBackendBetterSqlite3 extends SqlBackend {
    constructor(db) {
        super();
        this.db = db;
    }

    async query(sql, params = []) {
        const stmt = this.db.prepare(sql);

        if (stmt.reader) {
            const rows = stmt.all(...params);
            return {
                results: rows,
                changes: 0,
                last_insert_id: null
            };
        } else {
            const result = stmt.run(...params);
            return {
                results: [],
                changes: result.changes,
                last_insert_id: result.lastInsertRowid ?? null
            };
        }
    }

    batch(batchList) {
        const results = [];

        const tx = this.db.transaction((items) => {
            for (const { sql, params = [] } of items) {
                const stmt = this.db.prepare(sql);

                if (stmt.reader) {
                    const rows = stmt.all(...params);
                    results.push({
                        results: rows,
                        changes: 0,
                        last_insert_id: null
                    });
                } else {
                    const result = stmt.run(...params);
                    results.push({
                        results: [],
                        changes: result.changes,
                        last_insert_id: result.lastInsertRowid ?? null
                    });
                }
            }
        });

        tx(batchList);
        return results;
    }
}