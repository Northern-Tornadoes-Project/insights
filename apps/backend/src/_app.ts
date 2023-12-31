import * as dotenv from 'dotenv';
dotenv.config({ override: true });

import Scheduler from './scheduler';
import NTPServer from './server';
import { Post, Search } from 'database';
import {
	addTwitterPost,
	addTwitterSearchResult,
	disableSearch,
	getEnabledSearches,
	getNewDisabledSearches,
	getNewSearches,
	setRunStats,
} from './db';
import { logger } from './utils/logger';
import { twitter } from './lib/social/twitter';
import parseISO from 'date-fns/parseISO';
import { classifyPosts } from './lib/classification';

const UPDATE_FREQUENCY = 10000;

const scheduler = new Scheduler(UPDATE_FREQUENCY);
let searches: Search[] = [];

const eventMap: { [key: string]: () => Promise<void> } = {
	refresh: async () => {
		logger.debug('Refreshing searches');
		const newSearches = await getNewSearches(searches);
		const disabledSearches = await getNewDisabledSearches(searches);

		newSearches.forEach((search) => {
			addSearch(search, true);
			searches.push(search);
		});

		disabledSearches.forEach((search) => {
			try {
				scheduler.removeJob(search.id);
			} catch (err) {
				logger.error(err);
			}

			searches = searches.filter((s) => s.id !== search.id);
		});

		logger.debug('Finished refreshing searches');
	},
	add: async () => {
		logger.debug('Adding search');
		const newSearches = await getNewSearches(searches);

		newSearches.forEach((search) => {
			addSearch(search, true);
			searches.push(search);
		});

		logger.debug('Finished adding search');
	},
	remove: async () => {
		logger.debug('Removing search');
		const disabledSearches = await getNewDisabledSearches(searches);

		disabledSearches.forEach((search) => {
			try {
				scheduler.removeJob(search.id);
			} catch (err) {
				logger.error(err);
			}

			searches = searches.filter((s) => s.id !== search.id);
		});

		logger.debug('Finished removing search');
	},
};

const handleSearch = async (search: Search) => {
	const now = new Date().getTime();
	logger.debug(`Waiting for search ${search.id}`);

	if (search.twitter) {
		logger.debug(`Searching Twitter for ${search.id}`);
		const start = new Date().getTime();
		const tweets = await twitter.getTweets(search);
		const duration = new Date().getTime() - start;

		if (tweets.unusable) {
			return logger.error('Twitter API returned unusable data');
		}

		// Create new SearchResult
		const searchResult = await addTwitterSearchResult(search, {
			response: {
				data: tweets.tweets,
				includes: tweets.includes,
				meta: tweets.meta,
			},
			duration: duration,
			location: tweets.includes.places,
		});

		let classify_queue: Post[] = [];

		for (const tweet of tweets.tweets) {
			const images: string[] = [];
			const videos: string[] = [];

			// Get image URLs
			if (tweet.attachments?.media_keys) {
				for (const mediaKey of tweet.attachments.media_keys) {
					const media = tweets.includes.media.find(
						(m) => m.media_key === mediaKey
					);

					if (media) {
						if (media.type === 'photo') {
							images.push(media.url || 'unknown');
						} else if (media.type === 'video') {
							if (media.variants?.length) {
								videos.push(media.variants[0].url || 'unknown');
							} else {
								videos.push(media.url || 'unknown');
							}
						}
					}
				}
			}

			// Create new Tweet
			const result = await addTwitterPost(searchResult, {
				id: tweet.id,
				author_id: tweet.author_id || 'unknown',
				created_at: tweet.created_at
					? parseISO(tweet.created_at)
					: new Date(),
				likes: tweet.public_metrics?.like_count || 0,
				comments: tweet.public_metrics?.reply_count || 0,
				shares: tweet.public_metrics?.retweet_count || 0,
				content: tweet.text || 'unknown',
				images: images || [],
				videos: videos || [],
				raw: tweet,
			});

			classify_queue.push(result);

			// Once 96 posts have been added, classify them
			if (classify_queue.length >= 96) {
				logger.debug(`Classifying ${classify_queue.length} posts`);

				try {
					await classifyPosts(classify_queue);
				} catch (err) {
					logger.error(err);
				}

				classify_queue = [];
			}
		}

		if (classify_queue.length > 0) {
			try {
				await classifyPosts(classify_queue);
			} catch (err) {
				logger.error(err);
			}

			classify_queue = [];
		}

		logger.debug(`Finished searching Twitter for ${search.id}`);
	}

	const timeTaken = new Date().getTime() - now;

	// Calculate next run
	const nextRun =
		scheduler.getNextRun(search.id);

	logger.debug(nextRun);

	await setRunStats(search, timeTaken, nextRun);

	logger.debug(`Finished search ${search.id} in ${timeTaken}ms`);
};

const addSearch = (search: Search, immediate = false) => {
	scheduler.addJob(
		search.id,
		new Date(search.start_date),
		new Date(search.end_date),
		search.frequency,
		() => handleSearch(search),
		async () => {
			logger.debug(`Disabling search ${search.id}`);
			await disableSearch(search);
		},
		immediate
	);
};

(async () => {
	if (!process.env.COHERE_API_KEY) {
		logger.error('Missing COHERE_API_KEY');
		process.exit(1);
	}

	searches = await getEnabledSearches();

	searches.forEach((search) => {
		if (!process.env.TWITTER_BEARER_TOKEN) return;
		if (search.next_run && search.next_run > new Date()) {
			addSearch(search);
		} else {
			addSearch(search, true);
		}
	});
})();

NTPServer.getInstance().setEventMap(eventMap);

process.on('SIGINT', () => {
	logger.debug('Cleaning up...');
	scheduler.stop();
	NTPServer.getInstance().getWebServer().close();
	process.exit(0);
});
