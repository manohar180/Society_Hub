const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: "dgl5mxfve",
    api_key: "977965421179336",
    api_secret: "xT_Ju3W8hF-34X3mfBmOgrPW6Bs",
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'societyhub_complaints', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'bmp', 'svg'], // Extended formats
    },
});

module.exports = { cloudinary, storage };