import path from "node:path";

export default class ConditionalImports {
	constructor({cwd, imports, truth}) {
		this.cwd=cwd;
		this.imports=imports;
		this.truth=truth;

		if (!this.imports)
			this.imports=[];
	}

	matchIf(clause) {
		if (!clause)
			return true;

		for (let k in clause)
			if (clause[k]!=this.truth[k])
				return false;

		return true;
	}

	async loadImports() {
		let imported={};

		for (let imp of this.imports) {
			if (this.matchIf(imp.if)) {
				let mod;
				if (imp.from.startsWith("."))
					mod=await import(path.resolve(this.cwd,imp.from));

				else
					mod=await import(imp.from);

				if (typeof imp.import=="string") {
					imported[imp.import]=mod.default;
				}

				else if (Array.isArray(imp.import)) {
					for (let name of imp.import)
						imported[name]=mod[name];
				}

				else {
					for (let k in imp.import)
						imported[imp.import[k]]=mod[k];
				}
			}
		}

		return imported;
	}

	getImportStub() {
		let stub="";
		let prefix="__";
		let imports=[];

		for (let imp of this.imports) {
			if (this.matchIf(imp.if)) {
				let modPath;
				if (imp.from.startsWith("."))
					modPath=JSON.stringify(path.resolve(this.cwd,imp.from));

				else
					modPath=JSON.stringify(imp.from);

				if (typeof imp.import=="string") {
					stub+=`import ${prefix}${imp.import} from ${modPath};\n`;
					imports.push(imp.import);
				}

				else if (Array.isArray(imp.import)) {
					let stubImports=imp.import.map(i=>`${i} as ${prefix}${i}`).join(",");
					stub+=`import {${stubImports}} from ${modPath};\n`;
					imports.push(...imp.import);
				}

				else {
					let stubImports=Object.keys(imp.import).map(k=>`${k} as ${prefix}${imp.import[k]}`).join(",");
					stub+=`import {${stubImports}} from ${modPath};\n`;

					for (let k in imp.import)
						imports.push(imp.import[k]);
				}
			}
		}

		let vars="";

		vars+="const imports={";
		vars+=imports.map(i=>`${i}: ${prefix}${i}`).join(", ");
		vars+="};\n";

		return ({
			imports: stub,
			vars: vars
		});
	}
}