const util = require('../../utilities.js')
const fs = require('fs')
const createCollage = require('photo-collage-latest')
const moment = require('moment')
const Discord = require('discord.js')

let lastChallenge = moment(fs.readFileSync('modules/sola_challenge/lastChallenge.txt', 'utf8')).utc()
let lastPin = fs.readFileSync('modules/sola_challenge/lastPin.txt', 'utf8')
let channel

module.exports = {
  async reqs (client, db) {
    await util.checkData(client, 'challenges', {})
  },
  events: {
    async ready (client, db) {
      console.log('Bot is up!')
      channel = client.guilds.first().channels.find(c => c.name === 'solas-art-challenge')
      await channel.messages.fetch()

      if (moment().isSame(lastChallenge, 'day')) {
        console.log("Today's challenge has already been sent. Scheduling next one")

        let nextChallenge = lastChallenge.add(1, 'day').hour(12).minute(0)
        console.log(`Scheduling next challenge to ${nextChallenge}`)
        setTimeout(send, moment(nextChallenge).diff(moment().utc()), client)
      } else {
        console.log("Today's challenge hasn't been sent. Sending challenge...")
        send(client)
      }
    }
  }
}

async function send (client) {
  if (client.data.challenges[moment().month() + 1] && client.data.challenges[moment().month() + 1][moment().date()]) {
    const embed = {
      content: '@ArtChallenge',
      embed: {
        'title': ':sparkles: Welcome to the Weekly Art Challenge! :sparkles:',
        'description': `Every Friday I will post a new word prompt for everyone to try and make something creative to!\n\nCheck the pinned post in this channel to see what todays word is.\n\nTHIS WEEK'S WORD IS\n${client.data.challenges[moment().month() + 1][moment().date()]}\n\nWrite #weekly on your post so everyone can find it!`,
        'color': 7836572,
        'thumbnail': {
          'url': 'https://cdn.discordapp.com/avatars/434066657036730368/334d6ee6b5d30c2b32b25499cdfee9bd.png'
        }
      }
    }

    let sent = await channel.send(embed)
    await sent.pin()

    let pinMessage = channel.messages.get(lastPin)
    if (pinMessage) pinMessage.unpin()

    lastPin = sent.id
    fs.writeFileSync('lastPin.txt', lastPin)
    console.log('Challenge sent')

    try {
      await channel.messages.fetch()
      let messages = await channel.messages.fetch({before: sent.id, after: pinMessage.id})
      messages.sweep(m => m.author.bot)

      let attachments = []
      let authors = []

      let width = 0
      let height = 0
      messages.forEach(m => {
        m.attachments.forEach(a => {
          if (a.width > width) width = a.width
          if (a.height > height) height = a.height

          attachments.push(a.url)
          authors.push(m.author.tag)
        })
      })

      const options = {
        sources: attachments,
        height: Math.ceil(Math.sqrt(attachments.length)),
        width: Math.ceil(Math.sqrt(attachments.length)), // images per column
        imageWidth: width, // width of each image
        imageHeight: height // height of each image
        // backgroundColor: "#cccccc", // optional, defaults to #eeeeee.
      }

      createCollage(options)
        .then((canvas) => {
          channel.send('Thank you for joining last weeks challenge! Every participant will receive 5,000 stars.', new Discord.MessageAttachment(canvas.toBuffer(), 'challenge.jpg'))
        })
    } catch (e) {
      console.log(e.stack)
    }
  } else {
    console.log("There's no challenge for today")
  }

  fs.writeFileSync('lastChallenge.txt', moment().utc().format('YYYY-MM-DD'))
  let nextChallenge = lastChallenge.add(1, 'day').hour(12).minute(0)

  console.log(`Scheduling next challenge to ${nextChallenge}`)
  setTimeout(send, moment(nextChallenge).diff(moment().utc()), client)
}
