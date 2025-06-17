import CloudflareTarget from "./CloudflareTarget.js";
import FastlyTarget from "./FastlyTarget.js";
import VercelTarget from "./VercelTarget.js";

export default {
	"cloudflare": CloudflareTarget,
	"fastly": FastlyTarget,
	"vercel": VercelTarget,
	"netlify": null,
	"render": null,
};
