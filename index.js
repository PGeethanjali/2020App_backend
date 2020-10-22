const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const router = express.Router();
var cors = require('cors');
const  jwt  =  require('jsonwebtoken');

const SECRET_KEY = "secretkey23456";

router.use(cors());
router.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const debug = require('debug')('firestore-snippets-node');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceacckey.json');
const { count, error } = require('console');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const Ref = db.collection('upload');
const bookRef = db.collection('books');
const movieRef = db.collection('movies');
const userRef = db.collection('users');

router.post('/login',(req,res)=>{

  try{
 
  login(req.body).then(result =>{
    res.send(result);
  });
  }
  catch{
    console.log(e)
  }
});
router.post('/signup',(req,res)=>{

  try{

  signup(req.body).then(result =>{
    res.send(result);
  });
  }
  catch{
    console.log(e)
  }
});
router.get('/get_book/:id', (req,res) => {
    
    try{
        let userid = req.params.id;
        getbooks(userid).then(result =>{
          res.send(result);
        });
        
        }
        catch(e){
            console.log(e)
        }
   
});
router.get('/get_movie/:id', (req,res) => {
    
  try{
      let userid = req.params.id;
      getmovies(userid).then(result =>{
        res.send(result);
      });
      
      }
      catch(e){
          console.log(e)
      }
 
});
router.get('/get_feed', (req,res) => {
    
  try{
  
      getfeed().then(result =>{
        res.send(result);
      });
      
      }
      catch(e){
          console.log(e)
      }
 
});
router.get('/get_leaderboard', (req,res) => {
    
  try{
  
      getleaderboard().then(result =>{
        res.send(result);
      });
      
      }
      catch(e){
          console.log(e)
      }
 
});
router.post('/upload_book',(req,res) =>{
  try{

   postbookdata(req.body).then(result =>{
    console.log(result);
    res.send(result);
  });

  }
  catch(e)
  {
    console.log(e);
  }
});
router.post('/upload_movie',(req,res) =>{
  try{
   postmoviedata(req.body).then(result =>{
    console.log(result);
    res.send(result);
  });

  }
  catch(e)
  {
    console.log(e);
  }
});
  async function login(result){

    var Response;
    const obj = result;
    const snapshot = await userRef.where('username','==',obj.username).where('password','==',obj.password).limit(1).get();
    if(snapshot.empty)
    {
      Response = {"status":400,"message":"Invalid User"};
    }
    else{
      snapshot.forEach((doc) => {
        const expiresIn = 24 * 60 * 60;
        const accessToken = jwt.sign({ id: doc.data().userid }, SECRET_KEY, {
            expiresIn: expiresIn
        });
       
       Response = {"status":200,"message":"Success","data":{ "user":  doc.data(), "token": accessToken, "expires_in": expiresIn }};
          
     
      });
    }
  
    return Response;
  }
  async function signup(result)
  {
    try{
      var Response;
    const snapshot = await userRef.get();
    let total_count = 0;
    snapshot.forEach(doc => {
      total_count++;
    });
    total_count++;
    const obj = result;
	  const userData = {
		username: obj.username,
    password: obj.password,
    email: obj.email,
    userid:total_count.toString()
    };
  
    await userRef.doc().set(userData).then(()=>{
      Response = {"statuscode":200,"message":"Success"};
    });
  }
  catch(err)
  {
    Response = {"statuscode":400,"message":err};
  }
  return Response;
  }
  async function getbooks(userid) {
    try{
      var Response;
    var data = [];
  
    const snapshot1 = await bookRef.where('userid','==',userid).get();
    if (snapshot1.empty) {
      Response = {"statuscode":400,"message":'No matching documents'};
    }
    else{
    snapshot1.forEach((doc) => {
      data.push(doc.data())
    });
    }
    Response = {"statuscode":200,"data":data};
  }
  catch(err)
  {
    Response = {"statuscode":400,"message":err};
  }
    return Response;
  }
  async function getmovies(userid) {
    try{
      var Response;
    var data = [];
    const snapshot = await movieRef.where('userid','==',userid).get();
      if (snapshot.empty) {
        Response = {"statuscode":400,"message":'No matching documents'};
      }
      else{
      snapshot.forEach((doc) => {
        data.push(doc.data())
      });
      Response = {"statuscode":200,"data":data};
      }
     
    }
    catch(err)
    {
      Response = {"statuscode":400,"message":err};

    }
   
    return Response;
  }
  async function getfeed(db) {
    try{
    var Response;
    let data = [];
    const snapshot = await Ref.get();
    snapshot.forEach((doc) => {
      data.push(doc.data())
    });
    for(var i=0;i<data.length;i++)
    {
      const name = await getusername(data[i].userid);
      data[i].username = name.data;
    }
    Response = {"statuscode":200,"data":data};
  }
  catch(err)
  {
    Response = {"statuscode":400,"message":err};
  }
    return Response;
   
  }
  async function getusername(userid)
  {
    try{
      var Response;
    let id = userid.toString();
    let data = [];
    const snapshot = await userRef.where('userid','==',id).get();
    if (snapshot.empty) {
      Response = {"statuscode":400,"message":'No matching documents'};
      console.log('No matching documents');
      return;
    }
    else{
    snapshot.forEach((doc) => {
      data.push(doc.data())
    });
      }
    
      Response = {"statuscode":200,"data":data[0].username};
    }
    catch(err)
    {
      Response = {"statuscode":400,"message":err};
    }
 
    return Response;
  }
  async function getleaderboard(db) {
    try{
      var Response;
      let d = [];
    let mdata = [];
    let bdata = [];
    let movie_data=[];
    let book_data = [];
    let count = [];
    let moviemap = new Map();
    let bookmap = new Map();
    const snapshot = await Ref.get();
    snapshot.forEach((doc) => {

      if(doc.data().type == "movie")
      {
        movie_data.push(doc.data());
      }
      else if (doc.data().type == "book")
      {
         book_data.push(doc.data());
      }
    });

    movie_data.forEach(m_data => {
        if(moviemap.has(m_data.userid)){
            let a= moviemap.get(m_data.userid);
            a++;
            moviemap.set(m_data.userid,a);
        }
        else{
          moviemap.set(m_data.userid, 1);
        }
    });
   
    book_data.forEach(b_data => {
        if(bookmap.has(b_data.userid)){
            let a= bookmap.get(b_data.userid);
            a++;
            bookmap.set(b_data.userid,a);
        }
        else{
          bookmap.set(b_data.userid, 1);
        }

    });
 
  const obj = Object.fromEntries(moviemap);
  for (const [k, v] of moviemap.entries()) {
    
    const name = await getusername(k);
    mdata.push({"username":name.data,"mcount":v});
  }
  for (const [k, v] of bookmap.entries()) {
    
    const name = await getusername(k);
    bdata.push({"username":name.data,"bcount":v});
  }
  for(var i=0;i<bdata.length;i++){
    for(var j=0;j<mdata.length;j++){
    if(bdata[i].username == mdata[j].username){
      bdata[i].mcount = mdata[j].mcount;
    }
  }
}

for(var i=0;i<mdata.length;i++){
    noMatch = true;
    for(var j=0;j<bdata.length;j++){
    if(mdata[i].username == bdata[j].username){
      mdata[i].bcount = bdata[j].bcount;
      noMatch = false;
    }
  }
  if(noMatch){bdata.push(mdata[i]);}
}

   Response = {"statuscode":200,"data":bdata};
  }
  catch(err){
    Response = {"statuscode":400,"message":err};
  }
    return Response;
  }

  async function postbookdata(result)
  {
    try{
    var Response;
    const obj = result;
	  const uploadbookData = {
		name: obj.name,
    author: obj.author,
    genre: obj.genre,
    rating: obj.rating,
    type:'book',
    userid:obj.userid
    };
    const bookdata={
      name: obj.name,
      author: obj.author,
      genre: obj.genre,
      userid:obj.userid
    };

    await Ref.doc().set(uploadbookData).then(()=>{
      Response = {"statuscode":200};
    }).catch(err=>{
      Response = {"statuscode":400,"message":err};
     });
     await bookRef.doc().set(bookdata).then(()=>{
      Response = {"statuscode":200};
    }).catch(err=>{
      Response = {"statuscode":400,"message":err};
     });
    }
    catch(err)
    {
      Response = {"statuscode":400,"message":err};
    }
     return Response;
    
  }
  async function postmoviedata(result)
  {
    try{
    var Response;
    const obj = result;
	  const uploadmovieData = {
		name: obj.name,
    director: obj.director, 
    genre: obj.genre,
    rating: obj.rating,
    type:'movie',
    userid:obj.userid
    };
    const moviedata = {
      name: obj.name,
      director: obj.director, 
      genre: obj.genre,
      userid:obj.userid
    };
     await Ref.doc().set(uploadmovieData).then(()=>{
      Response = {"statuscode":200};
     
     }).catch(err=>{
      Response = {"statuscode":400};
     });
     await movieRef.doc().set(moviedata).then(()=>{
      Response = {"statuscode":200};
    }).catch(err=>{
      Response = {"statuscode":400};
     });
    }
    catch(err)
    {
      Response = {"statuscode":400};
    }
     return Response;

  }
  /*async function quickstartListen(db) {
    // [START quickstart_listen]
    const snapshot = await bookRef.get();
    snapshot.forEach((doc) => {
      console.log(doc.id, '=>', doc.data());
    });
    // [END quickstart_listen]
  }*/
/*async function exampleData(db) {
await bookRef.doc('b1').set({
  name: '2 states',author: 'Chetan Bhagat', rating : 5
});
await bookRef.doc('b2').set({
    name: 'Harry Pott.
    er',author: 'JK Rowling', rating : 5
});
await bookRef.doc('b3').set({
    name: 'Halh Girlfriend',author: 'Chetan Bhagat', rating : 4
});
await bookRef.doc('b4').set({
    name: 'Secret Seven',author: 'Chetan Bhagat', rating : 5
});

}*/


/*getDialogue().then(result =>{
	console.log(result);
	const obj = result;
	const quoteData = {
		quote: obj.quote,
		author: obj.author
	};
	return db.collection('sampleData').doc('K5NJIGtt7cwv9mzrswd2')
	.set(quoteData).then(() => 
	console.log('new Dialogue written to database'));
});

function getDialogue(){
	return new Promise(function(resolve, reject) {
	resolve({
	"quote":"I'm Batman",
	"author":"Batman"
	});
})
}*/
app.use('/', router);
app.listen(process.env.port || 3030);

console.log('Running at Port 3030');