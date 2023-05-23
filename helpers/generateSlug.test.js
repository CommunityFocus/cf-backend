const { options, generateSlug } = require("./generateSlug");

describe('generateSlug', () => {
	describe('should generate a slug', () => {
		test('should be a non-empty string', () => {
			const slug = generateSlug();

			expect(typeof slug).toBe('string');
			expect(slug).not.toEqual('');
		});

		test('that contains 3 words', () => {
			const wordRegex = /[A-Za-z]+/g;
			const slug = generateSlug();
			const wordParts = slug.match(wordRegex);

			expect(wordParts?.length).toEqual(3);
		});

		test('that is kebab-case', () => {
			const wordRegex = /^[A-Za-z]+(-[A-Za-z]+){2,3}$/g;
			const slug = generateSlug();
			const slugIsKebab = wordRegex.test(slug);

			expect(slugIsKebab).toBe(true);
		});
	});

	describe('options should not contain', () => {
		test('appearances', () => {
			expect(options.categories.adjective).not.toContain('appearance');
		});
		test('color', () => {
			expect(options.categories.adjective).not.toContain('appearance');
		});
		test('family', () => {
			expect(options.categories.noun).not.toContain('family');
		});
		test('people', () => {
			expect(options.categories.noun).not.toContain('people');
		});
		test('profession', () => {
			expect(options.categories.noun).not.toContain('profession');
		});
		test('religion', () => {
			expect(options.categories.noun).not.toContain('religion');
		});
	});
});
