export function getUsedServiceTypes(services) {
	let serviceTypes=[];

	for (let k in services) {
		let type=services[k].type;
		if (!serviceTypes.includes(type))
			serviceTypes.push(type);
	}

	return serviceTypes;
}

export const serviceImportFiles={
	"sqlite3": "Sqlite3Service.js",
	"neon": "NeonService.js",
	"better-sqlite3": "BetterSqlite3Service.js",
	"node-storage": "NodeStorageService.js"
};