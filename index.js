'use strict';

require('dotenv').config()
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
