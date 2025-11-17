import Router from './Router'
import Auth from './Auth'
import Toast from './Toast'


class App {
  constructor(){
    this.name = "Haircuts"
    this.version = "1.0.0"
    this.apiBase = 'http://localhost:3000'
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

const App = {
  apiBase: "http://ec2-13-238-182-113.ap-southeast-2.compute.amazonaws.com:3000",
};

export default new App()
