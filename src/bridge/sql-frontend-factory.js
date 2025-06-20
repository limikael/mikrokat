import SqlFrontendD1 from "./SqlFrontendD1.js";

let sqlFrontentClasses={
	"d1": SqlFrontendD1
}

export function createSqlFrontend(exposeApi, backend) {
	if (!sqlFrontentClasses[exposeApi])
		throw new Error("unknown sql frontent: "+exposeApi);

	return new sqlFrontentClasses[exposeApi](backend);
}