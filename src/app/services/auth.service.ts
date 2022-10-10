import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';

interface Credentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth) {}

  currentUser() {
    return this.auth.currentUser;
  }

  register(credentials: Credentials) {
    return createUserWithEmailAndPassword(this.auth, credentials.email, credentials.password);
  }

  login(credentials: Credentials) {
    return signInWithEmailAndPassword(this.auth, credentials.email, credentials.password);
  }

  logout() {
    return signOut(this.auth);
  }
}
