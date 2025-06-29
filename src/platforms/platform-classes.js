import CloudflarePlatform from "./CloudflarePlatform.js";
import FastlyPlatform from "./FastlyPlatform.js";
import VercelPlatform from "./VercelPlatform.js";
import NetlifyPlatform from "./NetlifyPlatform.js";

export default {
	"cloudflare": CloudflarePlatform,
	"fastly": FastlyPlatform,
	"vercel": VercelPlatform,
	"netlify": NetlifyPlatform,
	//"render": null,
};
