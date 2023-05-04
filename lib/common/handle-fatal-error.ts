export function handleFatalError(error) {
    if (Array.isArray(error)) {
		error.forEach((err) => console.error(err.stack || err.message));
	} else {
		console.error("An error has occurred.");
		console.error(error.stack || error.message);
	}
	process.exit(1);
}