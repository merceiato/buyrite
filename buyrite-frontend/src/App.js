// Main app bootstrap – sets API base, checks auth and starts router.
import Router from './Router'
import Auth from './Auth'
import Toast from './Toast'


class App {
  constructor(){
    this.name = "Buyrite"
    this.version = "1.0.0"
    this.apiBase = 'http://ec2-54-253-51-41.ap-southeast-2.compute.amazonaws.com:3000'
    this.rootEl = document.getElementById("root")
    this.version = "1.0.0"
  }
  
  init() { 
    console.log("App.init")
    
    // Toast init
    Toast.init()   
    
    // Authentication check    
    Auth.check(() => {
      // authenticated! init Router
      Router.init()
    })    
  }
}

export default new App()