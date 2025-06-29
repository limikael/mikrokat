export default class BaseTarget {
	constructor({project}) {
		if (!project)
			throw new Error("no project");

		this.project=project;
	}
}