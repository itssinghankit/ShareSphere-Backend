import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (fileContent) => {
    
    try {
        if (!fileContent) return null;
        const response = await cloudinary.uploader.upload(fileContent, { resource_type: "auto" });
        return response;

    } catch (error) {
       
        return null;
    }
}

export { uploadOnCloudinary };