import CloudflareTarget from "./CloudflareTarget.js";
import FastlyTarget from "./FastlyTarget.js";
import VercelTarget from "./VercelTarget.js";
import NetlifyTarget from "./NetlifyTarget.js";

export default {
	"cloudflare": CloudflareTarget,
	"fastly": FastlyTarget,
	"vercel": VercelTarget,
	"netlify": NetlifyTarget,
	//"render": null,
};
