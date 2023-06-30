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
  messages = []
});

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
const openai = new OpenAIApi(configuration);

var messages = []
var max_tokens;

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Web UI
app.get('/', (req, res) => {
  res.sendFile('index.html');
});

io.on('connection', function(socket) {
  socket.on('chat message', (message) => {
    const [text, lang] = message.values
    console.log('Message: ' + text);
    console.log('Message: ' + lang);

    if (lang == "hi-IN")
      max_tokens = 128;
    else
      max_tokens = 128;
    // Get a reply from API.ai

    messages.push({"role": "user", "content": text})

    openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.9,
      max_tokens: max_tokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }).then(({ data }) => {
      console.log('Bot reply:' + data.choices[0].message.content);
      socket.emit('bot reply', data.choices[0].message.content);
      messages.push({"role": "system", "content": data.choices[0].message.content})
      })
      .catch(err => console.error(err));

  });
});
