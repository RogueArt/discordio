// TO-DO: Refactor this code so that this is actually human readable lol

const fs = require('fs')
const path = require('path')

// Needed for making and parsing data from HTTP requests
const axios = require('axios')
const HTMLParser = require('fast-html-parser')

// Local config as well as storage
const jsonPath = path.resolve(__dirname + '/../json/data.json')
const { client_id, client_secret } = require('./config.json')

let currentArtist = ''

const convertTracksToYT = res => {
  const { data } = res
  const startingIndex = data.indexOf('?v=') + 3
  return data.substring(startingIndex, startingIndex + 11)
}

const getTrackInfoFromAlbum = async res => {
  const data = HTMLParser.parse(res.data)
  const tracks = data.querySelectorAll('.track-name')

  let ytLinks = []
  for (const track of tracks) {
    const trackName = track.childNodes[0].rawText.replace(/\s+/g, '+')
    ytLinks.push(
      await axios
        .request(
          `https://www.youtube.com/results?search_query=${trackName}+${currentArtist}`
        )
        .then(convertTracksToYT)
        .catch(err => console.log(err))
    )
  }
  return Promise.all(ytLinks)
}

// return ytLinks
const getAlbumsFromArtist = async res => {
  const data = res.data.items
  currentArtist = data[0].artists[0].name
  let albums = []
  for (const album of data) {
    albums.push(album.external_urls.spotify)
  }
  albums = Promise.all(
    albums.map(album => axios.get(album).then(getTrackInfoFromAlbum))
  )
  return albums
}

const getArtistID = id => {
  return id.substr(id.lastIndexOf('/') + 1)
}

const getToken = () => {
  return axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization:
        'Basic ' +
        new Buffer.from(client_id + ':' + client_secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    params: {
      grant_type: 'client_credentials',
    },
    json: true,
  })
    .then(body => body)
    .catch(e => {
      console.log(e.response.data)
    })
}

// Get tracks for each artist as a unique YouTube video ID
const getArtistsTracks = async artistLinks => {
  const storedArtists = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const apikey = (await getToken()).data.access_token
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apikey}`,
    },
  }
  artistLinks = artistLinks.map(getArtistID)

  for (const artist of artistLinks) {
    if (!storedArtists.hasOwnProperty(artist)) {
      const data = (
        await axios
          .get(
            `https://api.spotify.com/v1/artists/${artist}/albums?limit=30`,
            config
          )
          .then(getAlbumsFromArtist)
      ).flat()
      storedArtists.videos.push(...data)
      storedArtists[artist] = data.length
    }
  }

  // Write the data to data.json
  return fs.writeFileSync(jsonPath, JSON.stringify(storedArtists, null, 2))
}

module.exports = getArtistsTracks
