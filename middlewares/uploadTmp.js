import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const destination = path.join(__dirname, '../', 'tmp');

const multerConfig = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, destination);
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
});

const uploadTmp = multer({ storage: multerConfig });

export default uploadTmp;