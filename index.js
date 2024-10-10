const express=require("express");
const dtEt=require("./dateTime.js");
const fs=require("fs");
const dbInfo=require("../../vp2024config");
const mysql=require("mysql2");
//päringu lahtiharutamiseks POST
const bodyparser=require("body-parser");


const app=express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended: false}));

//loon andmebaasiühenduse
const conn=mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: "if24_triinu_kl"
});


app.get("/",(req, res)=>{
	//res.send("Express läks täiesti käima!");
	res.render("index.ejs");
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
	console.log(req.body);
	fs.open("public/textFiles/visitlog.txt", "a", (err, file)=>{
		if(err){
			throw err
		}
		else{
			fs.appendFile("public/textFiles/visitlog.txt", req.body.firstNameInput+" "+req.body.lastNameInput+";",(err)=>{
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
			persons=sqlres;
			res.render("tegelased", {persons: persons});
		}
	});
	//res.render("tegelased");
});
	
app.listen(5109);