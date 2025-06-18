export function getServiceTypes(services) {
	let serviceTypes=[];

	for (let k in services) {
		let type=services[k].type;
		if (!serviceTypes.includes(type))
			serviceTypes.push(type);
	}

	return serviceTypes;
}
