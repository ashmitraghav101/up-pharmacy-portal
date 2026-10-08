const express=require("express");
const session=require("express-session");
const fs=require("fs");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
const EMAIL=process.env.ADMIN_EMAIL||"admin@careplus.in";
const PASSWORD=process.env.ADMIN_PASSWORD||"ChangeMe123!";
const SECRET=process.env.SESSION_SECRET||"change-this-secret";

const FILE=path.join(__dirname,"data.json");
const read=()=>JSON.parse(fs.readFileSync(FILE,"utf8"));
const write=d=>fs.writeFileSync(FILE,JSON.stringify(d,null,2));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({secret:SECRET,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}}));
app.use(express.static(path.join(__dirname,"public")));

function auth(req,res,next){if(!req.session.admin)return res.status(401).json({error:"Unauthorized"});next();}
function date(){return new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});}

app.get("/api/public",(req,res)=>res.json(read()));

app.post("/api/login",(req,res)=>{
  const {email,password}=req.body||{};
  if(email!==EMAIL || password!==PASSWORD)return res.status(401).json({error:"Invalid credentials"});
  req.session.admin=true;res.json({ok:true});
});
app.get("/api/me",(req,res)=>res.json({authenticated:!!req.session.admin}));
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/admin/data",auth,(req,res)=>res.json(read()));

app.put("/api/admin/data",auth,(req,res)=>{
  const b=req.body||{};
  const required=["name","license","holder","address","pharmacist","registration"];
  if(required.some(k=>!String(b[k]||"").trim()))return res.status(400).json({error:"All pharmacy fields are required"});
  const d=read();
  d.pharmacy={name:b.name,license:b.license,holder:b.holder,address:b.address,pharmacist:b.pharmacist,registration:b.registration,updated_at:date()};
  d.medicines=Array.isArray(b.medicines)?b.medicines.map(m=>({
    name:m.name||"",generic_name:m.generic_name||"",manufacturer:m.manufacturer||"",
    stock:m.stock||"In Stock",purchase_price:m.purchase_price||"",consumer_price:m.consumer_price||""
  })).filter(m=>m.name):[];
  write(d);res.json({ok:true,data:d});
});

app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.listen(PORT,()=>console.log("UP Pharmacy portal running on port "+PORT));