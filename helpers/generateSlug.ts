import { RandomWordOptions, generateSlug } from "random-word-slugs";

const options: RandomWordOptions<3> = {
	format: "kebab",
	categories: {
		adjective: [
			"condition",
			"personality",
			"quantity",
			"shapes",
			"size",
			"sounds",
			"taste",
			"time",
			"touch",
		],
		noun: [
			"animals",
			"business",
			"education",
			"food",
			"health",
			"media",
			"place",
			"science",
			"sports",
			"technology",
			"thing",
			"time",
			"transportation",
		],
	},
};

function generateCustomSlug() {
	return generateSlug(3, options);
}

export {
	options,
	generateCustomSlug as generateSlug,
}
