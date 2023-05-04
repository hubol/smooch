import { create, assert, Struct } from "superstruct";
import { RethrownError } from "./rethrown-error";

export function validateOptions<T>(options: any, schema: Struct<T>) {
	try {
		const defaultedOptions = create(options, schema);
		assert(defaultedOptions, schema);
		return defaultedOptions;
	} catch (e) {
		const { key, value, type } = e;
		let error;
		if (value === undefined) {
			error = new RethrownError(`Option ${key} is required`, e);
		} else if (type === "never") {
			error = new RethrownError(`Option ${key} unknown`, e);
		} else {
			error = new RethrownError(
				`Option ${key} invalid value ${value}, expected ${type}`,
				e
			);
			error.value = value;
		}
		error.attribute = key;
		throw error;
	}
};