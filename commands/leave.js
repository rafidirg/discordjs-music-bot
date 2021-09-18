const discord = require('discord.js');

module.exports = {
    /**
     * 
     * @param {string[]} args 
     * @param {discord.Message} message 
     */
    run: (args, message) => {
        if(!message.member.voice.channel.id) return message.channel.send(`You must be in a voice channel!`);
        message.member.voice.channel.leave();
    },

    command: 'join'
}