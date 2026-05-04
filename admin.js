import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc, setDoc, query, collection, getDocs, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {/* بياناتك */};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/** أدمن رئيسي فقط */
const ADMINS = ["cabdulaahidayib11@gmail.com"];
window.googleAdminLogin = async function(){ try{await signInWithPopup(auth, provider);}catch(e){alert(e.message);}};
window.logoutAdmin = async function(){await signOut(auth);};

onAuthStateChanged(auth, (user)=>{
  if(user && ADMINS.includes(user.email)){
    document.getElementById("dashboard").classList.remove("hidden");
    showLeaderboard();
  }else{
    document.getElementById("dashboard").classList.add("hidden");
  }
});

/** تعديل نقاط ورصيد */
window.addPoints = async function(){
  const uid = document.getElementById("userUid").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const ref = doc(db,"users",uid); const snap = await getDoc(ref);
  if(!snap.exists()) return alert("User not found");
  await updateDoc(ref, {points: (snap.data().points||0) + amount});
  alert("Done");
};
window.removePoints = async function(){
  const uid = document.getElementById("userUid").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const ref = doc(db,"users",uid); const snap = await getDoc(ref);
  if(!snap.exists()) return alert("User not found");
  await updateDoc(ref, {points: Math.max(0,(snap.data().points||0) - amount)});
  alert("Done");
};
window.resetOpened = async function(){
  const uid = document.getElementById("userUid").value.trim();
  const ref = doc(db,"users",uid); const snap = await getDoc(ref);
  if(!snap.exists()) return alert("User not found");
  await updateDoc(ref, {opened: 0});
  alert("Done");
};

/** اجعل مستخدم أدمن (أضف الإيميل إلى لائحة الأدمن يدويًا في الكود!) */
window.setAdmin = async function(){
  // للحماية، قم دائمًا بتغيير ADMINS في الكود عند إضافة أدمن جديد!
  alert("أضف الإيميل للقائمة في الكود يدوياً للحماية.");
};

/** تعديل محدودات البكجات */
window.setPackLimit = async function(){
  const type = document.getElementById("limitPackType").value.trim();
  const newLimit = Number(document.getElementById("newLimit").value);
  if(!["basic","pro","elite"].includes(type)) return alert("نوع باكج غير صحيح.");
  await updateDoc(doc(db,"system","config"),{[`${type}Limit`]:newLimit});
  alert("تم تحديث الحد اليومي للباكج "+type);
};

/** تعديل نسب فرص البطاقات لأي باكج */
window.setPackProbability = async function(){
  const type = document.getElementById("probPackType").value.trim();
  const star = document.getElementById("probStarName").value.trim();
  const val = Number(document.getElementById("probValue").value);
  if(!["basic","pro","elite"].includes(type)) return alert("نوع باكج غير صحيح.");
  await updateDoc(doc(db,"system","config"),{[`${type}_${star}`]:val});
  alert("تم تحديث الفرصة للنجمة "+star+" في "+type);
};

/** لوحة الترتيب */
async function showLeaderboard(){
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("opened","desc"), limit(10));
  const snap = await getDocs(q);
  let html = '';
  snap.forEach(docu=>{
    const d = docu.data();
    html += `<li>${d.name||d.email} - ${d.opened} packs</li>`;
  });
  document.getElementById('adminLeader').innerHTML = html;
}