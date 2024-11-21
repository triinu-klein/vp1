const express =require("express");
const router = express.Router(); //suur R on oluline!!
const general=require("../generalFnc");

//kõikidele marsruudile ühine vahevara
router.use(general.checkLogin);

//kontrollerid
const{
	newsHome,
	addNews,
	addingNews,
	readNews}= require("../controllers/newsControllers");

//igale marsruudile oma osa nagu seni index failis

router.route("/").get(newsHome);

router.route("/addNews").get(addNews);

router.route("/addNews").post(addingNews);

router.route("/readNews").get(readNews);

module.exports=router;
