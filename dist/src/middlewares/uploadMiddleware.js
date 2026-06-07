import multer from "multer";
import path from "path";
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // ✅ CORECT: Folosește process.cwd() pentru a salva în folderul 'uploads' din interiorul proiectului tău, NU în rădăcina C:\
        cb(null, path.join(process.cwd(), "uploads"));
    },
    filename: (req, file, cb) => {
        // ✅ CORECT: Generăm un nume unic (ex: 1718294829-392849.jpg) bazat pe timestamp și cifre random.
        // Astfel, dacă doi utilizatori uploadează "tricou.jpg", pozele nu se vor suprascrie și metoda de update va ști exact ce să șteargă!
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        // Păstrăm extensia originală (.jpg, .png etc.)
        const fileExtension = path.extname(file.originalname);
        cb(null, uniqueSuffix + fileExtension);
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("Only images are allowed!"), false);
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limită de 5MB
});
export default upload;
