import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './App.css'
import {AuthProvider} from '../contexts/AuthContext.jsx';
import Register from '../components/Register.jsx';
import Login from '../components/Login.jsx';
import LogMood from '../components/LogMood.jsx';
import SiteNavbar from '../components/NavComponent.jsx';
import MoodTrends from '../components/MoodTrends.jsx';
// import ResetPassword from '../components/PasswordResetComponent.jsx';
import Home from '../components/HomeComponent.jsx';

function App() {


	return (
		<>

		<Router>
			<AuthProvider>

				<SiteNavbar/>
				<Routes>
					<Route path='/' element={<Home/>}/>
					<Route path='/stats' element={<MoodTrends/>}/>
					<Route path='/chat' element={<LogMood/>}/>
					<Route path="/register" element={<Register/>}/>
					<Route path="/login" element={<Login/>}/>
				</Routes>

			</AuthProvider>
		</Router>

		</>
	)
}

export default App
