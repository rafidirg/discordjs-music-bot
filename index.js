const discord = require('discord.js');
const lavalink = require('@lavacord/discord.js');
const config = require('./config.json');
const fs = require('fs').promises;

const client = new discord.Client();
const lavacordManager = new lavalink.Manager(client, config.nodes);

const commands = new discord.Collection();

lavacordManager.on('error', (err, node) => {
    console.log(`An error occured on node ${node.id}.`, err)
});

fs.readdir('./events')
    .then(files => {
        for(const file of files.filter(file => file.endsWith('.js'))){
            const loaded = require('./events/' + file);

            if (!loaded.eventName | !loaded.run)
                return console.error(`Missing params form ${file}`);
            
            client.on(loaded.eventName, loaded.run);
            console.log(`loaded event ${loaded.eventName}`)
        }
    })

fs.readdir('./commands')
    .then(files => {
        for(const file of files.filter(file => file.endsWith('.js'))){
            const loaded = require('./commands/' + file);

            if (!loaded.command | !loaded.run)
                return console.error(`Missing params form ${file}`);
            
            commands.set(loaded.command, loaded.run)
            console.log(`loaded command ${loaded.command}`)
        }
    })

client.login(config.token)

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.channelID !== oldState.guild.me.voice.channelID || newState.channel){
        return;
    }
    if (!oldState.channel.members.size - 1){
        oldState.channel.leave();
    }
})

module.exports = {
    client,
    lavacordManager,
    commands,

    /**@type {Object.<string, import('./structures/Queue')>} */
    queues: {}
}