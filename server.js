import {createQuickminMiddleware} from "quickmin/mikrokat";

export async function onStart(ev) {
	ev.use(createQuickminMiddleware(ev.appData.quickminYaml));
}

export async function onFetch(ev) {
	let res=await this.appData.qm.handleRequest(ev.request);
	if (res)
		return res;

	if ()
}

export async function onAlarm(ev) {

}

export async function onConnect(ev) {
	ev.open()
}

