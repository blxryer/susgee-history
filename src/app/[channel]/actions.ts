'use server';

import sevenTV from '@/lib/api/7tv';
import helix from '@/lib/api/helix';
import recentMessages from '@/lib/api/recentMessages';
import parser from '@/lib/parser';
import { Cosmetics, ParsedMessage } from '@/types/message';

export async function fetchChannelData(channel: string) {
	if (!channel || channel.length > 25 || !/^[a-zA-Z0-9_]{3,25}$/.test(channel)) {
		throw new Error('Invalid channel name');
	}

	const channelId = await helix.getUserId(channel);

	if (!channelId) {
		throw new Error('Channel not found');
	}

	const [messages, globalBadges, channelBadges, stvEmotes] = await Promise.all([
		recentMessages.get(channel),
		helix.getGlobalBadges(),
		helix.getChannelBadges(channelId),
		sevenTV.getEmotes(channelId)
	]);

	const cosmetics: Cosmetics = {
		twitch: {
			badges: new Map([
				...Array.from(globalBadges.entries()),
				...Array.from(channelBadges.entries())
			])
		},
		sevenTv: {
			emotes: stvEmotes
		}
	};

	return (
		messages
			?.map((msg: string) => parser.process(msg, cosmetics))
			?.filter((msg): msg is ParsedMessage => !!msg)
			.reverse() || []
	);
}
