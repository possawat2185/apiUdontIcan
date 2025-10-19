import express, { Request, Response } from "express";
import multer from "multer";
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export const router = express.Router();

const firebaseConfig = {
  apiKey: "AIzaSyCBqjLX3FN-9vH_Mi22C3omFxix6Vjxjfc",
  authDomain: "udontican-delivery.firebaseapp.com",
  projectId: "udontican-delivery",
  storageBucket: "udontican-delivery.appspot.com",
  messagingSenderId: "304107332797",
  appId: "1:304107332797:web:7731cdfa7da3f531af03d4",
  measurementId: "G-K4CT5JT1RT",
};

initializeApp(firebaseConfig);

const storage = getStorage();

const fileupload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize:10 * 1024 * 1024
  }
})

router.get("/", (req, res) => {
  res.send("Upload raider worked");
});


router.post(
  "/",
  fileupload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      const uniqueFilename = `RID${Date.now()}-${uuidv4()}}`;
      const storageRef = ref(storage, `images/raiders/profiles/${uniqueFilename}`);
      const metadata = {
        contentType: file.mimetype,
      };
      const snapshot = await uploadBytesResumable(
        storageRef,
        file.buffer,
        metadata
      );

      const downloadURL = await getDownloadURL(snapshot.ref);

      return res.status(200).json({
        message: "File uploaded raiders successfully",
        fileName: uniqueFilename,
        url: downloadURL,
      });
    } catch (error: any) {
      console.error("Error uploading file raiders:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.post("/vehicle", fileupload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const licensePlate = req.body.licensePlate;
    const uniqueFilename = `Vehicle${Date.now()}-${licensePlate}`;
    const storageRef = ref(storage, `images/raiders/vehicles/${uniqueFilename}`);
    const metadata = {
        contentType: file.mimetype,
    };
    const snapshot = await uploadBytesResumable(
      storageRef,
      file.buffer,
      metadata
    );
    const downloadURL = await getDownloadURL(snapshot.ref);

    return res.status(200).json({
      message: "vehicle file uploaded raiders successfully",
      fileName: uniqueFilename,
      url: downloadURL,
    });
  }
    catch (error: any) {
    console.error("Error uploading vehicle file raiders:", error);
    return res.status(500).json({ message: error.message });
  }
});
