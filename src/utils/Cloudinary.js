import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "dhuewvpgu",
  api_key: "977975679946186",
  api_secret: "Sh9FH-u-ANAIlZYcHAqW4ZSUk0g",
});

const uploadOnCloudinar = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File has been uploaded successfully", result.url);
    console.log("Local Path ---->", localFilePath);
    fs.unlinkSync(localFilePath);
    return result;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinar };
