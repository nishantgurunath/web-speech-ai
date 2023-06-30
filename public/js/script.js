'use strict';

const socket = io();

const outputYou = document.querySelector('.output-you');
const outputBot = document.querySelector('.output-bot');
var lang = "en-US";
lang = document.getElementById('Language').value;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = lang;
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;
var voices;
var spanishVoices, germanVoices, italianVoices, dutchVoices;
var hindiVoices, frenchVoices, portugueseVoices;
speechSynthesis.onvoiceschanged = () => {
  voices = synth.getVoices();
  spanishVoices = voices.filter(voice => (voice.lang.startsWith('es') && voice.name.includes('Google')));
  germanVoices = voices.filter(voice => (voice.lang.startsWith('de') && voice.name.includes('Google')));
  italianVoices = voices.filter(voice => (voice.lang.startsWith('it') && voice.name.includes('Google')));
  dutchVoices = voices.filter(voice => (voice.lang.startsWith('nl') && voice.name.includes('Google')));
  hindiVoices = voices.filter(voice => (voice.lang.startsWith('hi') && voice.name.includes('Google')));
  frenchVoices = voices.filter(voice => (voice.lang.startsWith('fr') && voice.name.includes('Google')));
  portugueseVoices = voices.filter(voice => (voice.lang.startsWith('pt') && voice.name.includes('Google')));
}

document.querySelector('button').addEventListener('click', () => {
  lang = document.getElementById('Language').value;
  recognition.lang = lang;
  recognition.start();
});

recognition.addEventListener('speechstart', () => {
  console.log('Speech has been detected.');
});

recognition.addEventListener('result', (e) => {
  console.log('Result has been detected.');

  let last = e.results.length - 1;
  let text = e.results[last][0].transcript;

  outputYou.textContent = text;
  console.log('Confidence: ' + e.results[0][0].confidence);

  socket.emit('chat message', text);
});

recognition.addEventListener('end', () => {
    recognition.stop();
});

recognition.addEventListener('error', (e) => {
  outputBot.textContent = 'Error: ' + e.error;
});

function synthVoice(text, lang) {
  const utterance = new SpeechSynthesisUtterance();
  utterance.text = text;
  utterance.lang = lang;
  console.log("language: " + utterance.lang)
  if (lang == "es-ES") {
    utterance.voice = spanishVoices[0]
  }
  else if (lang == "de-DE") {
    utterance.voice = germanVoices[0]
  }
  else if (lang == "pt-PT") {
    utterance.voice = portugueseVoices[0]
  }
  else if (lang == "it-IT") {
    utterance.voice = italianVoices[0]
  }
  else if (lang == "hi-IN") {
    utterance.voice = hindiVoices[0]
  }
  else if (lang == "fr-FR") {
    utterance.voice = frenchVoices[0]
  }
  else if (lang == "nl-NL") {
    utterance.voice = dutchVoices[0]
  } 

  synth.speak(utterance);
}

socket.on('bot reply', function(replyText) {
  if(replyText == '') replyText = "I couldn't hear you. Could you please repeat that?";
  synthVoice(replyText, lang);
  outputBot.textContent = replyText;
});
