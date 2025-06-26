import ConditionalImports from "../../src/utils/ConditionalImports.js";
import path from "node:path";
import {fileURLToPath} from 'url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("ConditionalImports",()=>{
	it("can load imports",async ()=>{
		let conditionalImports=new ConditionalImports({
			cwd: __dirname,
			truth: {target: "node"},
			imports: [
				{import: "A", from: "./ImportA.js"},
				{import: ["test"], from: "./ImportA.js"},
				{import: {test: "testAlias"}, from: "./ImportA.js"},
				{import: {test: "testAlias1"}, from: "./ImportA.js", if: {target: "node"}},
				{import: {test: "testAlias2"}, from: "./ImportA.js", if: {target: "somethingelse"}}
			]
		});

		let imports=await conditionalImports.loadImports();

		expect(imports.A()).toEqual("defaultworld");
		expect(imports.test()).toEqual("test");
		expect(imports.testAlias()).toEqual("test");
		expect(imports.testAlias1()).toEqual("test");
		expect(imports.testAlias2).toEqual(undefined);
	});

	it("can generate a stub",()=>{
		let conditionalImports=new ConditionalImports({
			cwd: __dirname,
			truth: {target: "node"},
			imports: [
				{import: "A", from: "./ImportA.js"},
				{import: ["test","test2"], from: "./ImportA.js"},
				{import: {test: "testAlias"}, from: "./ImportA.js"},
				{import: {test: "testAlias1"}, from: "./ImportA.js", if: {target: "node"}},
				{import: {test: "testAlias2"}, from: "./ImportA.js", if: {target: "somethingelse"}}
			]
		});

		let stub=conditionalImports.getImportStub();
		//console.log(stub);
		expect(stub.imports).toEqual(`import __A from "/home/micke/Repo/mikrokat/spec/utils/ImportA.js";
import {test as __test,test2 as __test2} from "/home/micke/Repo/mikrokat/spec/utils/ImportA.js";
import {test as __testAlias} from "/home/micke/Repo/mikrokat/spec/utils/ImportA.js";
import {test as __testAlias1} from "/home/micke/Repo/mikrokat/spec/utils/ImportA.js";
`);
		expect(stub.vars).toEqual(`const imports={A: __A, test: __test, test2: __test2, testAlias: __testAlias, testAlias1: __testAlias1};\n`);
	});
});