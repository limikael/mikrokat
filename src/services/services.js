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
	"sqlite": "SqliteService.js",
	"neon": "NeonService.js"
};