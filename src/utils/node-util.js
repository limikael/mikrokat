import * as resolve from 'resolve.exports';

export function safeResolveExports(...args) {
	try {
		return resolve.exports(...args);
	}

	catch (e) {
		if (e.message.startsWith("No known conditions"))
			return;

		if (e.message.startsWith("Missing"))
			return;

		throw e;
	}
}