/**
 * Platform metadata, descriptions, and visual identities.
 */

export const PLATFORMS_METADATA = {
  bluesky: {
    key: 'bluesky',
    name: 'Bluesky',
    tagline: 'Decentralized social network',
    protocol: 'AT Protocol (XRPC)',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    iconColor: '#0085FF',
    accentColor: 'from-sky-500/20 to-blue-600/5',
    description: 'Publishes rich-text micro-updates with byte-offset facets to the authenticated user AT Protocol repository.',
    urlFormat: 'https://bsky.app/profile/{handle}/post/{rkey}',
    authGated: false,
  },
  mastodon: {
    key: 'mastodon',
    name: 'Mastodon',
    tagline: 'Federated micro-blogging',
    protocol: 'REST API v1',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    iconColor: '#6364FF',
    accentColor: 'from-indigo-500/20 to-purple-600/5',
    description: 'Broadcasts public statuses to federated instances with OAuth 2.0 Bearer authorization.',
    urlFormat: 'https://{instance}/@{user}/{status_id}',
    authGated: false,
  },
  devto: {
    key: 'devto',
    name: 'Dev.to',
    tagline: 'Developer publishing community',
    protocol: 'Forem Articles API',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconColor: '#10B981',
    accentColor: 'from-emerald-500/20 to-teal-600/5',
    description: 'Publishes long-form announcements as published articles under a configured title with markdown body formatting.',
    urlFormat: 'https://dev.to/{username}/{article-slug}',
    authGated: false,
  },
  telegram: {
    key: 'telegram',
    name: 'Telegram',
    tagline: 'Broadcast channels & groups',
    protocol: 'Telegram Bot API',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    iconColor: '#26A5E4',
    accentColor: 'from-cyan-500/20 to-blue-600/5',
    description: 'Sends messages directly to public channels, groups, or chats using bot administrator credentials.',
    urlFormat: 'https://t.me/{channel_username}/{message_id}',
    authGated: false,
  },
  discord: {
    key: 'discord',
    name: 'Discord',
    tagline: 'Community servers & webhooks',
    protocol: 'Incoming Webhook (?wait=true)',
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    iconColor: '#5865F2',
    accentColor: 'from-violet-500/20 to-indigo-600/5',
    description: 'Executes incoming channel webhooks to distribute updates with snowflake IDs and jump links.',
    urlFormat: 'https://discord.com/channels/{guild_id}/{channel_id}/{message_id}',
    authGated: true,
  },
};

export const ORDERED_PLATFORMS = ['bluesky', 'mastodon', 'devto', 'telegram', 'discord'];
