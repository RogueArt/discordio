const fs = require('fs')
const path = require('path')
const { Cluster } = require('puppeteer-cluster')

const jsonPath = path.resolve(__dirname + '/../json/data.json')

// MAX_CONCURRENCY - Increase this if you want to take advantage of parallelism in building your library
// MAX_TIMEOUT - 6 minutes, but may need to increase this on a slow connection
// IS_HEADLESS - False -> browser becomes visible when it scrapes
const { MAX_CONCURRENCY, MAX_TIMEOUT, IS_HEADLESS } = require('./config.json')

const getVideosFromChannels = async links => {
  // Get list of channels already stored
  const channels = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  // Launch a new puppeteer cluster
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: MAX_CONCURRENCY,
    timeout: MAX_TIMEOUT,
    puppeteerOptions: {
      headless: IS_HEADLESS,
    },
  })
  // Task of getting list of youtube video IDs
  await cluster.task(getYouTubeVideos)

  let addedLink = false
  for (const link of links) {
    const channelID = link.substr(link.indexOf('.com') + 4)
    if (!channels.hasOwnProperty(channelID)) {
      addedLink = true
      // Scrape data from a site
      const data = await cluster.execute(
        `https://www.youtube.com/${channelID}/videos`
      )

      // Push it to list of songs + add channel with # of videos scraped
      channels.videos.push(...data)
      channels[channelID] = data.length
    }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(channels, null, 2))
  if (addedLink) console.log('Added songs from YouTube!')

  await cluster.idle()
  await cluster.close()
}

const getYouTubeVideos = async ({ page, data: url }) => {
  await page.goto(url)

  // Scrolling to the bottom of the page each time
  // This triggers a call to YouTube's API to render more content
  await page.evaluate(() => {
    // Helper function wait for a certain amount of time
    const wait = duration => {
      return new Promise(resolve => setTimeout(resolve, duration))
    }

    ;(async () => {
      window.atBottom = false
      const scroller = document.documentElement // usually what you want to scroll, but not always
      let lastPosition = -1
      while (!window.atBottom) {
        // scroller.scrollTop += 1000;
        scroller.scrollTop = scroller.scrollHeight
        // scrolling down all at once has pitfalls on some sites: scroller.scrollTop = scroller.scrollHeight;
        await wait(500)
        const currentPosition = scroller.scrollTop
        if (currentPosition > lastPosition) {
          lastPosition = currentPosition
        } else {
          window.atBottom = true
        }
      }
    })()
  })

  // Wait until we've hit the absolute bottom of the page -- check this every 1 second
  await page.waitForFunction('window.atBottom == true', {
    timeout: 900000,
    polling: 1000, // poll for finish every second
  })

  // Grab ALL video links on this page
  const links = await page.evaluate(() => {
    const videos = document.querySelectorAll('#video-title')

    // Create an array of all the links
    let links = []
    for (const video of videos) {
      const href = video.href
      links.push(href.substr(href.indexOf('?v=') + 3))
    }
    return links
  })
  return links
}

module.exports = getVideosFromChannels
