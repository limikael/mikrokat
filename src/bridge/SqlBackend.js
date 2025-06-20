export default class SqlBackend {
    async query(sql, params = []) {
        throw new Error("query(sql, params) must be implemented by subclass");
    }

    async batch(batchList) {
        const results = [];
        for (const { sql, params = [] } of batchList) {
            results.push(await this.query(sql, params));
        }
        return results;
    }
}