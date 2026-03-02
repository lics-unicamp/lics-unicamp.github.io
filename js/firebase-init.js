/* ============================================
   LICS Dashboard — Firebase Configuration
   ============================================
   
   INSTRUÇÕES:
   1. Acesse o Firebase Console (https://console.firebase.google.com)
   2. Vá em "Project Settings" > "General" > "Your apps" > Web app
   3. Copie as credenciais do SDK e substitua os placeholders abaixo
   4. Habilite Authentication (Google provider)
   5. Habilite Firestore Database
   
   ============================================ */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// TODO: Uncomment the lines below after adding the Firebase SDK scripts in your HTML
// firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth();
// const db = firebase.firestore();
