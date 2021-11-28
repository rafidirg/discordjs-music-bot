const { TextChannel, MessageEmbed, UserFlags } = require("discord.js");
const { lavacordManager } = require("..");
const axios = require('axios').default;
const { msToHMS } = require('../utils')

const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);

module.exports = class Queue {
    /**
     * 
     * @param {String} guildID 
     * @param {String} channelID 
     * @param {TextChannel} textChannel 
     */
    constructor(guildID, channelID, textChannel) {
        this.guildID = guildID;
        this.channelID = channelID;
        this.textChannel = textChannel;

        this.queue = [];
        this.player = null;
        this.currentlyPlaying = null;
    }

    async search(searchTerm) {
        const node = lavacordManager.idealNodes[0];

        const params = new URLSearchParams();
        params.append('identifier', urlRegex.test(searchTerm) ? searchTerm : `ytsearch:${searchTerm}`);

        const data = await axios(`http://${node.host}:${node.port}/loadtracks?${params}`, {
            headers: {
                Authorization: node.password
            }
        });

        return data.data.tracks ?? [];
    }

    async play(track) {
        this.queue.push(track);

        if(!this.currentlyPlaying) {
            this._playNext();
            return false;
        } else {
            return true;
        }
    }

    async _playNext() {
        const nextSong = this.queue.shift();
        this.currentlyPlaying = nextSong;

        if(!nextSong) {
            this.player.stop()
            this.player = null;
            this.currentlyPlaying = null;

            if (!this.currentlyPlaying){
                setTimeout(async () =>{
                    if(!this.currentlyPlaying){
                        await lavacordManager.leave(this.guildID)
                        this.textChannel.send('No Activity, leaving channel');
                    }
                }, 1500000)
            }
            return;
        }

        this.textChannel.send(
            new MessageEmbed()
                .setTitle("🎶 Now Playing: " + nextSong.info.title)
                .setColor("000000")
        );

        if(!this.player) {
            this.player = await lavacordManager.join({
                guild: this.guildID,
                channel: this.channelID,
                node: lavacordManager.idealNodes[0].id
            });

            this.player.on('end', data => {
                if(data.reason === "REPLACED" || data.reason === "STOPPED") return;
                this._playNext();
            });
        }

        await this.player.play(nextSong.track);
    }
}