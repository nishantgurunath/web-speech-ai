'use strict';

require('dotenv').config()
// const CHAT_SONIC_API_TOKEN = process.env.CHAT_SONIC_API_TOKEN;
// const APIAI_SESSION_ID = process.env.APIAI_SESSION_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const express = require('express');
const app = express();

app.use(express.static(__dirname + '/views')); // html
app.use(express.static(__dirname + '/public')); // js, css, images

const server = app.listen(process.env.PORT || 1234, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

const io = require('socket.io')(server);
io.on('connection', function(socket){
  console.log('a user connected');
});

// const apiai = require('apiai')(APIAI_TOKEN);

// const chatsonic_api = require('api')('@writesonic/v2.2#4enbxztlcbti48j');
// chatsonic_api.auth(CHAT_SONIC_API_TOKEN);

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
const openai = new OpenAIApi(configuration);

var prompt = ""

// Web UI
app.get('/', (req, res) => {
  res.sendFile('index.html');
});

io.on('connection', function(socket) {
  socket.on('chat message', (text) => {
    console.log('Message: ' + text);

    // Get a reply from API.ai

    // let apiaiReq = apiai.textRequest(text, {
    //   sessionId: APIAI_SESSION_ID
    // });

    // apiaiReq.on('response', (response) => {
    //   let aiText = response.result.fulfillment.speech;
    //   console.log('Bot reply: ' + aiText);
    //   socket.emit('bot reply', aiText);
    // });

    // apiaiReq.on('error', (error) => {
    //   console.log(error);
    // });

    // apiaiReq.end();

    // chatsonic_api.chatsonic_V2BusinessContentChatsonic_post({
    //   enable_google_results: 'true',
    //   enable_memory: true,
    //   input_text: text
    //   }, {engine: 'premium', language: 'en'})
    //   .then(({ data }) => {
    //     console.log('Bot reply:' + data.message);
    //     socket.emit('bot reply', data.message);
    //   })
    //   .catch(err => console.error(err));
    if (prompt) {
      prompt = prompt + "\n" + text;
    }
    else {
      prompt = text;
    }
    openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      // stop: ["Human", "AI", "Robot", "Computer"],
      frequency_penalty: 0,
      presence_penalty: 0.6,
      user: "Human",
      best_of: 1
    }).then(({ data }) => {
      console.log('Bot reply:' + data.choices[0].text);
      socket.emit('bot reply', data.choices[0].text);
      prompt = prompt + "\n" + data.choices[0].text;
      console.log(prompt)
      })
      .catch(err => console.error(err));
  });
});
