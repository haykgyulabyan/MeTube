import fs from 'fs';
import path from 'path';
import multer from 'multer';
import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/videos', express.static('videos'));
app.use(express.static('public'));

if (!fs.existsSync('videos')) {
  fs.mkdirSync('videos');
}

let videos = [];
let nextId = 1;

const storage = multer.diskStorage({
                                     destination: (req, file, cb) => {
                                       cb(null, 'videos/');
                                     },
                                     filename: (req, file, cb) => {
                                       cb(null, Date.now() + path.extname(file.originalname));
                                     }
                                   });
const upload = multer({ storage: storage });

app.get('/api/videos', (req, res) => {
  res.json(videos);
});

app.post('/api/videos', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const video = {
    id: nextId++,
    title: req.body.title || 'Untitled',
    fileSize: req.file.size,
    filePath: `/videos/${req.file.filename}`
  };
  videos.push(video);
  res.status(201).json(video);
});

app.put('/api/videos/:id', upload.single('video'), (req, res) => {
  const id = parseInt(req.params.id);
  const videoIndex = videos.findIndex(v => v.id === id);
  if (videoIndex === -1) {
    return res.status(404).send('Video not found.');
  }
  const video = videos[videoIndex];
  if (req.body.title) {
    video.title = req.body.title;
  }
  if (req.file) {
    fs.unlinkSync(path.join(__dirname, video.filePath));
    video.filePath = `/videos/${req.file.filename}`;
    video.fileSize = req.file.size;
  }
  res.json(video);
});

app.delete('/api/videos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const videoIndex = videos.findIndex(v => v.id === id);
  if (videoIndex === -1) {
    return res.status(404).send('Video not found.');
  }
  const video = videos[videoIndex];
  fs.unlinkSync(path.join(__dirname, video.filePath));
  videos.splice(videoIndex, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
