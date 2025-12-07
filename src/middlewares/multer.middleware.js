import multer from "multer";


///// Photos 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Public/temp')
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName)
  }
})


///// Videos
const storageVideo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Public/tempvideo')
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName)
  }
})



export const uploadVideo = multer({storage:storageVideo})
export const upload = multer({storage})


