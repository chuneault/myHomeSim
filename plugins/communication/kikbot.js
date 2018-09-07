'use strict';

// We are gonna need to import the http library and the kikBot SDK
// so that we can use them to make our bot work
const plugins = require("../../lib/hsPlugins.js");
const _       = require('lodash');
const http = require('http');
let Bot  = require('@kikinteractive/kik');



class kikbot extends plugins {

    constructor(controller, params) {
        super(controller, params);
        let self = this;

        // We are first gonna create a new bot object with all of
        // the information we just filled in on dev.kik.com

        self.bot = new Bot({
            username: self.params.userName, // The username you gave BotsWorth on Kik
            apiKey: self.params.apiKey,     // The API Key you can find on your profile on $
            baseUrl: self.params.baseUrl    // THIS IS YOUR WEBHOOK! make sure this maches$
        });

        // Send the configuration to kik to update the bot with the information above
        self.bot.updateBotConfiguration();

        // The onTextMessage(message) handler. This is run everytime your bot gets a message.
        // The method takes a message object as a parameter.
        self.bot.onTextMessage((message) => {

            // We take the message and call the reply method with the body of the message we recieved
            // this is the "echo" functionality of our bot
            message.reply(message.body);

            // print out the message so we can see on the server what's being sent
            console.log(message.body);
        });

        // We want to set up our start chatting message. This will be the first message the user gets when they start
        // chatting with your bot. This message is only sent once.
        self.bot.onStartChattingMessage((message) => {
            self.bot.getUserProfile(message.from)
                .then((user) => {
                    message.reply(`Hey ${user.firstName}! I'm your new echo bot. Send me a message and I'll send it right back!`);
                });
        });

        // Set up your server and start listening
        let server = http
            .createServer(self.bot.incoming())
            .listen(self.params.baseUrlPort, (err) => {
                if (err) {
                    return console.log('something bad happened', err)
                }

                console.log(`kik bot server is listening on ` + self.params.baseUrlPort)
            });


        controller.addObject('kik', {class: this, sendMessage: self.sendMessage});
    }

    sendMessage(body, recipient) {
        let self = this;
        if (_.isObject(body)) {
            recipient = body.recipient;
            body = body.body;
        }
        self.bot.send(Bot.Message.text(body), recipient);
    }

}

exports.connect = function(pluginType, params, callback) {
    callback({
        name: 'kikbot',
        params: params,
        pluginClass: kikbot
    });
};






