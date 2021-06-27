# About

Discordio is a music bot that will play songs for you 24/7 much like a radio. I built it with using NodeJS with Fmpeg and YTDL.

Discordio uses scrapers to build your song library ahead of time to maximize performance. These web scrapers were built with NodeJS using Puppeteer and the Spotify API.

# Usage

All bot commands must start with a '$' character to be recognized. You can change the prefix to any other string in `change_me.env`.

Current commands include:
- `$Play`: Begin playing music nonstop in the current channel
- `$Skip`: Skip current song
- `$Stop`: Stop playing music
- `$Move`: Move bot to your current voice channel
- `$Update`: Update the songs library (must add new artists first)

# Setup

## Required Steps

1. You will need NodeJS 12.x or higher to run this discord bot. You can install NodeJS from [here](https://nodejs.org/en/download/).
2. After installing Node, navigate to this directory and run `npm install` to install all the needed dependencies.
3. **Rename `change_me.env` to `.env`** after replacing `TOKEN=YOUR_TOKEN_HERE` with your Discord bot account's token. You may need to set up a Discord bot account which you may do so at the [Discord developer portal](https://discord.com/developers). Once again, make sure to rename it to `.env` otherwise it will not work.

## Optional

4. If you wish to build the song library yourself (e.g. use your own Spotify artists or YouTube channels), take a look at the parsers folder. There are separate scripts for Spotify and YouTube channels. **You will need a valid Spotify API key which you can get [here](https://developer.spotify.com/documentation/web-api/).** This is optional as data.json is pre-populated with YouTube song IDs.

Note: The YouTube parser takes roughly 1-2 minutes on a large channel (thousands of videos) with a fast CPU and good internet connection. The Spotify parser is usually quicker at around 10-20 seconds.

5. The prefix for commands is $ for default but you can change this in your `.env` file.

# To-do

- Discord: Add webhooks to allow for name and profile picture customization
- Discord: Set up permissions for who and who can't use the command
- Storage: Switch from raw JSON to Redis for better maintainability