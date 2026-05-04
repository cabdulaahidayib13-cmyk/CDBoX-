import {PACKS} from "./config.js";
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, increment,
  collection, getDocs, query, orderBy, limit, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {/* ضع بيانات مشروعك من فايربيز هنا */};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const params = new URLSearchParams(window.location.search);
if(params.get("ref")) window.localStorage.setItem("referrer", params.get("ref"));

window.googleLogin = async function(){
  try{ await signInWithPopup(auth, provider); }
  catch(e){ alert(e.message); }
};
window.logoutUser = async function(){ await signOut(auth); };

function renderPacks(){
  const packsArea = document.getElementById("packsArea");
  packsArea.innerHTML = "";
  PACKS.forEach((pack,i)=>{
    let probBtn = `<button onclick="showProbabilities(${i})">فرص البطاقات</button>`;
    packsArea.innerHTML += `
      <div class="card">
        <h3>${pack.name}</h3>
        <p>${pack.cost} Points</p>
        <button onclick="openPack(${i})">Open</button>
        ${probBtn}
      </div>
    `;
  });
}
window.showProbabilities = function(idx){
  const pack = PACKS[idx];
  let html = `<tr><th>Card</th><th>Chance</th></tr>`;
  pack.probabilities.forEach(r=>{
    html += `<tr><td>${r.stars}</td><td>${r.percent}%</td></tr>`;
  });
  document.getElementById("probTable").innerHTML = html;
  document.getElementById("probModal").classList.remove("hidden");
};
window.closeProbModal = function(){
  document.getElementById("probModal").classList.add("hidden");
};

window.openPack = async function(idx){
  const user = auth.currentUser;
  if(!user) return alert("سجل الدخول أولاً!");
  const pack = PACKS[idx];
  let statDoc = doc(db, "packsStats", pack.code);
  let stat = await getDoc(statDoc);
  const today = new Date().toISOString().substr(0,10);
  if(!stat.exists() || stat.data().date !== today){
    await setDoc(statDoc,{date: today, count: 0});
    stat = await getDoc(statDoc);
  }
  if(stat.data().count >= pack.dailyLimit)
    return alert("تم الوصول للحد اليومي لهذا البكج!");
  const uref = doc(db, "users", user.uid); let snap = await getDoc(uref);
  const data = snap.data();
  if(data.points < pack.cost) return alert("نقاطك غير كافية!");
  await updateDoc(uref, {
    points: data.points - pack.cost,
    opened: (data.opened||0) + 1
  });
  await updateDoc(statDoc,{count: stat.data().count+1});
  startPackAnimation(pack, idx, user.uid);
  if((data.opened||0)===0) rewardReferrer(user.uid,pack.cost);
};

function getReward(pack){
  let rand = Math.random() * 100, curr = 0;
  for(const r of pack.probabilities){
    curr += r.percent;
    if(rand < curr) return r;
  }
  return pack.probabilities[pack.probabilities.length-1];
}

async function addCardToCollection(user, reward) {
  const cardId = reward.card; 
  const cardRef = doc(db, "users", user.uid, "cards", cardId);
  const cardSnap = await getDoc(cardRef);
  if (cardSnap.exists()) {
    await updateDoc(cardRef, { 
      count: increment(1),
      stars: reward.stars,
      image: reward.card
    });
  } else {
    await setDoc(cardRef, {
      count: 1,
      stars: reward.stars,
      image: reward.card
    });
  }
}

function startPackAnimation(pack, idx, uid){
  const modal = document.getElementById("packModal");
  const card = document.getElementById("spinCard");
  const text = document.getElementById("rewardText");
  modal.classList.remove("hidden");
  card.classList.add("spin"); text.innerText="...";
  card.innerHTML = "🎴";
  setTimeout(async () => {
    card.classList.remove("spin");
    const reward = getReward(pack);
    card.innerHTML = `<img src="${reward.card}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`;
    text.innerText = reward.stars;
    // المؤثرات
    try{ new Audio('sounds/open.mp3').play(); }catch{}
    if('vibrate' in navigator) navigator.vibrate(120);
    // confetti (لو ربطت المكتبة)
    const user = auth.currentUser;
    if (user) await addCardToCollection(user, reward);
    await showMyCollection(user.uid);
  }, 2000);
}
window.closePackModal = ()=>document.getElementById("packModal").classList.add("hidden");

async function rewardReferrer(userUid, amount){
  const userRef = doc(db,"users", userUid);
  const snap = await getDoc(userRef); if(!snap.exists()) return;
  const data = snap.data();
  if(data.referrer){
    const refRef = doc(db, "users", data.referrer);
    const refSnap = await getDoc(refRef);
    if(refSnap.exists()){
      const refData = refSnap.data();
      await updateDoc(refRef, {earnings: (refData.earnings||0)+amount*0.1});
    }
  }
}

window.copyRef = function(){
  const ref = document.getElementById("refLink");
  ref.select(); document.execCommand("copy");
  alert("تم نسخ الرابط!");
};
window.shareWin = function(){
  window.open('https://wa.me/?text=جرب%20حظك%20في%20CD%20BOX:https://رابط_موقعك','_blank');
};
window.shareOnTwitter = function(){
  window.open('https://twitter.com/intent/tweet?text=جرب%20حظك%20في%20CD%20BOX https://رابط_موقعك','_blank');
};

window.spinWheel = function(){
  const prizes = ["20 نقاط","100 نقاط","بكج مجاني","حظ أوفر"];
  const idx = Math.floor(Math.random()*prizes.length);
  document.getElementById("wheelResult").innerText = "ربحت: "+prizes[idx];
};

window.claimDailyBonus = async function(){
  const user = auth.currentUser;
  if(!user) return;
  let ref = doc(db,"users",user.uid); let snap=await getDoc(ref);
  let data = snap.data();
  const today = new Date().toDateString();
  if(data.lastDailyReward===today) return alert("أخذت مكافأتك اليوم!");
  await updateDoc(ref, {points:(data.points||0)+20, lastDailyReward: today});
  alert("✨ حصلت على 20 نقطة مكافأة يومية!");
  updateDailyBonusBtn(user.uid);
};
async function updateDailyBonusBtn(uid){
  const ref = doc(db,"users",uid); let snap=await getDoc(ref);
  let data = snap.data();
  const btn = document.getElementById("dailyBonusBtn");
  if(data.lastDailyReward===new Date().toDateString()) btn.disabled=true;
  else btn.disabled=false;
}
onAuthStateChanged(auth, async (user)=>{
  if(user){
    let referrer = window.localStorage.getItem("referrer") || "";
    let ref = doc(db, "users", user.uid);
    let info = await getDoc(ref);
    if(!info.exists()){
      await setDoc(ref,{
        email: user.email, name: user.displayName,
        photo: user.photoURL, points: 100, opened: 0, referrer, earnings: 0, badges:{}, lastDailyReward:""
      });
      document.getElementById("bonusMessage").innerHTML="🎁 مبروك! حصلت على 100 نقطة و3 باكجات مجانية!";
    } else {
      document.getElementById("bonusMessage").innerHTML = "";
    }
    document.getElementById("userEmail").innerText = user.email;
    document.getElementById("refLink").value = location.origin + "/?ref=" + user.uid;
    countMyReferred(user.uid);
    updateDailyBonusBtn(user.uid);
    showLeaderboard();
    showBadges(user.uid);
    showMyCollection(user.uid);
  }else{
    document.getElementById("userEmail").innerText = "Guest";
    document.getElementById("myCollection").innerHTML = ""; 
  }
  renderPacks();
});
async function countMyReferred(uid){
  const usersRef = collection(db,"users");
  const q = query(usersRef, where("referrer","==",uid));
  const snap = await getDocs(q);
  document.getElementById("refCount").innerText = snap.size;
  let q2 = query(usersRef, where("referrer","==",uid), where("deposited","==",true), where("depositAmount",">=",10));
  let ss = await getDocs(q2);
  document.getElementById("refMilestoneCount").innerText = ss.size + " / 10";
}
async function showLeaderboard(){
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("opened","desc"), limit(10));
  const snap = await getDocs(q);
  let html = '';
  snap.forEach(docu=>{
    const d = docu.data();
    html += `<li>${d.name||d.email} - ${d.opened} packs</li>`;
  });
  document.getElementById('leaderboard').innerHTML = html;
}
async function showBadges(uid){
  const ref = doc(db,"users",uid); let snap=await getDoc(ref);
  let data = snap.data();
  let list = document.getElementById("badges"); list.innerHTML = "";
  if((data.opened||0)>=10) list.innerHTML += `<li>🎖️ فتحت أكثر من 10 بكجات!</li>`;
}
async function showMyCollection(uid){
  const cardsCol = collection(db, "users", uid, "cards");
  const snap = await getDocs(cardsCol);
  let html = '';
  snap.forEach(cardDoc=>{
    const data = cardDoc.data();
    html += `<div class='my-card'>
      <img src='${data.image}' alt='card'>
      <div>${data.stars}</div>
      <div>×${data.count}</div>
    </div>`;
  });
  document.getElementById("myCollection").innerHTML = html;
}