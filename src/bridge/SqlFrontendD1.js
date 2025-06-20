export default class SqlFrontendD1 {
    constructor(backend) {
        this.backend = backend;
    }

    prepare(sql) {
        const backend = this.backend;

        function makeBoundMethods(params = []) {
            return {
                run: async () => {
                    const res = await backend.query(sql, params);
                    return {
                        success: true,
                        results: res.results ?? [],
                        changes: res.changes ?? 0,
                        last_insert_id: res.last_insert_id ?? null
                    };
                },
                all: async () => {
                    const res = await backend.query(sql, params);
                    return {
                        success: true,
                        results: res.results ?? [],
                        changes: res.changes ?? 0,
                        last_insert_id: res.last_insert_id ?? null
                    };
                },
                first: async () => {
                    const res = await backend.query(sql, params);
                    return res.results?.[0] ?? null;
                },
                raw: async () => {
                    const res = await backend.query(sql, params);
                    if (!res.results?.length) {
                        return { results: [], columns: [] };
                    }

                    const columns = Object.keys(res.results[0]);
                    const results = res.results.map(row =>
                        columns.map(col => row[col])
                    );

                    return { results, columns };
                }
            };
        }

        const api = makeBoundMethods(); // default: no bind
        api.bind = (...params) => makeBoundMethods(params);

        return api;
    }

    async run(sql, ...params) {
        return this.prepare(sql).bind(...params).run();
    }

    async all(sql, ...params) {
        return this.prepare(sql).bind(...params).all();
    }

    async first(sql, ...params) {
        return this.prepare(sql).bind(...params).first();
    }

    async raw(sql, ...params) {
        return this.prepare(sql).bind(...params).raw();
    }
}
