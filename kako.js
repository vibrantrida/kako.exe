const fs = require('fs')
const Discord = require('discord.js')

const moment = require('moment')
moment.locale('en')
require('console-stamp')(console, {
  formatter: () => {
    return moment().format('YYYY-MM-DD hh:mm:ss A')
  }
})

const config = require('./config.json')
const kako = new Discord.Client()

// -------- Kako.exe --------------
kako.on('ready', () => {
  console.log('Kako.exe ready')

  setInterval(() => {
    Japarimon.update()
  }, 30000) // 30s
}) // on 'ready'
// -------- end - Kako.exe --------

// -------- Japarimon -------------
const monsdb = require('./data/mons.json')
let playersdb = require('./data/players.json')

console.info('loaded players.json to playersdb:\n', JSON.stringify(playersdb, null, 4))

let Japarimon = {}
Japarimon.channels = config.channels
Japarimon.channel = null
Japarimon.chance = 0.5 // 0.05 - 5%
Japarimon.state = 0 // 0 - explore, 1 - encounter
Japarimon.tick = 0 // 1 tick is 30s
Japarimon.flee_tick = 4 // mons will flee after 2m
Japarimon.local_mons = []
Japarimon.encountered_mon = -1 // encountered mon
Japarimon.state_msg = -1 // message object of last state message for later deletion
Japarimon.shuffle = function (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    let temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
} // shuffle
Japarimon.encounterMon = function () {
  let m = {
    files: [`./data/${Japarimon.encountered_mon.sprite}`]
  }
  Japarimon.channel.send(`A ${Japarimon.encountered_mon.name} appeared!`, m)
    .then(msg => {
      console.log('saving state message to state_msg')
      Japarimon.state_msg = msg
    })
  return
} // encounterMon
Japarimon.pickChannel = function () {
  console.log('Picking a random channel')
  // doing this twice because Math.random() uses the same seed on start-up
  let ch = Japarimon.channels[Math.floor(Math.random()*Japarimon.channels.length)]
  ch = Japarimon.channels[Math.floor(Math.random()*Japarimon.channels.length)]
  Japarimon.channel = kako.channels.find('name', ch)
  console.info('Picked channel: ', ch)
} // pickChannel
Japarimon.explore = function () {
  console.log('Throw dice!')
  if (Math.random() < Japarimon.chance) {
    if (Japarimon.local_mons.length > 0) {
      console.log('local_mons is not empty, popping a mon to encountered_mon')
      Japarimon.encountered_mon = Japarimon.local_mons.pop()
      console.log(`\n${JSON.stringify(Japarimon.encountered_mon, null, 4)}`)
    } else {
      console.log('local_mons is empty, copying monsdb to local_mons')
      Japarimon.local_mons = monsdb.slice()

      console.log('shuffling local_mons... Fisher-Yates style!')
      Japarimon.shuffle(Japarimon.local_mons)
      Japarimon.shuffle(Japarimon.local_mons)

      console.log('local_mons has been shuffle, popping a mon to encountered_mon')
      Japarimon.encountered_mon = Japarimon.local_mons.pop()
    }
  } else {
    console.log('no dice')
    Japarimon.explore()
  }
} // explore
Japarimon.update = function () {
  switch (Japarimon.state) {
    case 0: // explore
      console.info('state is \'Explore\'')
      Japarimon.pickChannel()
      Japarimon.explore()
      Japarimon.encounterMon()
      console.log('setting state to \'Encounter\'')
      // switch to state 1
      Japarimon.state = 1
      break;
    case 1: // encounter
      console.info('state is \'Encounter\'')
      if (Japarimon.encountered_mon === undefined || Japarimon.encountered_mon === -1) {
        console.info('encountered_mon is invalid, switching back state to \'Explore\'')
        Japarimon.tick = 0;
        Japarimon.state = 0
      }
      console.info('encountered_mon has a name of ', Japarimon.encountered_mon.name)
      if (Japarimon.tick >= Japarimon.flee_tick) {
        console.info('tick is equal to flee_tick')
        if (Japarimon.state_msg !== -1) {
          console.log('deleting state_msg')
          Japarimon.state_msg.delete()
          Japarimon.state_msg = -1
        }
        Japarimon.encountered_mon = -1;
        console.log('encountered_mon has fled, encountered_mon is now equal to -1')
        console.log('resetting tick to 0, switching state to \'Explore\'')
        Japarimon.tick = 0;
        Japarimon.state = 0;
      } else {
        console.log('incremeting tick')
        ++Japarimon.tick
        console.info(`${Japarimon.tick} ticks has elapsed`)
      }
      break;
  }
} // update
// -------- end - Japarimon -------

// -------- error handlers --------
process.on('unhandledRejection', (reason) => {
  console.info('Reason: ' + reason)
})

kako.on('error', e => {
  console.error(e)
})

// kako's alive!
kako.login(config.token)
