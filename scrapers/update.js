const getAlbumsFromArtist = require('./spotify.js')
const getYouTubeVideos = require('./youtube.js')
const fs = require('fs')

const { UPDATE_ON_START } = require('./config.json')

// Separate the links from the text files into YouTube and Spotify links
function filterChannelList(channels) {
  const youtube = [], spotify = []
  for (const channel of channels) {
    if (channel.includes('youtube')) youtube.push(channel)
    else if (channel.includes('spotify')) spotify.push(channel)
  }
  return [youtube, spotify]
}

// Update the current song library
async function updateData() {
  // Create separate lists for YouTube links and Spotify artists
  const channels = fs.readFileSync('./channels.txt', 'utf-8').split('\r\n')
  const [youtube, spotify] = filterChannelList(channels)

  console.log('Checking for artist changes!')
  await getYouTubeVideos(youtube) // NOTE: This may take a while...
  await getAlbumsFromArtist(spotify)
  console.log('Songs have been updated!')
}

// Change UPDATE_ON_START to false to prevent updating each time
if (UPDATE_ON_START) updateData()