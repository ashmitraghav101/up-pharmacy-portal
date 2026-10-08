const express=require("express");
const session=require("express-session");
const bcrypt=require("bcryptjs");
const Database=require("better-sqlite3");
const path=require("path");

const app=express();
const PORT=process.env.PORT||3000;
const SESSION_SECRET=process.env.SESSION_SECRET||"CHANGE_THIS_SECRET_IN_PRODUCTION";
const ADMIN_EMAIL=process.env.ADMIN_EMAIL||"admin@careplus.in";
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"ChangeMe123!";

const db=new Database(process.env.DB_PATH||"pharmacy.db");
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS pharmacy(
 id INTEGER PRIMARY KEY CHECK(id=1),
 name TEXT NOT NULL, license TEXT NOT NULL, holder TEXT NOT NULL,
 address TEXT NOT NULL, pharmacist TEXT NOT NULL, registration TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS medicines(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 pharmacy_id INTEGER NOT NULL DEFAULT 1,
 name TEXT NOT NULL, generic_name TEXT NOT NULL, manufacturer TEXT NOT NULL,
 stock TEXT NOT NULL, purchase_price TEXT NOT NULL, consumer_price TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 FOREIGN KEY(pharmacy_id) REFERENCES pharmacy(id)
);
`);

const now=()=>new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
if(!db.prepare("SELECT id FROM pharmacy WHERE id=1").get()){
 db.prepare(`INSERT INTO pharmacy VALUES(1,?,?,?,?,?,?,?)`).run(
 "CarePlus Pharmacy","UP/AL/20B/12345","Rajesh Kumar",
 "Main Road, Aligarh, Uttar Pradesh","Amit Sharma","UPP/PH/98765",now()
 );
 const ins=db.prepare(`INSERT INTO medicines(pharmacy_id,name,generic_name,manufacturer,stock,purchase_price,consumer_price,updated_at) VALUES(1,?,?,?,?,?,?,?)`);
 for(const m of [
 ["Paracetamol 500 mg","Paracetamol","ABC Pharma Ltd.","In Stock","₹8.00","₹10.00"],
 ["Amoxicillin 500 mg","Amoxicillin","MediCare Labs","In Stock","₹42.00","₹48.00"],
 ["Pantoprazole 40 mg","Pantoprazole","HealthFirst Ltd.","Low Stock","₹18.00","₹22.00"]
 ]) ins.run(...m,now());
}

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({secret:SESSION_SECRET,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}}));
app.use(express.static(path.join(__dirname,"public")));

function requireAdmin(req,res,next){if(!req.session.admin)return res.status(401).json({error:"Unauthorized"});next();}
function pharmacyData(){
 const p=db.prepare("SELECT * FROM pharmacy WHERE id=1").get();
 p.medicines=db.prepare("SELECT id,name,generic_name,generic_name AS generic,manufacturer,stock,purchase_price,consumer_price,updated_at FROM medicines WHERE pharmacy_id=1 ORDER BY id").all();
 return p;
}

app.get("/api/public",(req,res)=>res.json(pharmacyData()));

app.post("/api/login",async(req,res)=>{
 const {email,password}=req.body||{};
 const okEmail=email===ADMIN_EMAIL;
 const okPass=await bcrypt.compare(password||"",await bcrypt.hash(ADMIN_PASSWORD,10));
 if(!okEmail||!okPass)return res.status(401).json({error:"Invalid credentials"});
 req.session.admin=true;res.json({ok:true});
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/me",(req,res)=>res.json({authenticated:!!req.session.admin}));

app.get("/api/admin/data",requireAdmin,(req,res)=>res.json(pharmacyData()));

app.put("/api/admin/data",requireAdmin,(req,res)=>{
 const b=req.body||{};
 const required=["name","license","holder","address","pharmacist","registration"];
 if(required.some(k=>!String(b[k]||"").trim()))return res.status(400).json({error:"All pharmacy fields are required"});
 const date=now();
 const tx=db.transaction(()=>{
   db.prepare(`UPDATE pharmacy SET name=?,license=?,holder=?,address=?,pharmacist=?,registration=?,updated_at=? WHERE id=1`)
    .run(b.name,b.license,b.holder,b.address,b.pharmacist,b.registration,date);
   db.prepare("DELETE FROM medicines WHERE pharmacy_id=1").run();
   const ins=db.prepare(`INSERT INTO medicines(pharmacy_id,name,generic_name,manufacturer,stock,purchase_price,consumer_price,updated_at) VALUES(1,?,?,?,?,?,?,?)`);
   for(const m of (Array.isArray(b.medicines)?b.medicines:[])){
     if(!m.name||!m.generic_name||!m.manufacturer)continue;
     ins.run(1,m.name,m.generic_name,m.manufacturer,m.stock||"In Stock",m.purchase_price||"",m.consumer_price||"",date);
   }
 });
 tx();res.json({ok:true,data:pharmacyData()});
});

app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.listen(PORT,()=>console.log(`Pharmacy portal running on port ${PORT}`));