import App from './App'
import Router, { gotoRoute } from './Router'
import splash from './views/partials/splash'
import { html, render } from 'lit-html'
import Toast from './Toast'

class Auth {
  constructor() {
    this.currentUser = {}
  }

  // -----------------------------
  // SIGN UP
  // -----------------------------
  async signUp(userData, fail = false) {
    let response

    try {
      // userData from <sl-form> is usually FormData here
      response = await fetch(`${App.apiBase}/user`, {
        method: 'POST',
        body: userData
      })
    } catch (err) {
      console.error('signUp network error', err)
      Toast.show('Problem reaching the server, please try again', 'error')
      if (typeof fail === 'function') fail()
      return
    }

    if (!response.ok) {
      let errJson = null
      try {
        errJson = await response.json()
      } catch (e) {}

      if (errJson) console.log('signUp error response', errJson)

      Toast.show(
        (errJson && errJson.message) ||
          `Problem creating account: ${response.status}`,
        'error'
      )

      if (typeof fail === 'function') fail()
      return
    }

    Toast.show('Account created, please sign in')
    gotoRoute('/signin')
  }

  // -----------------------------
  // SIGN IN
  // -----------------------------
  async signIn(userData, fail = false) {
    // SignIn view might pass FormData – normalise to a plain object
    let payload
    if (userData instanceof FormData) {
      payload = Object.fromEntries(userData.entries())
    } else {
      payload = userData || {}
    }

    let response
    try {
      response = await fetch(`${App.apiBase}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (err) {
      console.error('signIn network error', err)
      Toast.show('Problem reaching the server, please try again', 'error')
      if (typeof fail === 'function') fail()
      return
    }

    let data = null
    try {
      data = await response.json()
    } catch (e) {
      data = null
    }

    if (!response.ok) {
      const msg =
        (data && data.message) ||
        `Problem signing in: ${response.status}`
      Toast.show(msg, 'error')
      if (typeof fail === 'function') fail()
      return
    }

    // success
    Toast.show(`Welcome  ${data.user.firstName}`)

    localStorage.setItem('accessToken', data.accessToken)
    this.currentUser = data.user

    // re-init router
    Router.init()

    // first login vs returning user, and accessLevel
    if (data.user.newUser === true) {
      gotoRoute('/guide')
    } else {
      const level = Number(data.user.accessLevel)
      if (level === 2) {
        gotoRoute('/vendor')
      } else {
        gotoRoute('/buyrite')
      }
    }
  }

  // -----------------------------
  // CHECK TOKEN
  // -----------------------------
  async check(success) {
    render(splash, App.rootEl)

    if (!localStorage.accessToken) {
      Toast.show("Please sign in")
      gotoRoute('/signin')
      return
    }

    let response
    try {
      response = await fetch(`${App.apiBase}/auth/validate`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${localStorage.accessToken}`
        }
      })
    } catch (err) {
      console.error('token validate network error', err)
      Toast.show('Problem checking your session, please sign in again', 'error')
      localStorage.removeItem('accessToken')
      gotoRoute('/signin')
      return
    }

    if (!response.ok) {
      let err = null
      try {
        err = await response.json()
      } catch (e) {}

      if (err) console.log(err)

      localStorage.removeItem('accessToken')
      Toast.show("session expired, please sign in")
      gotoRoute('/signin')
      return
    }

    const data = await response.json()
    this.currentUser = data.user
    success()
  }

  // -----------------------------
  // SIGN OUT
  // -----------------------------
  signOut() {
    Toast.show("You are signed out")
    localStorage.removeItem('accessToken')
    gotoRoute('/signin')
    this.currentUser = null
  }
}

export default new Auth()
