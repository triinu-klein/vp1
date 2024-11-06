
const dayNamesEt=["pühapäev","esmaspäev","teisipäev","kolmapäev","neljapäev","reede"];
const monthNamesEt=["jaanuar","veebruar","märts","aprill","mai","juuni","juuli","august","september","oktoober","november","detsember"];

const dateEt=function(){
	let timeNow=new Date();
	//let specDate=new Date("12-27-1939");
	let dateNow=timeNow.getDate();
	let monthNow=timeNow.getMonth();
	let yearNow=timeNow.getFullYear();
	let dateNowEt=dateNow+". "+monthNamesEt[monthNow]+" "+yearNow;
	return dateNowEt;
} 

const givenDate=function(gDate){
	let specDate=new Date(gDate);
	return specDate.getDate()+". "+monthNamesEt[specDate.getMonth()]+" "+specDate.getFullYear();
}

//tänase seos semestri algusega <p><%=console.log(semesterDates);%></p>
const compareDates=function(gDate){
	daysToSemester = "teadmata";
	let semesterStartDate=new Date(gDate);
	let dateToday=new Date();
	let difference= Math.floor((dateToday.getTime() - semesterStartDate.getTime())/(1000 * 3600 * 24));
	if(dateToday==semesterStartDate){
		daysToSemester=("Semester algab täna");
	} else if(dateToday>semesterStartDate){
		daysToSemester="Semestri algusest on möödas "+difference+" päeva";
	}else{
		daysToSemester="Semestri alguseni on "+Math.abs(difference)+" päeva";
	}
	//console.log(daysToSemester);
	return daysToSemester;
}

const timeEE=function(){
	let timeNow=new Date();
	let hourNow=timeNow.getHours();
	let minuteNow=timeNow.getMinutes();
	let secondNow=timeNow.getSeconds();
	return hourNow+":"+minuteNow+":"+secondNow;
} 
const weekDay = function(){
	let timeNow = new Date();
	let dayNow = timeNow.getDay();
	return dayNamesEt[dayNow];
} 

const partOfDay=function(){
	let timeNow=new Date();
	//esmaspaev
	if (timeNow.getDay()==1 && timeNow.getHours()>=14 && timeNow.getHours()<20){
		dayPart="kooliaeg";
	}
	if (timeNow.getDay()==1 && (timeNow.getHours()>=20 && timeNow.getHours()<23)||(timeNow.getHours()>=10 && timeNow.getHours()<14)){
		dayPart="kooliväline aeg";
	}
	if (timeNow.getDay()==1 && timeNow.getHours()>=23 || timeNow.getHours()<10){
		dayPart="uneaeg";
	}
	//teisipaev
	if (timeNow.getDay()==2 && timeNow.getHours()>=8 && timeNow.getHours()<18){
		dayPart="kooliaeg";
	}
	if (timeNow.getDay()==2 && (timeNow.getHours()>=18 && timeNow.getHours()<23)||(timeNow.getHours()>=6 && timeNow.getHours()<8)){
		dayPart="kooliväline aeg";
	}
	if (timeNow.getDay()==2 && timeNow.getHours()>=23 || timeNow.getHours()<6){
		dayPart="uneaeg";
	}
	//kolmapaev
	if (timeNow.getDay()==3 && timeNow.getHours()>=12 && timeNow.getHours()<18){
		dayPart="kooliaeg";
	}
	if (timeNow.getDay()==3 && (timeNow.getHours()>=18 && timeNow.getHours()<23)||(timeNow.getHours()>=10 && timeNow.getHours()<12)){
		dayPart="kooliväline aeg";
	}
	if (timeNow.getDay()==3 && timeNow.getHours()>=23 || timeNow.getHours()<10){
		dayPart="uneaeg";
	}
	//neljapäev
	if (timeNow.getDay()==4 && timeNow.getHours()>=12 && timeNow.getHours()<16){
		dayPart="kooliaeg";
	}
	if (timeNow.getDay()==4 && (timeNow.getHours()>=16 && timeNow.getHours()<23)||(timeNow.getHours()>=10 && timeNow.getHours()<12)){
		dayPart="kooliväline aeg";
	}
	if (timeNow.getDay()==4 && timeNow.getHours()>=23 || timeNow.getHours()<10){
		dayPart="uneaeg";
	}
	//reede
	if (timeNow.getDay()==5 && timeNow.getHours()>=10 && timeNow.getHours()<12){
		dayPart="kooliaeg";
	}
	if (timeNow.getDay()==5 && (timeNow.getHours()>=12 && timeNow.getHours()<23)||(timeNow.getHours()>=8 && timeNow.getHours()<10)){
		dayPart="kooliväline aeg";
	}
	if (timeNow.getDay()==5 && timeNow.getHours()>=23 || timeNow.getHours()<8){
		dayPart="uneaeg";
	}
	//laup ja pühap
	if (timeNow.getDay()==0 || timeNow.getDay()==6){
		dayPart="nädalavahetus";
	}


	return dayPart;
}
		

module.exports={monthsEt:monthNamesEt,daysEt:dayNamesEt,dateEt:dateEt,time:timeEE,givenDate:givenDate,compareDates:compareDates,weekday:weekDay,partOfDay:partOfDay};




