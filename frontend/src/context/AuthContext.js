import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 НОВАЯ ФУНКЦИЯ: обновить user из Firestore
  const refreshUser = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const freshUser = {
          uid: uid,
          email: auth.currentUser?.email,
          ...userData
        };
        setUser(freshUser);
        console.log('User refreshed:', freshUser);
        return freshUser;
      }
    } catch (err) {
      console.error('Ошибка обновления пользователя:', err);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ 
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'customer'
            });
          }
        } catch (err) {
          console.error('Ошибка загрузки пользователя:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const register = async (name, login, email, password, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      name,
      login: login.toLowerCase(),
      email: email.toLowerCase(),
      role,
      createdAt: new Date().toISOString(),
      blocked: false
    });

    setUser({ 
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name,
      login,
      role 
    });
    return firebaseUser;
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists() && userDoc.data().blocked) {
      await signOut(auth);
      throw new Error('Аккаунт заблокирован');
    }
    
    const userData = userDoc.exists() ? userDoc.data() : { role: 'customer' };
    setUser({ 
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      ...userData
    });
    return firebaseUser;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ===== ОДОБРЕНИЕ ВЛАДЕЛЬЦА =====
  const approveOwner = async (requestId, requestData) => {
    try {
      const requestRef = doc(db, 'ownerRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      if (!requestSnap.exists()) {
        throw new Error('Заявка не найдена.');
      }

      const usersQuery = query(collection(db, 'users'), where('email', '==', requestData.email.toLowerCase()));
      const usersSnap = await getDocs(usersQuery);
      
      let userId;

      if (!usersSnap.empty) {
        const existingUser = usersSnap.docs[0];
        userId = existingUser.id;
        
        await updateDoc(doc(db, 'users', userId), {
          role: 'owner',
          phone: requestData.phone || existingUser.data().phone,
          updatedAt: new Date().toISOString()
        });
        
      } else {
        if (!requestData.password) {
          throw new Error('У заявки отсутствует пароль.');
        }

        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            requestData.email, 
            requestData.password
          );
          userId = userCredential.user.uid;
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            throw new Error('Email уже используется. Попросите пользователя войти и подать заявку снова.');
          }
          throw authError;
        }

        await setDoc(doc(db, 'users', userId), {
          uid: userId,
          name: requestData.name,
          login: requestData.login ? requestData.login.toLowerCase() : requestData.email.split('@')[0],
          email: requestData.email.toLowerCase(),
          phone: requestData.phone,
          role: 'owner',
          createdAt: new Date().toISOString(),
          blocked: false
        });
      }

      // Создаём ресторан
      const restaurantRef = await addDoc(collection(db, 'restaurants'), {
        name: requestData.restaurantName,
        address: requestData.restaurantAddress,
        email: requestData.email,
        phone: requestData.phone,
        ownerId: userId,
        ownerName: requestData.name,
        ownerEmail: requestData.email,
        status: 'active',
        createdAt: Timestamp.now()
      });

      // Добавляем restaurantId в профиль пользователя
      await updateDoc(doc(db, 'users', userId), {
        restaurantId: restaurantRef.id,
        restaurantName: requestData.restaurantName,
        updatedAt: new Date().toISOString()
      });

      // 🔥 ЕСЛИ ПОЛЬЗОВАТЕЛЬ СЕЙЧАС ЗАЛОГИНЕН — ОБНОВЛЯЕМ ЕГО В КОНТЕКСТЕ
      if (user && user.uid === userId) {
        await refreshUser(userId);
      }

      await deleteDoc(requestRef);
      
      return { success: true, userId, restaurantId: restaurantRef.id };
    } catch (error) {
      console.error('Ошибка одобрения:', error);
      throw error;
    }
  };

  const rejectOwner = async (requestId) => {
    const requestRef = doc(db, 'ownerRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) {
      throw new Error('Заявка не найдена');
    }
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    register,
    login,
    logout,
    approveOwner,
    rejectOwner,
    refreshUser // 🔥 экспортируем
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;