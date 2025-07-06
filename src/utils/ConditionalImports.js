import path from "node:path";
import {clauseMatch} from "./clause.js";
import {pathToFileURL} from 'url';
import {resolveImport} from "./resolve-import.js";

export default class ConditionalImports {
	constructor({cwd, imports, truth}) {
		this.cwd=cwd;
		this.imports=imports;
		this.truth=truth;

		if (!this.imports)
			this.imports=[];
	}

	async loadImports() {
		let imported={};

		for (let imp of this.imports) {
			if (clauseMatch(imp.if,this.truth)) {
				let modPath=await resolveImport(imp.from, this.cwd);
				let mod=await import(modPath);

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

	async getImportStub() {
		let stub="";
		let prefix="__";
		let imports=[];

		for (let imp of this.imports) {
			if (clauseMatch(imp.if,this.truth)) {
				let modPath=await resolveImport(imp.from, this.cwd);
				let modPathQuoted=JSON.stringify(modPath);

				if (typeof imp.import=="string") {
					stub+=`import ${prefix}${imp.import} from ${modPathQuoted};\n`;
					imports.push(imp.import);
				}

				else if (Array.isArray(imp.import)) {
					let stubImports=imp.import.map(i=>`${i} as ${prefix}${i}`).join(",");
					stub+=`import {${stubImports}} from ${modPathQuoted};\n`;
					imports.push(...imp.import);
				}

				else {
					let stubImports=Object.keys(imp.import).map(k=>`${k} as ${prefix}${imp.import[k]}`).join(",");
					stub+=`import {${stubImports}} from ${modPathQuoted};\n`;

					for (let k in imp.import)
						imports.push(imp.import[k]);
				}
			}
		}

		let vars="";

		vars+="imports: {";
		vars+=imports.map(i=>`${i}: ${prefix}${i}`).join(", ");
		vars+="},\n";

		return ({
			imports: stub,
			vars: vars
		});
	}
}