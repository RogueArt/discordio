# About

These are the scrapers used to build the song library for Discordio.

# Setup

1. You will need NodeJS 12.x or higher to run this discord bot. You can install
   NodeJS from [here](https://nodejs.org/en/download/).
2. After installing Node, navigate to this directory and run `npm install` to
   install all the needed dependencies.
3. You will need to include links to YouTube channels and Spotify artists in
   `channels.txt` that you want to build this library from.

# Configuration

To choose what channels and Spotify artists you want to scrape, simply add the link to each YouTube channel or Spotify artist separated by a newline.

`config.json` allows for 6 possible things to configuration:

**Both**:
1. `UPDATE_ON_START`

**Spotify:**
1. `client_id` - Necessary for connecting to the Spotify API and getting tracks from artists
2. `client_secret` - Necessary for connecting to the Spotify API and getting tracks from artists

**YouTube**
1. `MAX_CONCURRENCY` - Number of threads executing scraping for YouTube channels. If you have a processor with a lot of threads, this may be faster as increasing this will allow you to scrape multiple channels at a time.
2. `MAX_TIMEOUT` - How long the browser spends scraping the page. By default it's 300,000 milliseconds or 6 minutes. You should increase this if you are scraping a large channel using an old computer or have a slow internet connection and see it exiting before it's fully finished scraping.
3. `IS_HEADLESS` - A headless browser simply means that it's not visible when it performs its automated actions. By default, this is set to `true` so the scraper will run in the background. You can set this to `false` to see how it performs.

# Usage

You may run `npm run start` and build the library directly, without doing so
from the Discord bot.

An alternative is to use the `$update` command to activate the scrapers via the
bot. The code checks if you've added new channels or Spotify artists and will
not run if it is the same as what it was before.
