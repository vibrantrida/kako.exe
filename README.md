# kako.exe
<small>Licensed under [Apache-2.0](/LICENSE)</small>

An unofficial fan-made Discord game bot based on the [Kemono Friends Project](https://en.wikipedia.org/wiki/Kemono_Friends).

## Mechanics
Every 30 seconds, the bot will roll a dice with a chance of 5% of encountering a Mon. If a Mon is encountered, players can collect them by sending a `catch` command in the channel where the Mon was encountered.

Encountered Mons will run away after 2 minutes.

Players can also brag how many Mons they have collected or peek at other player's collection by sending a `collection` command.

Mons will only be encountered in specified channels in `config.json`.

## Commands
- `catch` - catch encountered Mons
- `collection [user]` - show your or a user's number of collected Mons

## Configuration
```js
// kako.js - line 39
// ...
Japarimon.chance = 0.05 // 5%
// ...
// 1 tick is 30s
Japarimon.flee_tick = 4 // mons will flee after 2m
// ...
```
```js
// config.json
{
  "token": "BOT-USER-TOKEN",
  // channels where to spawn Mons
  "channels": [ "channel-a", "channel-b",  "channel-c" ],
  // command prefix
  "prefix": "!"
}
```
