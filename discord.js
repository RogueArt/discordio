require('dotenv').config()
const { PREFIX, TOKEN } = process.env
// const { prefix, token } = require("./json/config.json")

const fs = require('fs')
const ytdl = require("ytdl-core-discord");
const Discord = require("discord.js");

let videos = require("./json/data.json").videos
const client = new Discord.Client();
const ids = require('./json/ids.json')

const queue = {}
const DEF_NUM_SONGS = 10

client.on("ready", () => {
  rejoin()
  console.log('Music bot started!')
});

// Match commands with function calls here
client.on("message", async msg => {
  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return
  const serverQueue = queue[msg.guild.id];
  const cmd = msg.content.slice(PREFIX.length).split(/ +/)[0]

  switch (cmd) {
    case 'play': execute(msg, serverQueue); break
    case 'skip': skip(msg, serverQueue); break
    case 'stop': stop(msg, serverQueue); break
    case 'move': move(msg, serverQueue); break
    case 'update': update(msg, serverQueue); break
    case 'help': help(msg); break
  }
})

/*<======================REJOIN======================>*/
// Rejoin bot to servers it was last playing on
async function rejoin() {
	const channels = client.channels.cache;

	for (const [voiceChannelID, textChannelID] of Object.entries(
		ids
	)) {
		const lastVC = channels.get(voiceChannelID);
		const lastTC = channels.get(textChannelID);

		lastVC
			.join()
			.then(async connection => {
				const queueConstruct = {
					textChannel: lastTC,
					voiceChannel: channels.get(voiceChannelID),
					connection,
					songs: [],
					volume: 5,
					playing: true
				};

				queue[lastTC.guild.id] = queueConstruct;
				queueConstruct.songs = await getSongs(DEF_NUM_SONGS);

				try {
					// Attempt to join & play songs
					var connection = await lastVC.join();
					queueConstruct.connection = connection;
					play(lastTC.guild);
				} catch (err) {
					// Leave in case there's an error
					console.log(err);
					delete queue[lastTC.guild.id];
					return lastTC.send(err);
				}
			})
			.catch(e => {
				console.error(e);
			});
	}
}

/*<======================PLAY======================>*/
// Play and queue up songs
async function play(guild) {
  const serverQueue = queue[guild.id]
  const song = serverQueue.songs[0]

  // Play a song using the Opus library, once done
  // Pop a song from the queue, push one to the back
  const dispatcher = serverQueue.connection
    .play(await ytdl(song.url), { type: 'opus' })
    .on("finish", async () => {
      serverQueue.songs.push(await getSongs(1))
      serverQueue.songs.shift();
      play(guild);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

  if (song.title == undefined) throw `Song title is undefined!`
  serverQueue.textChannel.send(`Playing: **${song.title}**`);
}

/*<======================SKIP======================>*/
// Skip a song
function skip(msg, serverQueue) {
  if (!msg.member.voice.channel)
    return msg.channel.send(
      "You have to be in a voice channel to skip the song!"
    );
  if (!serverQueue) return msg.channel.send("Can't skip if the bot isn't playing!");
  if (serverQueue.connection.dispatcher == undefined) return
  if (serverQueue.songs[0] == undefined) return
  
  serverQueue.connection.dispatcher.end()
}

/*<======================STOP======================>*/
// Stop song playback
function stop(msg, serverQueue) {
  if (!msg.member.voice.channel)
    return msg.channel.send(
      'You have to be in a voice channel to stop the music!'
    )

  if (!serverQueue)
    return msg.channel.send('There is no song that I could stop!')

  serverQueue.textChannel.send(`Stopping playback.`)
  serverQueue.voiceChannel.leave()

  // Delete song queue/member data associated with voice channel
  delete queue[msg.guild.id]
  delete ids[msg.member.voice.channel.id]
  updateIDs()
}

/*<======================EXECUTE======================>*/
async function execute(msg, serverQueue) {
  // Check if bot has permissions + voice channel is valid
  const voiceChannel = msg.member.voice.channel;
  if (!voiceChannelValid(voiceChannel, msg)) return
  if (!hasPermissions(voiceChannel, msg)) return

  // If server queue hasn't been defined yet, create one
  if (!serverQueue) {
    const queueConstruct = {
      textChannel: msg.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    }

    // Set the specific voice channel
    msg.channel.send('Loading the latest songs.')

    queue[msg.guild.id] = queueConstruct;
    ids[voiceChannel.id] = msg.channel.id
    updateIDs()
    
    queueConstruct.songs = await getSongs(DEF_NUM_SONGS)
    
    try { // Attempt to join & play songs
      var connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      play(msg.guild);
    } catch (err) { // Leave in case there's an error
      console.log(err);
      delete queue[msg.guild.id]
      delete ids[voiceChannel.id]
      updateIDs()
      return msg.channel.send(err);
    }
  }
  else {
    return msg.channel.send(`Already playing songs!`);
  }
}

/*<======================MOVE======================>*/
// Move bot to a different channel
async function move(msg, serverQueue) {
  if (!msg.member.voice.channel)
  return msg.channel.send(
    "You have to be in a voice channel to move the bot!"
  );

  if (serverQueue === undefined)
  return msg.channel.send(
    "Bot must already be playing to be able to move it!"
  );
  delete ids[serverQueue.voiceChannel.id]
  const voiceChannel = msg.member.voice.channel
  const connection = await voiceChannel.join();
  serverQueue.connection = connection
  serverQueue.voiceChannel = voiceChannel
  ids[serverQueue.voiceChannel.id] = msg.channel.id
  updateIDs()
}

/*<======================UPDATE======================>*/
// Update current list of songs
async function update(msg, serverQueue) {
  videos = JSON.parse(fs.readFileSync('./json/data.json', 'utf-8')).videos
  if (msg !== undefined) msg.channel.send('Songs have been updated.')
  if (serverQueue !== undefined) serverQueue.songs = await getSongs(DEF_NUM_SONGS)
}

/*<======================HELP======================>*/
const helpEmbed = {
  "title": "Help",
  "description": "**$Play** - Start playing music nonstop in the current channel\n**$Skip** - Skip current song\n**$Stop** - Stop playing music\n\n**$Move** - Move bot to your voice channel\n**$Update** - Update songs list (must add artists first)",
  "color": 16524075
}

async function help(msg) {
  msg.channel.send({ embed: helpEmbed })
}

/*<======================UTILS======================>*/
// Check if player sent command from voice channel
function voiceChannelValid(vc, msg) {
  if (!vc) {
    msg.channel.send("You need to be in a voice channel to play music!")
    return false
  }
  return true
}

// Check for connect & speak permissions for the bot
function hasPermissions(voiceChannel, msg) {
  const permissions = voiceChannel.permissionsFor(msg.client.user)
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    msg.channel.send("I need the permissions to join and speak in your voice channel!")
    return false
  }
  return true
}

// Update stored list of voice channel IDs & text channel IDs
async function updateIDs() {
  fs.writeFile('./json/ids.json', JSON.stringify(ids, null, 2), () => null)
}

// Get songs from youtube
async function getSongs(nums) {
  const len = videos.length
  // For one song, return an object
  if (nums === 1) {
    const randomVideo = videos[~~(Math.random()*len)]
    const songInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${randomVideo}`)
    return {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    }
  }
  
  // For multiple songs, return array of objects
  let songs = []
  for (let x = 0; x < nums; x++) {
    const randomVideo = videos[~~(Math.random()*len)]
    const songInfo = ytdl.getInfo(`https://www.youtube.com/watch?v=${randomVideo}`)
    songs.push(songInfo)
  }
  songs = (await Promise.all(songs)).map(songInfo => {
    return {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    }
  })
  return songs
}

// Connect discord bot to account 
client.login(TOKEN)