exports.checkLogin=function(req, res, next){
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
}