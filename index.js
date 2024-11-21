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
const bcrypt=require("bcrypt");//parooli krüpteerimiseks
const session=require("express-session"); //sessioonihaldur
const async = require("async");

const app=express();
app.use(session({secret:"TobuJobuTofu", saveUninitialized:true, resave:true}));
app.use((req, res, next) => {
  if (req.session.firstName && req.session.lastName) {
    res.locals.firstName = req.session.firstName;
    res.locals.lastName = req.session.lastName;
  }
  next();
  });
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

const checkLogin=function(req, res, next){
	if(req.session != null && req.session.userId){
		if(req.session.userId){
			console.log("Login, sees kasutaja: "+ req.session.userId);
			next();
		}
		else{
			console.log("login not detected");
			res.redirect("/signin");
		}
	}
	else{
		console.log("session not detected");
		res.redirect("/signin");
	}
};

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
            res.render("index", {latestNews: latestNews,compareResult: compareResult});
        }
    });   
});

app.get("/signup",(req,res)=>{
	res.render("signup");
});

app.post("/signup", (req, res) => {
    let notice = "Ootan andmeid...";
    console.log(req.body);

    if (!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.confirmPasswordInput !== req.body.passwordInput) {
        console.log("Andmeid on puudu, parool on liiga lühike või paroolid ei kattu");
        notice = "Andmeid on puudu, parool on liiga lühike või paroolid ei kattu";
        return res.render("signup", {notice: notice, firstNameInput: req.body.firstNameInput || '',lastNameInput: req.body.lastNameInput || '',birthDateInput: req.body.birthDateInput || '',genderInput: req.body.genderInput || '',emailInput: req.body.emailInput || ''});
    }
    const emailInputNormalized = req.body.emailInput.toLowerCase();
    const emailCheck = "SELECT email FROM vp1users WHERE LOWER(email) = ?";
    conn.query(emailCheck, [emailInputNormalized], (err, results) => {
        if (err) {
            console.error("Tehniline viga andmebaasi päringus:", err);
            notice = "Tehniline viga andmebaasi päringus.";
            return res.render("signup", {notice: notice, firstNameInput: req.body.firstNameInput || '',lastNameInput: req.body.lastNameInput || '',birthDateInput: req.body.birthDateInput || '',genderInput: req.body.genderInput || '',emailInput: req.body.emailInput || ''});
        }
        if (results.length > 0) {
            notice = "Selline e-mail on juba registreeritud.";
            console.log("Email already exists:", req.body.emailInput); // Log if the email already exists
            return res.render("signup", {notice: notice, firstNameInput: req.body.firstNameInput || '',lastNameInput: req.body.lastNameInput || '',birthDateInput: req.body.birthDateInput || '',genderInput: req.body.genderInput || '',emailInput: req.body.emailInput || ''});
        }

        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                console.error("Salt generation error:", err);
                notice = "Tehniline viga, kasutajat ei loodud.";
                return res.render("signup", { notice: notice });
            }

            bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash) => {
                if (err) {
                    console.error("Password hashing error:", err);
                    notice = "Tehniline viga parooli krüpteerimisel, kasutajat ei loodud.";
                    return res.render("signup", { notice: notice });
                }

                const sqlReq = `
                    INSERT INTO vp1users 
                    (first_name, last_name, birth_date, gender, email, password) 
                    VALUES (?, ?, ?, ?, ?, ?)`;

                conn.execute(sqlReq,[req.body.firstNameInput,req.body.lastNameInput,req.body.birthDateInput,req.body.genderInput,req.body.emailInput,pwdHash],(err, result) => {
                        if (err) {
                            console.error("Database insertion error:", err);
                            notice = "Tehniline viga andmebaasi kirjutamisel, kasutajat ei loodud.";
                            return res.render("signup", {notice: notice, firstNameInput: req.body.firstNameInput || '',lastNameInput: req.body.lastNameInput || '',birthDateInput: req.body.birthDateInput || '',genderInput: req.body.genderInput || '',emailInput: req.body.emailInput || ''});
                        }

                        notice = "Kasutaja " + req.body.emailInput + " edukalt loodud.";
                        return res.render("signup", { notice: notice });
                    }
                );
            });
        });
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
	
app.get("/eestifilm/lisaSeos",(req, res)=>{
	//võtan kasutusele mooduli, et korraga teha lahti mitu Andmebaasi
	const filmQueries = [
		function(callback){
			let sqlReq1 = "SELECT id, first_name, last_name, birth_date FROM person";
			conn.execute(sqlReq1, (err, result)=>{
				if(err){
					return callback(err);
				}
				else{
					return callback(null, result);
				}
			});
		},
		function(callback){
			let sqlReq2 = "SELECT id, title, production_year FROM movie";
			conn.execute(sqlReq2, (err, result)=>{
				if(err){
					return callback(err);
				}
				else{
					return callback(null, result);
				}
			});
		},
		function(callback){
			let sqlReq3 = "SELECT id, position_name FROM position";
			conn.execute(sqlReq3, (err, result)=>{
				if(err){
					return callback(err);
				}
				else{
					return callback(null, result);
				}
			});
		}
	];
	//paneme päringud ehk funktsioonid paralleelselt käima, tulemuseks kolme päringu koond
	async.parallel(filmQueries, (err, results)=>{
		if(err){
			throw err;
		}
		else{
			console.log(results);
			res.render("addRelations", {personList: results[0], movieList: results[1], positionList: results[2]});
		}
	});
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

//uudiste osa eraldi marsruutide failiga
const newsRouter = require("./routes/newsRoutes");
app.use("/news", newsRouter);

app.get("/photoUpload",(req, res)=>{
	message="";
	res.render("photoUpload", {message:message});
});

app.post("/photoUpload", upload.single("photoInput"),(req, res)=>{
	if (!req.file || !req.body.altInput || !req.body.privacyInput) {
		message="Osa andmeid on puudu!";
        return res.render("photoUpload", {message:message});
    }
	console.log(req.body);
	console.log(req.file);
	//genereerime failinime
	const fileName="vp_"+Date.now()+".jpg";
	//nimetame üleslaetud faili ümber
	fs.rename(req.file.path, req.file.destination+fileName, (err)=>{
		 if (err) {
            console.log("Faili ümbernimetamine ebaõnnestus:", err);
			message= "Pilti ei õnnestunud üles laadida";
            return res.render("photoUpload", {message:message});
        }
	});
	sharp(req.file.destination+fileName).resize(800,600).jpeg({quality: 90}).toFile("./public/gallery/normal/"+fileName);
	sharp(req.file.destination+fileName).resize(100,100).jpeg({quality: 90}).toFile("./public/gallery/thumb/"+fileName);
	let sqlReq="INSERT INTO vp1photos (file_name, orig_name, alt_text, privacy, user_id) VALUES (?,?,?,?,?)";
	let userId = req.session.userId;
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId], (err,result)=>{
		if (err) {
                console.log("Andmebaasi sisestamine ebaõnnestus:", err);
				message="Pilti ei õnnestunud üles laadida";
                res.render("photoUpload", {message:message});
            } else {
				message="Pilt üles laetud!";
                res.render("photoUpload", {message:message});
		}
	});
});
	
app.get("/photogallery", (req, res) => {
    let sqlReq = "SELECT file_name, alt_text FROM vp1photos WHERE privacy = ? AND deleted IS NULL ORDER BY id DESC";
	const privacy = 3;
	let photoList = [];
    conn.query(sqlReq, [privacy], (err, result)=>{
		if(err){
			throw err;
		}
		else {
			console.log(result);
			for(let i = 0; i < result.length; i ++) {
				photoList.push({href: "/gallery/thumb/" + result[i].file_name, alt: result[i].alt_text, fileName: result[i].file_name});
			}
			res.render("photogallery", {listData: photoList});
		}
	});
});

app.get("/home", checkLogin, (req, res)=>{
	//console.log("Login, sees kasutaja: "+ req.session.userId);
	res.render("home", { firstName: req.session.firstName, lastName: req.session.lastName });
});

app.get("/signin",(req, res)=>{
	notice="";
	res.render("signin", {notice:notice});
});

app.post("/signin",(req, res)=>{
	let notice="";
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log("andmeid puudu");
		notice="Osa andmeid sisestamata";
        res.render("signin", {notice:notice});
	}
	else{
		let sqlReq = "SELECT id, password, first_name, last_name FROM vp1users WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
				console.log("Viga andmebaasi lugemisel"+err);
				notice="Tehniline viga, sisselogimine ebaõnnestus";
				res.render("signin", {notice:notice});
			}
			else{
				if(result[0] != null){
					//kasutaja on olemas, kontrollime parooli 
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, newResult)=>{
						if(err){
							notice="Kasutajatunnus ja/või parool on vale.";
							res.render("signin", {notice:notice});
						}
						else{
							//kas parool õige või vale 
							if(newResult){ //==true on default, pole vaja välja kirjutada
								//notice="Oled sisse logitud";
								//res.render("signin", {notice:notice});
								req.session.userId=result[0].id;
								req.session.firstName = result[0].first_name;
                                req.session.lastName = result[0].last_name; 
								res.redirect("/home");
							}
							else{
								notice="Kasutajatunnus ja/või parool on vale.";
								res.render("signin", {notice:notice});
							}
						}
					});//compare end
				}
				else{
					notice="Kasutajatunnus ja/või parool on vale.";
					res.render("signin", {notice:notice});
				}
			}
		});//conn.execute lõpp
	}
});

app.get("/logout",(req, res)=>{
	req.session.destroy();
	console.log("välja logitud");
	res.redirect("/");
});

app.listen(5109);