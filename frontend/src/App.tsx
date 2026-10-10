import LoginPage from "./pages/LoginPage";
 
function App() {
  return (
    <LoginPage
      onLogin={(values) => console.log("login", values)}
      onSignUp={() => console.log("go to sign up")}
    />
  );
}
 
export default App;
