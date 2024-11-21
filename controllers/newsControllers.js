const mysql=require("mysql2");
const dbInfo=require("../../../vp2024config");
const dtEt=require("../dateTime.js");
const conn=mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: "if24_triinu_kl"
});

//@desc homepage for news section
//@route GET /news
//@acess private
const newsHome=(req, res)=>{
	res.render("news",{notice:""});
};

//@desc page for news adding
//@route GET /news/addNews
//@acess private
const addNews=(req, res)=>{
	res.render("addNews",{notice:""});
};

//@desc news adding
//@route POST /news/addNews
//@acess private
const addingNews=(req, res)=>{
	let notice="";
	let newsTitle=req.body.newsTitleInput;
	let newsText=req.body.newsTextInput;
	let newsDate=dtEt.dateEt();
	let expDate="";
	let userID="";
	let dateNow = new Date(newsDate); 
	if(!newsTitle || newsTitle.length<=3 || !newsText || newsText.length<=10){
		notice="Osa andmeid sisestamata!";
		res.render("addNews", {notice: notice, newsTitle: newsTitle, newsText: newsText, newsDate:newsDate, expDate:expDate, userID:userID});
	}
	else{
		newsTitle=req.body.newsTitleInput;
		newsText=req.body.newsTextInput;
		newsDate=req.body.newsDateInput;
        dateNow.setDate(dateNow.getDate() + 10);
        expDate = dateNow.toISOString().split('T')[0];
		userID=req.session.userId;
		let sqlreq="INSERT INTO vp1news (news_title, news_text, news_date, expire_date, user_id) VALUES(?,?,?,?,?)";
		conn.query(sqlreq, [req.body.newsTitleInput, req.body.newsTextInput, req.body.newsDateInput, expDate, userID], (err, sqlres)=>{
			if(err){
				throw err;
				notice="Uudise sisestamine ebaõnnestus.";
				}
				else{
					notice="Uudis lisatud!";
					res.render("addNews", {notice: notice, newsTitle: newsTitle, newsText: newsText, newsDate:newsDate, expDate:expDate});
				}
		});
	}
};

//@desc page for reading news
//@route GET /news/readNews
//@acess private
const readNews=(req, res)=>{
	let sqlReq = "SELECT news_title, news_text, news_date FROM vp1news ORDER BY news_date DESC";
	let readNews=[];
	conn.query(sqlReq, (err, sqlres)=>{
		if (err){
			throw err;
		}
		else{
			console.log(sqlres);
			for (i=0; i<sqlres.length; i++){
				readNews.push({news_title:sqlres[i].news_title, news_text:sqlres[i].news_text, news_date:dtEt.givenDate(sqlres[i].news_date)});
			}
			console.log(readNews);
			res.render("readNews", {readNews: readNews});
		}
	});
};

module.exports={
	newsHome,
	addNews,
	addingNews,
	readNews
};