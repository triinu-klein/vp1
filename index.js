const express=require("express");
const dtEt=require("./dateTime.js");
const fs=require("fs");
const dbInfo=require("../../vp2024config");
const mysql=require("mysql2");
//päringu lahtiharutamiseks POST
const bodyparser=require("body-parser");
//const dateTimeFn= require("./dateTime");
let printTime=dtEt.time();
let printDate=dtEt.dateEt();
const multer=require("multer");
const sharp=require("sharp"); //pildi manipulation, suuruse muutmine
const app=express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended: true}));
//seadistame vahevara multer fotode laadimiseks kindlasse kataloogi
const upload=multer({dest: "./public/gallery/orig/"});

//loon andmebaasiühenduse
const conn=mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: "if24_triinu_kl"
});

app.get("/",(req, res)=>{
	let notice = "";
    let sqlreq = "SELECT * FROM vp1news ORDER BY news_date DESC LIMIT 1";
    conn.query(sqlreq, (err, results) => {
        if (err) {
            console.error("Andmebaasi viga:", err); 
            notice = "Viga andmebaasi päringus!";
            res.render("index", { notice: notice });
        } else {
            let latestNews = results[0]; 
            if (latestNews && latestNews.news_date) {
                latestNews.news_date = dtEt.givenDate(latestNews.news_date);
            }
            let compareResult = dtEt.compareDates("9-2-2024");
            res.render("index", { 
                latestNews: latestNews,
                compareResult: compareResult  
            });
        }
    });   
});

app.get("/timenow",(req,res)=>{
	const weekdayNow=dtEt.weekday();
	const dateNow=dtEt.dateEt();
	const timeNow=dtEt.time();
	res.render("timenow",{nowWD:weekdayNow, nowD:dateNow, nowT:timeNow});
});

app.get("/vanasonad",(req,res)=>{
	let folkWisdom=[];
	fs.readFile("public/textFiles/vanasonad.txt", "utf8", (err, data)=>{
		if(err){
			//throw err;
			res.render("justList",{h2:"Vanasõnad",listData:["Ei leidnud ühtegi vanasõna!"]});

		}
		else{
			folkWisdom=data.split(";");
			res.render("justList",{h2:"Vanasõnad",listData:folkWisdom});
		}
	});
});

app.get("/regVisit",(req, res)=>{
	res.render("regVisit");
});

app.post("/regVisit",(req, res)=>{
	const dateNow=dtEt.dateEt();
	const timeNow=dtEt.time();
	console.log(req.body);
	fs.open("public/textFiles/visitlog.txt", "a", (err, file)=>{
		if(err){
			throw err
		}
		else{
			fs.appendFile("public/textFiles/visitlog.txt", req.body.firstNameInput+" "+req.body.lastNameInput+", külastas "+ dateNow+" kell "+timeNow+";",(err)=>{
				if(err){
					throw err
				}
				else{
					console.log("Faili kirjutati!");
					res.render("regVisit");
				}
			});
		}
	});
	
});

app.get("/visitlog", (req,res)=>{
	let visitors=[];
	fs.readFile("public/textFiles/visitlog.txt", "utf8", (err, data)=>{
		if(err){
			//throw err;
			res.render("justList",{h2:"Külastajad",listData:["Ei leidnud ühtegi külastajat!"]});

		}
		else{
			visitors=data.split(";");
			res.render("justList",{h2:"Külastajad",listData:visitors});
		}
	});
});

app.get("/regVisitDB",(req, res)=>{
	let notice="";
	let firstName="";
	let lastName="";
	res.render("regVisitDB", {notice: notice, firstName: firstName, lastName: lastName});
});

app.post("/regVisitDB",(req, res)=>{
	let notice="";
	let firstName="";
	let lastName="";
	if(!req.body.firstNameInput || !req.body.lastNameInput){
		firstName=req.body.firstNameInput;
		lastName=req.body.lastNameInput;
		notice="Osa andmeid sisestamata!";
		res.render("regVisitDB", {notice: notice, firstName: firstName, lastName: lastName});
	}
	else{
		let sqlreq="INSERT INTO vp1visitlog (first_name, last_name) VALUES(?,?)";
		conn.query(sqlreq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlres)=>{
			if(err){
						throw err
					}
					else{
						notice="Külastus registreeritud!";
						res.render("regVisitDB", {notice: notice, firstName: firstName, lastName: lastName});
					}
		});
	}
});

app.get("/visitlogDB",(req, res)=>{
	let sqlrreq = "SELECT first_name, last_name, visit_time FROM vp1visitlog";
	let visitor=[];
	conn.query(sqlrreq, (err, sqlres)=>{
		if (err){
			throw err;
		}
		else{
			console.log(sqlres);
			visitor=sqlres;
			res.render("visitlogDB", {visitor: visitor});
		}
	});
	//res.render("tegelased");
});

app.get("/eestifilm",(req, res)=>{
	res.render("filmindex.ejs");
});
	
app.get("/eestifilm/tegelased",(req, res)=>{
	let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
	let persons=[];
	conn.query(sqlReq, (err, sqlres)=>{
		if (err){
			throw err;
		}
		else{
			console.log(sqlres);
			//persons=sqlres;
			for (i=0; i<sqlres.length; i++){
				persons.push({first_name:sqlres[i].first_name, last_name:sqlres[i].last_name, birth_date:dtEt.givenDate(sqlres[i].birth_date)});
			}
			console.log(persons);
			//for i algab 0 piiriks sqlres.length
			//tsükli sees lisame persons listile uue elemendi, mis on ise "objekt" {first_name: sqlres[i].first_name}
			//push.persons(lisatav element) ->listi lisamise käsk
			res.render("tegelased", {persons: persons});
		}
	});
	//res.render("tegelased");
});

app.get("/movieSubmit",(req, res)=>{
	let notice="";
	let movieTitle="";
	let movieYear="";
	let movieDuration="";
	let movieDescription="";
	res.render("movieSubmit", {notice: notice, movieTitle: movieTitle, movieYear: movieYear, movieDuration:movieDuration, movieDescription:movieDescription});
});

app.post("/movieSubmit",(req, res)=>{
	let notice="";
	let movieTitle="";
	let movieYear="";
	let movieDuration="";
	let movieDescription="";
	if(!req.body.movieTitleInput || !req.body.movieYearInput || !req.body.movieDurationInput || !req.body.movieDescriptionInput){
		movieTitle=req.body.movieTitleInput;
		movieYear=req.body.movieYearInput;
		movieDuration=req.body.movieDurationInput;
		movieDescription=req.body.movieDescriptionInput;
		notice="Osa andmeid sisestamata!";
		res.render("movieSubmit", {notice: notice, movieTitle: movieTitle, movieYear: movieYear, movieDuration:movieDuration, movieDescription:movieDescription});
	}
	else{
		let sqlreq="INSERT INTO movie (title, production_year, duration, description) VALUES(?,?,?,?)";
		conn.query(sqlreq, [req.body.movieTitleInput, req.body.movieYearInput, req.body.movieDurationInput, req.body.movieDescriptionInput], (err, sqlres)=>{
			if(err){
						throw err
					}
					else{
						notice="Film lisatud!";
						res.render("movieSubmit", {notice: notice, movieTitle: movieTitle, movieYear: movieYear, movieDuration:movieDuration, movieDescription:movieDescription});
					}
		});
	}
});

app.get("/personSubmit",(req, res)=>{
	let notice="";
	let firstName="";
	let lastName="";
	let birthDate="";
	res.render("personSubmit", {notice:notice, firstName:firstName, lastName:lastName, birthDate:birthDate});
});

app.post("/personSubmit",(req, res)=>{
	let notice="";
	let firstName="";
	let lastName="";
	let birthDate="";
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput){
		firstName=req.body.firstNameInput;
		lastName=req.body.lastNameInput;
		birthDate=req.body.birthDateInput;
		notice="Osa andmeid sisestamata!";
		res.render("personSubmit", {notice: notice, firstName: firstName, lastName: lastName, birthDate:birthDate});
	}
	else{
		let sqlreq="INSERT INTO person (first_name, last_name, birth_date) VALUES(?,?,?)";
		conn.query(sqlreq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, sqlres)=>{
			if(err){
						throw err
					}
					else{
						notice="Isik lisatud!";
						res.render("personSubmit", {notice: notice, firstName: firstName, lastName: lastName, birthDate:birthDate});
					}
		});
	}
});

app.get("/roleSubmit",(req, res)=>{
	let notice="";
	let positionName="";
	let positionDescription="";
	res.render("roleSubmit", {notice:notice, positionName:positionName, positionDescription:positionDescription});
});

app.post("/roleSubmit",(req, res)=>{
	let notice="";
	let positionName="";
	let positionDescription="";
	if(!req.body.positionNameInput || !req.body.positionDescriptionInput){
		positionName=req.body.positionNameInput;
		positionDescription=req.body.positionDescriptionInput;
		notice="Osa andmeid sisestamata!";
		res.render("roleSubmit", {notice:notice, positionName:positionName, positionDescription:positionDescription});
	}
	else{
		let sqlreq="INSERT INTO position (position_name, description) VALUES(?,?)";
		conn.query(sqlreq, [req.body.positionNameInput, req.body.positionDescriptionInput], (err, sqlres)=>{
			if(err){
						throw err
					}
					else{
						notice="Roll lisatud!";
						res.render("roleSubmit", {notice:notice, positionName:positionName, positionDescription:positionDescription});
					}
		});
	}
});


app.get("/addNews",(req, res)=>{
	res.render("addNews");
});

app.post("/addNews",(req, res)=>{
	let notice="";
	let newsTitle=req.body.newsTitleInput;
	let newsText=req.body.newsTextInput;
	let newsDate="";
	let expDate="";
	let userID="";
	if(!newsTitle || newsTitle.length<=3 || !newsText || newsText.length<=10 || !req.body.newsDateInput){
		notice="Osa andmeid sisestamata!";
		res.render("addNews", {notice: notice, newsTitle: newsTitle, newsText: newsText, newsDate:newsDate, expDate:expDate, userID:userID});
	}
	else{
		newsTitle=req.body.newsTitleInput;
		newsText=req.body.newsTextInput;
		newsDate=req.body.newsDateInput;
		let dateNow = new Date(newsDate); 
        dateNow.setDate(dateNow.getDate() + 10);
        expDate = dateNow.toISOString().split('T')[0];
		userID="1";
		let sqlreq="INSERT INTO vp1news (news_title, news_text, news_date, expire_date, user_id) VALUES(?,?,?,?,?)";
		conn.query(sqlreq, [req.body.newsTitleInput, req.body.newsTextInput, req.body.newsDateInput, expDate, userID], (err, sqlres)=>{
			if(err){
						throw err
					}
					else{
						notice="Uudis lisatud!";
						res.render("addNews", {notice: notice, newsTitle: newsTitle, newsText: newsText, newsDate:newsDate, expDate:expDate});
					}
		});
	}
});

app.get("/photoUpload",(req, res)=>{
	res.render("photoUpload");
});

app.post("/photoUpload", upload.single("photoInput"),(req, res)=>{
	if (!req.file || !req.body.altInput || !req.body.privacyInput) {
        return res.render("photoUpload", { message: "Osa andmeid on puudu!" });
    }
	console.log(req.body);
	console.log(req.file);
	//genereerime failinime
	const fileName="vp_"+Date.now()+".jpg";
	//nimetame üleslaetud faili ümber
	fs.rename(req.file.path, req.file.destination+fileName, (err)=>{
		 if (err) {
            console.log("Faili ümbernimetamine ebaõnnestus:", err);
            return res.render("photoUpload", { message: "Pilti ei õnnestunud üles laadida" });
        }
	});
	sharp(req.file.destination+fileName).resize(800,600).jpeg({quality: 90}).toFile("./public/gallery/normal/"+fileName);
	sharp(req.file.destination+fileName).resize(100,100).jpeg({quality: 90}).toFile("./public/gallery/thumb/"+fileName);
	let sqlReq="INSERT INTO vp1photos (file_name, orig_name, alt_text, privacy, user_id) VALUES (?,?,?,?,?)";
	const userId=1;
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId], (err,result)=>{
		if (err) {
                console.log("Andmebaasi sisestamine ebaõnnestus:", err);
                res.render("photoUpload", { message: "Pilti ei õnnestunud üles laadida" });
            } else {
                res.render("photoUpload", { message: "Pilt üles laetud!" });
		}
	});
});
	
app.get("/photogallery", (req, res) => {
    let sqlReq = "SELECT * FROM vp1photos WHERE privacy = 3"; 
    conn.query(sqlReq, (err, results) => {
        if (err) {
            console.error("Andmebaasi viga:", err);
            return res.render("photogallery", { message: "Pilti ei leitud!" });
        }

        if (results.length === 0) {
            return res.render("photogallery", { message: "Galerii on tühi. Pole avalikke pilte." });
        }
        res.render("photogallery", { photos: results, message:""});
    });
});


app.listen(5109);




