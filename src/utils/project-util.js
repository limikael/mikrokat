import * as TOML from '@ltd/j-toml';
import path from "node:path";
import fs, {promises as fsp} from "fs";

export async function processProjectFile({cwd, filename, format, processor}) {
	/*if (!fs.existsSync(cwd))
		await fsp.mkdir(cwd,{recursive: true});*/

	let filenameAbs=path.resolve(cwd,filename);

	let content;
	if (fs.existsSync(filenameAbs))
		content=await fsp.readFile(filenameAbs,"utf8");

	switch (format) {
		case "json": content=content?JSON.parse(content):content; break;
		case "lines": content=content?content.split("\n").filter(s=>!!s):[]; break;
		case "toml": content=TOML.parse(content?content:""); break;
		case null:
		case undefined:
			break;

		default: 
			throw new Error("Unknown config file format: "+format); 
			break;
	}

	if (processor) {
		let newContent=await processor(content);
		if (newContent!==undefined)
			content=newContent;
	}

	let textContent=content;
	switch (format) {
		case "json": textContent=JSON.stringify(textContent,null,2); break;
		case "lines": textContent=textContent.join("\n")+"\n"; break;
		case "toml":
			textContent=TOML.stringify(textContent,{
				newline: "\n",
				newlineAround: "section"
			});
			break;
	}

	await fsp.mkdir(path.dirname(filenameAbs),{recursive: true});
	await fsp.writeFile(filenameAbs,textContent);

	return content;
}
