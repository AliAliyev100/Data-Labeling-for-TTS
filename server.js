const express = require('express')
const multer = require('multer');
const wav = require('wav');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");
const spawner = require("child_process").spawn
const { exec } = require('child_process');

let i = 0;

const format = require("./FormatBack").format
const azureApi = require("./azure").checkAzure;

const app = express()
const upload = multer({ dest: 'uploads/' });
const port = 8383
let result

const filePath = '\\\\wsl.localhost\\Ubuntu\\home\\aliyev\\kaldi\\egs\\speech-recognition-sdp\\data\\sample\\';
const answerFIle = '\\\\wsl.localhost\\Ubuntu\\home\\aliyev\\kaldi\\egs\\speech-recognition-sdp\\exp\\tri1\\sample_decode\\log\\decode.1.log';
const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
speechConfig.speechRecognitionLanguage = "az-AZ";



fs.readFile(answerFIle, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  result = data.split("\n")[7].split(" ").slice(1).toString().replace(",", " ")
});

app.use(express.static('public'))

app.post('/', upload.single('audio'), async (req, res) => {
  const reader = new wav.Reader();
  const writer = new wav.Writer({
    channels: 1,
    sampleRate: 44100,
    bitDepth: 16
  });

  reader.on('format', format => {
    writer.pipe(fs.createWriteStream(filePath + 'audio.wav'));
  });

  reader.on('data', data => {
    writer.write(data);
  });

  reader.on('end', () => {
    writer.end();
  });

  fs.createReadStream(req.file.path).pipe(reader);
  const python_process = spawner("python", ['./speech_to_text.py'])

  let azureRes
  let azureResFormatted
  callme();

  setTimeout(async () => {
    try {
      azureRes = await azureApi(filePath + 'audio.wav');
      azureResFormatted = format(azureRes)


    } catch (error) {
      console.error(error);s
    }


    result = result.toUpperCase()

    const response = { result, azureRes };
    res.send(response);
  }, 2800);

});



app.listen(port, () => console.log(`server started on port ${port}`))


function callme() {
  setTimeout(() => {
    fs.readFile(answerFIle, 'utf8', (err, data) => {
      if (err) {
        return;
      }
      result = data.split("\n")[7].split(" ").slice(1).toString().replace(/,/g, ' ');
    });
  }, 2000);
}

