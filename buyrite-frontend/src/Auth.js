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
    // userData from <sl-form> will be FormData (good for /user with multer)
    const response = await fetch(`${App.apiBase}/user`, {
      method: 'POST',
      body: userData
    })

    if (!response.ok) {
      let err = null
      try {
        err = await response.json()
      } catch (e) {
        // ignore JSON parse errors
      }
      if (err) console.log(err)

      Toast.show(
        (err && err.message) ||
          `Problem creating account: ${response.status}`,
        'error'
      )

      if (typeof fail === 'function') fail()
      return
    }

    // sign up success
    Toast.show('Account created, please sign in')
    gotoRoute('/signin')
  }

  // -----------------------------
  // SIGN IN
  // -----------------------------
  async signIn(userData, fail = false) {
    // userData from <sl-form> is likely FormData → convert to plain object
    let payload
    if (userData instanceof FormData) {
      payload = Object.fromEntries(userData.entries())
    } else {
      payload = userData || {}
    }

    const response = await fetch(`${App.apiBase}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    // Read the body ONCE
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

    // sign in success
    Toast.show(`Welcome  ${data.user.firstName}`)

    // save access token (jwt) to local storage
    localStorage.setItem('accessToken', data.accessToken)

        // set current user
    this.currentUser = data.user

    // re-init router
    Router.init()

    // redirect according to newUser flag + accessLevel
    // accessLevel: 1 = shopper / consumer, 2 = vendor
    if (data.user.newUser === true) {
      // first-time users always see the guide
      gotoRoute('/guide')
    } else {
      // returning users go straight to their home screen
      const level = Number(data.user.accessLevel)
      if (level === 2) {
        // vendor
        gotoRoute('/vendor')
      } else {
        // shopper / consumer
        gotoRoute('/buyrite')
      }
    }

  }

  // -----------------------------
  // CHECK TOKEN
  // -----------------------------
  async check(success) {
    // show splash screen while loading ...   
    render(splash, App.rootEl)

    // check local token is there
    if (!localStorage.accessToken) {
      Toast.show("Please sign in")
      gotoRoute('/signin')
      return
    }

    // token must exist - validate token via the backend
    const response = await fetch(`${App.apiBase}/auth/validate`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${localStorage.accessToken}`
      }
    })

    // if response not ok
    if (!response.ok) {
      let err = null
      try {
        err = await response.json()
      } catch (e) {
        // ignore
      }
      if (err) console.log(err)

      // delete local token
      localStorage.removeItem('accessToken')
      Toast.show("session expired, please sign in")
      gotoRoute('/signin')
      return
    }

    // token is valid!
    const data = await response.json()
    // set currentUser obj
    this.currentUser = data.user
    // run success callback
    success()
  }

  // -----------------------------
  // SIGN OUT
  // -----------------------------
  signOut() {
    Toast.show("You are signed out")
    // delete local token
    localStorage.removeItem('accessToken')
    // redirect to sign in    
    gotoRoute('/signin')
    // unset currentUser
    this.currentUser = null
  }
}

export default new Auth()
