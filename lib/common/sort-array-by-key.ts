import { PropertiesOf } from "./properties-of";

const collator = new Intl.Collator(undefined, {
	numeric: true,
	sensitivity: 'base'
  });

export function sortArrayByKey<T>(array: T[], key: keyof PropertiesOf<T, string>) {
	// @ts-ignore
	return array.sort((a, b) => collator.compare(a[key], b[key]));
}