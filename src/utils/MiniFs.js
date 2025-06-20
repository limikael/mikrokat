export default class MiniFs {
	constructor(fileContent) {
		this.fileContent=fileContent;

		this.promises={
			readFile: async fn=>this.readFileSync(fn)
		}
	}

	readFileSync(fn) {
		if (!this.fileContent.hasOwnProperty(fn))
			throw new Error("File not found: "+fn);

		return this.fileContent[fn];
	}
}