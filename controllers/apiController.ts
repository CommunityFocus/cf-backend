import { Response } from "express";
import NodeCache from "node-cache";
import axios from "axios";
import { generateSlug } from "../helpers/generateSlug";
import {
	ExpressRouteReturnType,
	RequestWithTimerStore,
} from "../common/types/express/types";

interface Contributor {
	login: string;
	avatar_url: string;
	html_url: string;
	contributions: number;
}

const contributorsCache = new NodeCache({
	stdTTL: 60 * 60 * 24, // 1 day
	checkperiod: 60 * 60 * 12, // 12 hours
});

// eslint-disable-next-line import/prefer-default-export
export const slugHandler = (
	req: RequestWithTimerStore,
	res: Response
): ExpressRouteReturnType => {
	if (!req.timerStore) {
		return res.status(500).json({
			message: "Timer Store was not found in request.",
		});
	}

	let slug = generateSlug();
	const existingStores = Object.keys(req.timerStore);
	let retryAttempts = 0;

	/* 
	Attempt to re-generate a room name that isn't taken . Cutoff after 50
	attempts in worst case scenario.
	*/
	while (existingStores.includes(slug)) {
		if (retryAttempts >= 50) {
			return res.status(429).json({
				message: "Issue generating slug, no available slugs found.",
			});
		}

		slug = generateSlug();
		retryAttempts++;
	}

	return res.json({
		slug,
	});
};

export const contributorsHandler = (
	req: RequestWithTimerStore,
	res: Response
): ExpressRouteReturnType => {
	console.log("Contributors route hit.");
	const repoLinks = [
		"https://api.github.com/repos/communityfocus/communityfocus/contributors",
		"https://api.github.com/repos/communityfocus/cf-backend/contributors",
		"https://api.github.com/repos/communityfocus/cf-frontend/contributors",
	];

	if (!contributorsCache.get("contributors")) {
		axios
			.all(
				repoLinks.map((link) => {
					console.log("Fetching contributors from: ", link);
					return axios.get(link);
				})
			)
			.then(
				axios.spread((...responses) => {
					const contributors = responses.map((response) =>
						response.data.map((contributor: Contributor) => {
							return {
								login: contributor.login,
								avatar_url: contributor.avatar_url,
								url: contributor.html_url,
								contributions: contributor.contributions,
							};
						})
					);

					const removeUsers = [
						"dependabot-preview[bot]",
						"dependabot[bot]",
					];

					const flattenedContributors = contributors.flat();
					// Remove duplicate contributors, but add their contributions together
					const uniqueContributors = flattenedContributors.reduce(
						(acc: Contributor[], current: Contributor) => {
							const x = acc.find(
								(item: Contributor) =>
									item.login === current.login
							);
							if (x) {
								x.contributions += current.contributions;
								return acc;
							}
							return acc.concat([current]);
						},
						[]
					);

					// Remove dependabot users
					uniqueContributors.forEach(
						(contributor: Contributor, index: number) => {
							if (removeUsers.includes(contributor.login)) {
								uniqueContributors.splice(index, 1);
							}
						}
					);

					contributorsCache.set("contributors", uniqueContributors);
				})
			)
			.then(() => {
				return res.json({
					contributors: contributorsCache.get("contributors"),
				});
			})
			.catch((err) => {
				console.log(err);
				return res.status(500).json({
					message: "Error fetching contributors.",
					api_error: err.response.statusText,
				});
			});
	} else {
		return res.json({
			contributors: contributorsCache.get("contributors"),
		});
	}
};
